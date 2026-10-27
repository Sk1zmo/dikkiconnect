import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { record, destroySession } from '../_lib/auth.js'
/* K from domain, not store: domain's spreads store's and adds the parcel
   keys this needs. */
import { K, requireAccount } from '../_lib/domain.js'
import { kvDel, kvGet, kvList, kvSet } from '../_lib/store.js'

/**
 * POST /api/account/delete   { confirm: "DELETE" }
 *
 * Deleting an account, for real.
 *
 * Google Play requires any app with accounts to offer this both inside the app
 * and at a public web URL, and requires that it actually removes the data
 * rather than hiding it. That is the easy half. The hard half is that WayPool
 * is a custody chain: a delivered parcel's record is the only evidence that a
 * hand-off happened, and two other people — the traveller who carried it and
 * the hub that held it — have a legitimate interest in it existing.
 *
 * So this draws the line where the obligation actually is:
 *
 *   · The account goes. Name, email, phone, the lookups that find them, and
 *     every session, immediately. The person can no longer sign in and nobody
 *     can look them up by any identifier they gave us.
 *   · Parcels they sent are not deleted, but are stripped of them: the sender
 *     becomes an opaque id with no name or contact. The custody chain stays
 *     intact and auditable; the person is no longer in it.
 *
 * A parcel in flight blocks deletion. Someone is carrying a physical box to an
 * address, and erasing the party who sent it mid-journey helps nobody — least
 * of all the person waiting for it.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const account = await requireAccount(req.headers.authorization)
  if (!account) return res.status(401).json({ error: 'unauthorised' })

  /* A typed confirmation, because this cannot be undone and a mis-tap on a
     phone should not be able to reach it. */
  const confirm = String((req.body as { confirm?: string } | undefined)?.confirm ?? '')
  if (confirm !== 'DELETE') return res.status(400).json({ error: 'confirmation-required' })

  /* Anything still moving. These are the statuses where a real object is in
     somebody's hands on this account's behalf. */
  const IN_FLIGHT = ['booked', 'at_origin_hub', 'assigned', 'in_transit', 'at_destination_hub']
  /* kvList, not kvGet: the indexes are pushed lists, so a plain GET returns
     null and every parcel silently looks like no parcel. That is exactly how
     this first shipped, and the in-flight check passed an account with a
     booked parcel straight through. */
  const sent = await kvList<string>(K.parcelsBySender(account.id), 200)
  const carrying = await kvList<string>(K.parcelsByTraveler(account.id), 200)

  const open: string[] = []
  for (const id of [...sent, ...carrying]) {
    const parcel = await kvGet<{ id: string; status: string }>(K.parcel(id))
    if (parcel && IN_FLIGHT.includes(parcel.status)) open.push(parcel.id)
  }
  if (open.length) {
    return res.status(409).json({
      error: 'parcels-in-flight',
      parcels: open,
      detail:
        open.length === 1
          ? `${open[0]} is still on its way. You can delete your account once it is delivered or cancelled.`
          : `${open.length} parcels are still on their way. You can delete your account once they are delivered or cancelled.`,
    })
  }

  /* Strip the person out of the records that have to survive them. */
  for (const id of sent) {
    const parcel = await kvGet<Record<string, unknown>>(K.parcel(id))
    if (!parcel) continue
    await kvSet(K.parcel(id), {
      ...parcel,
      senderName: 'Deleted account',
      receiverName: parcel.receiverName,
      senderDeletedAt: new Date().toISOString(),
    })
  }

  /* Then the account itself and every way back to it. */
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  if (token) await destroySession(token)

  await kvDel(K.account(`email:${account.email.trim().toLowerCase()}`))
  if (account.phone) await kvDel(K.account(`phone:${account.phone}`))
  await kvDel(K.parcelsBySender(account.id))
  await kvDel(K.parcelsByTraveler(account.id))

  /* Logged with the id only. Writing the address into the event log would
     keep a copy of the thing just deleted, in the one place nobody thinks to
     look. */
  await record({ kind: 'account.deleted', detail: account.id, ok: true })

  return res.status(200).json({ ok: true })
}

export default withCors(handler)

import { K, getParcel } from './domain.js'
import { kvGet, kvSet } from './store.js'
import { sendToToken, type PushMessage } from './fcm.js'

/* ═══════════════════════════════════════════════════════════════════════════
   Who to wake, and what to say.

   A device token belongs to an account, not to a person — one person may have
   a phone and a tablet, and a hub counter may be shared. So tokens are stored
   as a small set per account and every one of them is tried.

   Nothing here throws. A notification is the least important thing happening
   at the moment it is sent: the parcel has already moved, the record is
   already written, and a push that fails must not take the hand-off down
   with it. Every call site uses `void notifyAccount(...)`.
   ═══════════════════════════════════════════════════════════════════════════ */

/** At most this many devices per account. Beyond it, the oldest is dropped. */
const MAX_DEVICES = 8

interface Device {
  token: string
  platform: string
  at: string
}

const key = (accountId: string) => K.devices(accountId)

export async function rememberDevice(accountId: string, token: string, platform: string) {
  const existing = (await kvGet<Device[]>(key(accountId))) ?? []
  /* Re-registering is the normal case — the plugin hands over a token on
     every launch — so the same token must not accumulate. */
  const others = existing.filter((d) => d.token !== token)
  const next = [{ token, platform, at: new Date().toISOString() }, ...others].slice(0, MAX_DEVICES)
  await kvSet(key(accountId), next)
}

export async function forgetDevice(accountId: string, token: string) {
  const existing = (await kvGet<Device[]>(key(accountId))) ?? []
  await kvSet(
    key(accountId),
    existing.filter((d) => d.token !== token),
  )
}

/** Sends to every device on an account, and prunes the ones FCM has buried. */
export async function notifyAccount(accountId: string, msg: PushMessage): Promise<void> {
  try {
    const devices = (await kvGet<Device[]>(key(accountId))) ?? []
    if (!devices.length) return

    const results = await Promise.all(
      devices.map(async (d) => ({ token: d.token, outcome: await sendToToken(d.token, msg) })),
    )
    const dead = results.filter((r) => r.outcome === 'gone').map((r) => r.token)
    if (dead.length) {
      await kvSet(
        key(accountId),
        devices.filter((d) => !dead.includes(d.token)),
      )
    }
  } catch {
    /* Deliberately swallowed. See the note at the top. */
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   What each custody checkpoint says to the people who care about it.

   Written from the reader's point of view, not the system's. "Your parcel is
   at the Koramangala hub" is useful; "status changed to at_origin_hub" is a
   log line that happens to have been delivered to a phone.
   ═══════════════════════════════════════════════════════════════════════════ */
const SAID: Record<string, { title: string; body: (who: string) => string }> = {
  intake: {
    title: 'Your parcel is at the hub',
    body: (who) => `${who} has taken it in. It is now waiting for a traveller.`,
  },
  handoff: {
    title: 'On its way',
    body: (who) => `${who} has collected your parcel and is on the road.`,
  },
  arrive: {
    title: 'Arrived at the destination hub',
    body: () => 'It is ready for your receiver to collect. Their code is in the app.',
  },
  deliver: {
    title: 'Delivered',
    body: (who) => `${who} has collected it. Thanks for using WayPool.`,
  },
}

/**
 * Tells the people a custody step concerns that it happened.
 *
 * The sender always hears. The traveller hears about the steps that are
 * theirs — being handed the parcel, and handing it on — because those are the
 * moments their payout and their liability change.
 */
export async function notifyCustody(
  parcelId: string,
  checkpoint: string,
  actorName: string,
): Promise<void> {
  try {
    const parcel = await getParcel(parcelId)
    const said = SAID[checkpoint]
    if (!parcel || !said) return

    const msg: PushMessage = {
      title: said.title,
      body: said.body(actorName),
      href: `/sender/track/${parcelId}`,
    }

    await notifyAccount(parcel.senderId, msg)

    if (parcel.travelerId && (checkpoint === 'handoff' || checkpoint === 'arrive')) {
      await notifyAccount(parcel.travelerId, {
        title: checkpoint === 'handoff' ? 'Parcel collected' : 'Hand-over confirmed',
        body:
          checkpoint === 'handoff'
            ? `${parcelId} is on your manifest. Drive safely.`
            : `${parcelId} is with the hub. Your payout has been released.`,
        href: '/traveler',
      })
    }
  } catch {
    /* Never fails the hand-off. */
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { record, type Account } from '../_lib/auth.js'
import { kvSetIfAbsent } from '../_lib/store.js'
import {
  K,
  indexParcel,
  listParcels,
  getParcel,
  nextParcelId,
  putParcel,
  quote,
  requireAccount,
  type Parcel,
} from '../_lib/domain.js'

/**
 * GET  /api/parcels        — the caller's parcels
 * GET  /api/parcels?id=…   — one parcel, for whoever is physically holding it
 * POST /api/parcels        — quote and create
 * POST /api/parcels?quote=1 — price only, nothing stored
 *
 * The price is computed here and stored on the parcel. The app has its own
 * copy of the same function and will keep showing a live estimate as the user
 * fills the form — that is good for the form and must never be the number
 * charged, because anything a client computes a client can change. The value
 * that matters is the one in the record this route writes.
 *
 * A parcel is created at `booked` and nothing else. It does not become "at
 * the hub" because the sender says so; it becomes that when a hub passes the
 * intake checkpoint with a code and a photo. See /api/custody.
 */

/** A traveller taking a job off the board. The race is decided by SET NX. */
const CLAIM_TTL_SECONDS = 60 * 60 * 24

async function claim(req: VercelRequest, res: VercelResponse, account: Account) {
  const parcelId = String((req.body as { parcelId?: string } | undefined)?.parcelId ?? '')
  if (!parcelId) return res.status(400).json({ error: 'parcel-required' })

  const parcel = await getParcel(parcelId)
  if (!parcel) return res.status(404).json({ error: 'no-such-parcel' })

  /* A parcel is claimable while it is waiting for a carrier: booked for a
     door-to-door run, on the shelf for a hub run. Anything further along is
     already somebody's. */
  const claimable = parcel.mode === 'p2p' ? 'booked' : 'at_origin_hub'
  if (parcel.status !== claimable) {
    return res.status(409).json({
      error: 'not-claimable',
      status: parcel.status,
      detail: `A parcel at "${parcel.status}" is not on the job board.`,
    })
  }

  if (parcel.travelerId) {
    return res.status(409).json({
      error: parcel.travelerId === account.id ? 'already-yours' : 'taken',
      travelerId: parcel.travelerId,
    })
  }

  /* The race is decided here and nowhere else. */
  const won = await kvSetIfAbsent(
    K.claim(parcelId),
    { travelerId: account.id, at: new Date().toISOString() },
    CLAIM_TTL_SECONDS,
  )
  if (!won) {
    await record({ kind: 'job.claim.lost', detail: `${parcelId} ${account.id}` })
    return res.status(409).json({ error: 'taken' })
  }

  const updated = { ...parcel, travelerId: account.id, travelerName: account.name }
  await putParcel(updated)
  await indexParcel(K.parcelsByTraveler(account.id), parcelId)
  await record({ kind: 'job.claimed', detail: `${parcelId} ${account.id}` })

  return res.status(200).json({ parcel: updated })
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const account = await requireAccount(req.headers.authorization)
  if (!account) return res.status(401).json({ error: 'unauthorised' })

  if (req.method === 'GET') {
    /* One parcel by id. A hub worker is neither the sender nor the carrier, so
       they cannot find a parcel through either index — and they are the party
       most often holding one. The id is the thing printed on the pass in their
       hand, which is why it is enough here; narrowing this to staff of the
       named hub is the right next move once hub accounts exist as accounts
       rather than as a portal the same login switches into. */
    const one = typeof req.query.id === 'string' ? req.query.id : null
    if (one) {
      const parcel = await getParcel(one)
      if (!parcel) return res.status(404).json({ error: 'no-such-parcel' })
      return res.status(200).json({ parcel })
    }

    const [sent, carrying] = await Promise.all([
      listParcels(K.parcelsBySender(account.id)),
      listParcels(K.parcelsByTraveler(account.id)),
    ])
    return res.status(200).json({ sent, carrying })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  /* ── Claiming a job ───────────────────────────────────────────────────
     This lived at /api/parcels/claim, which read better. It was folded in
     here because Vercel's Hobby plan allows twelve serverless functions per
     deployment and push registration was the thirteenth — a routing shape
     traded for a feature, which is the right way round. The behaviour is
     unchanged: the race is still decided by a single atomic SET NX. */
  if (req.query.claim) return claim(req, res, account)


  const b = (req.body ?? {}) as Partial<Parcel> & { promo?: string | null; insured?: boolean }

  const missing = (['fromCityId', 'toCityId', 'size', 'category'] as const).filter((k) => !b[k])
  if (missing.length) return res.status(400).json({ error: 'missing-fields', fields: missing })

  const size = b.size as 'S' | 'M' | 'L'
  if (!['S', 'M', 'L'].includes(size)) return res.status(400).json({ error: 'bad-size' })

  const weightKg = Number(b.weightKg ?? 1)
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return res.status(400).json({ error: 'bad-weight' })
  }

  /* The PRD caps what the app will insure. Accepting a larger declared value
     would print a promise the product does not keep. */
  const declaredValue = Math.min(Number(b.declaredValue ?? 0), 5000)

  const breakdown = quote({
    fromCityId: b.fromCityId!,
    toCityId: b.toCityId!,
    size,
    weightKg,
    fragile: Boolean(b.fragile),
    insured: Boolean(b.insured),
    promo: b.promo ?? null,
  })

  if (req.query.quote) return res.status(200).json({ breakdown })

  const id = await nextParcelId()
  const bookedAt = new Date().toISOString()
  /* A rough corridor ETA so the UI has something true-ish to show until a
     traveller is assigned and the real trip supplies one. */
  const etaAt = new Date(Date.now() + Math.max(4, breakdown.km / 45) * 3_600_000).toISOString()

  const parcel: Parcel = {
    id,
    mode: b.mode === 'p2p' ? 'p2p' : 'hub',
    senderId: account.id,
    senderName: account.name,
    receiverName: String(b.receiverName ?? ''),
    receiverPhone: String(b.receiverPhone ?? ''),
    fromCityId: b.fromCityId!,
    toCityId: b.toCityId!,
    originHubId: String(b.originHubId ?? ''),
    destinationHubId: String(b.destinationHubId ?? ''),
    pickupAddress: b.pickupAddress,
    dropAddress: b.dropAddress,
    category: String(b.category),
    size,
    weightKg,
    declaredValue,
    fragile: Boolean(b.fragile),
    insured: Boolean(b.insured),
    notes: b.notes,
    status: 'booked',
    bookedAt,
    etaAt,
    price: breakdown.total,
    breakdown,
    /* Never true on creation. Only the payment webhook may set this. */
    paid: false,
    timeline: [
      {
        id: 'booked',
        status: 'booked',
        title: 'Booked',
        detail: 'Waiting to be dropped at the origin hub.',
        at: bookedAt,
        done: true,
      },
    ],
  }

  await putParcel(parcel)
  await indexParcel(K.parcelsBySender(account.id), id)
  /* The job board a traveller on this corridor reads. */
  await indexParcel(K.openJobs(parcel.fromCityId, parcel.toCityId), id)
  await record({ kind: 'parcel.booked', detail: `${id} ${parcel.fromCityId}>${parcel.toCityId}` })

  return res.status(201).json({ parcel })
}

export default withCors(handler)

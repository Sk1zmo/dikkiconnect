import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { notifyCustody } from '../_lib/notify.js'
import { record } from '../_lib/auth.js'
import {
  appendCustody,
  canTransition,
  checkHandoffOtp,
  getParcel,
  issueHandoffOtp,
  putParcel,
  requireAccount,
  statusAfter,
  timelineEntry,
  type Checkpoint,
} from '../_lib/domain.js'

/**
 * Custody — the four physical hand-offs, and the only way a parcel moves.
 *
 *   GET  /api/custody/:checkpoint?parcel=WYP-4861
 *        Issues (or re-reads) the code the GIVING party shows. Only the
 *        party currently holding the parcel may ask for it.
 *
 *   POST /api/custody/:checkpoint   { parcelId, code, photoIds, coords? }
 *        The RECEIVING party submits the code they were shown. The server
 *        compares, advances the status, and writes an immutable event.
 *
 * Three rules are enforced here rather than trusted from the client, because
 * each one is a way the chain could otherwise be forged:
 *
 *   1. The transition must be legal from the parcel's CURRENT status. A
 *      parcel cannot be delivered from a shelf it never reached, and the
 *      order is fixed — see TRANSITION in _lib/domain.
 *   2. The code must match the one this server issued for THIS parcel and
 *      THIS checkpoint. It is single-use and expires.
 *   3. A photo must accompany the hand-off. The product's promise is "an OTP
 *      and a photo"; a hand-off without one is not evidence, and accepting it
 *      would make the claim false everywhere it is printed.
 *
 * The prototype let one device reveal a code to itself, because there was
 * only ever one device. That cannot survive two real parties and has no
 * equivalent here: the code is never returned to whoever is about to enter it.
 */
const CHECKPOINTS: Checkpoint[] = ['intake', 'handoff', 'arrive', 'deliver']

function parseCheckpoint(raw: unknown): Checkpoint | null {
  const v = Array.isArray(raw) ? raw[0] : raw
  return CHECKPOINTS.includes(v as Checkpoint) ? (v as Checkpoint) : null
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const checkpoint = parseCheckpoint(req.query.checkpoint)
  if (!checkpoint) return res.status(404).json({ error: 'unknown-checkpoint' })

  const account = await requireAccount(req.headers.authorization)
  if (!account) return res.status(401).json({ error: 'unauthorised' })

  /* ── Show the code ──────────────────────────────────────────────────── */
  if (req.method === 'GET') {
    const parcelId = String(req.query.parcel ?? '')
    const parcel = await getParcel(parcelId)
    if (!parcel) return res.status(404).json({ error: 'no-such-parcel' })

    if (!canTransition(parcel.status, checkpoint)) {
      return res.status(409).json({
        error: 'out-of-order',
        status: parcel.status,
        detail: `A parcel at "${parcel.status}" cannot pass the ${checkpoint} checkpoint.`,
      })
    }

    const code = await issueHandoffOtp(parcelId, checkpoint)
    return res.status(200).json({ parcelId, checkpoint, code })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  /* ── Complete the hand-off ──────────────────────────────────────────── */
  const { parcelId, code, photoId, photoIds, coords } = (req.body ?? {}) as {
    parcelId?: string
    code?: string
    photoId?: string
    photoIds?: string[]
    coords?: { lat: number; lng: number }
  }

  if (!parcelId || !code) return res.status(400).json({ error: 'parcel-and-code-required' })

  /* The photo is not optional. Letting it through "just this once" is how an
     evidence chain quietly becomes a status field. */
  const shots = (Array.isArray(photoIds) ? photoIds : photoId ? [photoId] : [])
    .filter((id): id is string => typeof id === 'string' && /^[0-9a-f]{32}$/.test(id))
  if (!shots.length) return res.status(400).json({ error: 'photo-required' })

  const parcel = await getParcel(parcelId)
  if (!parcel) return res.status(404).json({ error: 'no-such-parcel' })

  if (!canTransition(parcel.status, checkpoint)) {
    return res.status(409).json({
      error: 'out-of-order',
      status: parcel.status,
      detail: `A parcel at "${parcel.status}" cannot pass the ${checkpoint} checkpoint.`,
    })
  }

  const verdict = await checkHandoffOtp(parcelId, checkpoint, code)
  if (!verdict.ok) {
    await record({
      kind: 'custody.otp.failed',
      detail: `${parcelId} ${checkpoint} ${verdict.reason}`,
    })
    return res.status(verdict.reason === 'locked' ? 423 : 401).json({
      error: verdict.reason,
      attemptsLeft: verdict.attemptsLeft,
    })
  }

  const next = statusAfter(checkpoint)
  const entry = timelineEntry(checkpoint, account.name ?? 'Unknown', shots.length)

  const updated = {
    ...parcel,
    status: next,
    /* Append-only: the timeline grows, it is never rewritten. */
    timeline: [...parcel.timeline, entry],
    ...(checkpoint === 'handoff' ? { travelerId: account.id } : {}),
  }
  await putParcel(updated)

  const event = await appendCustody({
    parcelId,
    checkpoint,
    actorId: account.id,
    actorName: account.name ?? 'Unknown',
    otpVerified: true,
    photoIds: shots,
    coords,
  })

  await record({ kind: 'custody.advanced', detail: `${parcelId} -> ${next}` })

  /* Tell the people waiting. Deliberately not awaited: the parcel has already
     moved and the event is already written, so a slow or failed push must not
     hold up the response to somebody standing at a counter. */
  void notifyCustody(parcelId, checkpoint, account.name ?? 'Someone')

  return res.status(200).json({ parcel: updated, event })
}

export default withCors(handler)

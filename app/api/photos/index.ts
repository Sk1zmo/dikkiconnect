import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { record } from '../_lib/auth.js'
import { K, requireAccount } from '../_lib/domain.js'
import { kvGet, kvSet } from '../_lib/store.js'

/**
 * Hand-over photographs.
 *
 *   POST /api/photos   { dataUrl, parcelId?, checkpoint? }  → { photoId }
 *   GET  /api/photos?id=…                                   → the image bytes
 *
 * ── Why the bytes live in the same store as everything else ───────────────
 * An object store would be the right home for these and should be where they
 * end up. It is also another vendor, another credential and another thing to
 * get wrong, and the product cannot wait for it: the custody route refuses a
 * hand-off without a photo, so with nowhere to put one the entire chain is
 * unusable. The client downscales to a long edge of 1280 and re-encodes as
 * JPEG, which puts a hand-over shot in the region of 80–150 KB — small enough
 * to sit beside the parcel record and large enough to read a label off.
 *
 * `MAX_BYTES` is the line. It is a deliberate ceiling rather than a guess at
 * what a phone will send, because the browser's compression settings are a
 * client input and anything a client controls has to be bounded here.
 *
 * Photographs are evidence in a dispute, so they are written once and never
 * updated: the id is derived from nothing the caller supplies and no route
 * overwrites an existing key.
 */

/** 1 MB of base64 ≈ 750 KB of image. Generous for a downscaled JPEG. */
const MAX_BYTES = 1_000_000

/** Kept for two years — longer than any dispute window the product promises. */
const TTL_SECONDS = 60 * 60 * 24 * 730

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'] as const

interface StoredPhoto {
  id: string
  contentType: string
  /** base64, without the data-URL preamble. */
  body: string
  bytes: number
  accountId: string
  parcelId?: string
  checkpoint?: string
  at: string
}

const photoKey = (id: string) => K.photo(id)

function newId() {
  /* 16 bytes of randomness. The id is the only thing standing between a
     photograph of someone's parcel and anyone who can guess a URL, so it is
     not a counter and not derived from the parcel number. */
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function parseDataUrl(raw: unknown): { contentType: string; body: string } | null {
  if (typeof raw !== 'string') return null
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(raw.trim())
  if (!m) return null
  const [, contentType, body] = m
  if (!(ALLOWED as readonly string[]).includes(contentType)) return null
  return { contentType, body }
}

async function handler(req: VercelRequest, res: VercelResponse) {
  /* ── Serve one ─────────────────────────────────────────────────────────
     Reading a photo needs a session but not ownership of the parcel: a hub
     manager, a traveller and a receiver all legitimately look at the same
     hand-over shot, and the id is unguessable. Tightening this to the parties
     on the parcel is the right next move once disputes have an owner. */
  if (req.method === 'GET') {
    const account = await requireAccount(req.headers.authorization)
    if (!account) return res.status(401).json({ error: 'unauthorised' })

    const id = String(req.query.id ?? '')
    if (!/^[0-9a-f]{32}$/.test(id)) return res.status(400).json({ error: 'bad-id' })

    const photo = await kvGet<StoredPhoto>(photoKey(id))
    if (!photo) return res.status(404).json({ error: 'no-such-photo' })

    /* JSON with a data URL rather than raw bytes, because the only consumer
       is an <img> inside the app and an img src cannot carry a bearer token.
       It costs a third more bytes than the binary would and saves routing a
       credential through a URL, which is the trade worth making. */
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable')
    return res.status(200).json({
      photoId: photo.id,
      contentType: photo.contentType,
      dataUrl: `data:${photo.contentType};base64,${photo.body}`,
      at: photo.at,
      parcelId: photo.parcelId,
      checkpoint: photo.checkpoint,
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const account = await requireAccount(req.headers.authorization)
  if (!account) return res.status(401).json({ error: 'unauthorised' })

  const { dataUrl, parcelId, checkpoint } = (req.body ?? {}) as {
    dataUrl?: string
    parcelId?: string
    checkpoint?: string
  }

  const parsed = parseDataUrl(dataUrl)
  if (!parsed) return res.status(400).json({ error: 'bad-image' })

  const bytes = Math.floor((parsed.body.length * 3) / 4)
  if (bytes > MAX_BYTES) {
    return res.status(413).json({ error: 'too-large', bytes, limit: MAX_BYTES })
  }

  const id = newId()
  const photo: StoredPhoto = {
    id,
    contentType: parsed.contentType,
    body: parsed.body,
    bytes,
    accountId: account.id,
    parcelId: parcelId ? String(parcelId) : undefined,
    checkpoint: checkpoint ? String(checkpoint) : undefined,
    at: new Date().toISOString(),
  }

  await kvSet(photoKey(id), photo, TTL_SECONDS)
  await record({
    kind: 'photo.stored',
    detail: `${id} ${bytes}b ${parcelId ?? '-'} ${checkpoint ?? '-'}`,
  })

  return res.status(201).json({ photoId: id, bytes })
}

export default withCors(handler)

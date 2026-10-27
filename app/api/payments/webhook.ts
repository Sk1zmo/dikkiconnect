import type { VercelRequest, VercelResponse } from '@vercel/node'
import { record } from '../_lib/auth.js'
import { getParcel, putParcel } from '../_lib/domain.js'
import { readWebhook, verifyRazorpaySignature } from '../_lib/payments.js'

/**
 * POST /api/payments/webhook
 *
 * The only thing in WayPool allowed to mark a parcel paid.
 *
 * ── Why this is not behind withCors ──────────────────────────────────────
 * A payment provider's server is not a browser. It sends no Origin header and
 * does not preflight, so CORS is irrelevant here — and worse, wrapping this in
 * the browser allow-list would imply a browser is a legitimate caller. Nothing
 * with a browser attached should ever reach this route.
 *
 * ── Why the raw body matters ─────────────────────────────────────────────
 * The signature is computed over the exact bytes the provider sent. Letting
 * the platform parse the JSON first and re-serialising it to check the
 * signature would compare a signature against a different string — key order
 * and whitespace are not preserved — and every real webhook would be rejected
 * while a forged one with matching formatting sailed through. So the body is
 * read raw and parsed only after it has been proven.
 */
export const config = { api: { bodyParser: false } }

function rawBody(req: VercelRequest): Promise<string | null> {
  /* If something upstream has already consumed the stream there is no way to
     recover the original bytes, and re-serialising the parsed object would
     produce a different string with the same meaning — enough to fail every
     real signature. Returning null so the caller can refuse is the only
     honest option; guessing would quietly break verification. */
  if (typeof (req as { on?: unknown }).on !== 'function') return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const raw = await rawBody(req)
  if (raw === null) {
    await record({ kind: 'payment.webhook.no-raw-body', ok: false })
    return res.status(400).json({ error: 'raw-body-unavailable' })
  }
  const signature = String(req.headers['x-razorpay-signature'] ?? '')

  /* Razorpay signs every delivery. An unsigned or wrongly signed body is
     someone pretending to be a payment, and is logged as exactly that. */
  if (signature && !verifyRazorpaySignature(raw, signature)) {
    await record({ kind: 'payment.webhook.bad-signature', ok: false })
    return res.status(401).json({ error: 'bad-signature' })
  }

  /* PayPal's verification needs a call back to PayPal with the transmission
     headers. Until that is wired, a PayPal webhook is accepted only when no
     Razorpay signature is present AND the route has been told to trust it —
     an explicit opt-in, so nobody is paid-for-free by default. */
  if (!signature && process.env.PAYPAL_WEBHOOK_TRUSTED !== '1') {
    await record({ kind: 'payment.webhook.unverified', ok: false })
    return res.status(401).json({ error: 'unverified' })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return res.status(400).json({ error: 'bad-json' })
  }

  const read = readWebhook(body)
  if (!read) return res.status(202).json({ ok: true, ignored: 'unrecognised-event' })
  if (!read.paid) return res.status(202).json({ ok: true, ignored: 'not-a-payment' })

  const parcel = await getParcel(read.parcelId)
  if (!parcel) {
    await record({ kind: 'payment.webhook.no-parcel', detail: read.parcelId, ok: false })
    /* 200, not 404: the provider would otherwise retry this forever. */
    return res.status(200).json({ ok: true, ignored: 'no-such-parcel' })
  }

  /* Idempotent. Providers retry, and a parcel paid twice is a refund call. */
  if (parcel.paid) return res.status(200).json({ ok: true, alreadyPaid: true })

  await putParcel({ ...parcel, paid: true, paidAt: new Date().toISOString() })
  await record({ kind: 'payment.received', detail: `${read.parcelId} ₹${parcel.price}` })

  return res.status(200).json({ ok: true })
}

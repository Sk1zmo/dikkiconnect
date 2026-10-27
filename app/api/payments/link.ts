import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { record } from '../_lib/auth.js'
import { K, getParcel, putParcel, requireAccount } from '../_lib/domain.js'
import { configuredProvider, createPaymentLink } from '../_lib/payments.js'
import { kvSet } from '../_lib/store.js'

/**
 * POST /api/payments/link   { parcelId }
 *
 * Returns a URL the sender opens to pay, in their own bank or wallet app.
 *
 * The amount is read from the stored parcel, never from the request. A client
 * that could name its own price would be the whole problem — the server
 * already computed what this parcel costs when it was booked, and that number
 * is the only one allowed anywhere near a payment.
 *
 * Creating a link does not make anything paid. Only the webhook does.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const account = await requireAccount(req.headers.authorization)
  if (!account) return res.status(401).json({ error: 'unauthorised' })

  const provider = configuredProvider()
  if (!provider) {
    /* Said plainly rather than failing obscurely: a pilot without a gateway
       is a normal state, and the app shows the UPI hand-off instead. */
    return res.status(503).json({
      error: 'no-payment-provider',
      detail:
        'No payment gateway is configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (India), or PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (cross-border).',
    })
  }

  const parcelId = String((req.body as { parcelId?: string } | undefined)?.parcelId ?? '')
  const parcel = await getParcel(parcelId)
  if (!parcel) return res.status(404).json({ error: 'no-such-parcel' })

  /* Only the sender pays for their own parcel. */
  if (parcel.senderId !== account.id) return res.status(403).json({ error: 'not-yours' })
  if (parcel.paid) return res.status(409).json({ error: 'already-paid' })

  const origin =
    (req.headers['x-forwarded-proto'] && req.headers.host
      ? `${req.headers['x-forwarded-proto']}://${req.headers.host}`
      : process.env.PUBLIC_ORIGIN) ?? 'https://dikkiconnect-mail.vercel.app'

  try {
    const link = await createPaymentLink({
      parcelId,
      amountInr: parcel.price,
      name: account.name,
      email: account.email,
      phone: account.phone || undefined,
      origin,
    })

    /* Kept so a webhook arriving later can be checked against a link we
       actually issued, and so the app can show the same link again rather
       than creating a second one for the same parcel. */
    await kvSet(K.paymentLink(parcelId), {
      ...link,
      amountInr: parcel.price,
      at: new Date().toISOString(),
    })
    await putParcel({ ...parcel, paymentReference: link.reference })
    await record({ kind: 'payment.link.created', detail: `${parcelId} ${link.provider}` })

    return res.status(200).json(link)
  } catch (e) {
    await record({ kind: 'payment.link.failed', detail: `${parcelId} ${String(e)}`, ok: false })
    return res.status(502).json({ error: 'provider-refused', detail: String(e).slice(0, 200) })
  }
}

export default withCors(handler)

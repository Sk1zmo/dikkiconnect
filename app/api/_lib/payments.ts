import { createHmac, timingSafeEqual } from 'node:crypto'

/* ═══════════════════════════════════════════════════════════════════════════
   Payment links.

   A payment link is a URL the payer opens in their own bank or wallet app.
   The app never touches a card number, which is why this is the right shape
   for a pilot: there is no PCI surface to secure and nothing to store.

   ── The rule the whole file exists to enforce ─────────────────────────────
   The app may NEVER mark a parcel paid. Only a signed webhook from the
   provider may. Until now `paid` was set from the device, on the strength of
   a person tapping "I've paid" after being sent to their UPI app — which is
   a claim, not a payment, and Android gives a browser no trustworthy way to
   learn the difference.

   ── On PayPal, in India ───────────────────────────────────────────────────
   PayPal stopped supporting DOMESTIC payments in India on 1 April 2021. An
   Indian business can receive cross-border payments through it and nothing
   else, so it cannot charge a sender in Bangalore for a parcel to Mysore —
   the entire pilot corridor. It is implemented here because it is genuinely
   useful for an overseas payer, and because asking for it and silently not
   building it would be worse. For domestic rupees the provider has to be an
   Indian gateway; Razorpay is wired up below and takes UPI, cards and net
   banking from one link.

   Whichever is configured, the webhook rule above does not change.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Provider = 'razorpay' | 'paypal'

const RZP_KEY = process.env.RAZORPAY_KEY_ID
const RZP_SECRET = process.env.RAZORPAY_KEY_SECRET
const RZP_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

const PP_CLIENT = process.env.PAYPAL_CLIENT_ID
const PP_SECRET = process.env.PAYPAL_CLIENT_SECRET
/* Sandbox unless explicitly told otherwise. Defaulting to live would mean a
   misconfiguration takes real money. */
const PP_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

export function configuredProvider(): Provider | null {
  if (RZP_KEY && RZP_SECRET) return 'razorpay'
  if (PP_CLIENT && PP_SECRET) return 'paypal'
  return null
}

export interface PaymentLink {
  provider: Provider
  /** Where to send the payer. */
  url: string
  /** The provider's own id, so a webhook can be matched back to a parcel. */
  reference: string
}

/* ── Razorpay ──────────────────────────────────────────────────────────────
   Payment Links API. One call, one URL, and the webhook does the rest.
   ────────────────────────────────────────────────────────────────────────── */
async function razorpayLink(input: {
  parcelId: string
  amountPaise: number
  name: string
  email: string
  phone?: string
  callbackUrl: string
}): Promise<PaymentLink> {
  const auth = Buffer.from(`${RZP_KEY}:${RZP_SECRET}`).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: 'INR',
      accept_partial: false,
      description: `WayPool parcel ${input.parcelId}`,
      customer: {
        name: input.name,
        email: input.email,
        ...(input.phone ? { contact: `+91${input.phone}` } : {}),
      },
      /* The parcel id travels with the payment so the webhook can find it
         again without us keeping a second table to map them. */
      notes: { parcelId: input.parcelId },
      notify: { sms: false, email: true },
      reminder_enable: true,
      callback_url: input.callbackUrl,
      callback_method: 'get',
    }),
  })
  const body = (await res.json()) as { id?: string; short_url?: string; error?: { description?: string } }
  if (!res.ok || !body.short_url || !body.id) {
    throw new Error(body.error?.description ?? `razorpay ${res.status}`)
  }
  return { provider: 'razorpay', url: body.short_url, reference: body.id }
}

/* ── PayPal ────────────────────────────────────────────────────────────────
   Orders v2. Cross-border only from an Indian account; see the note above.
   ────────────────────────────────────────────────────────────────────────── */
async function paypalToken(): Promise<string> {
  const auth = Buffer.from(`${PP_CLIENT}:${PP_SECRET}`).toString('base64')
  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const body = (await res.json()) as { access_token?: string; error_description?: string }
  if (!body.access_token) throw new Error(body.error_description ?? 'paypal auth failed')
  return body.access_token
}

async function paypalLink(input: {
  parcelId: string
  amountMajor: string
  currency: string
  returnUrl: string
  cancelUrl: string
}): Promise<PaymentLink> {
  const token = await paypalToken()
  const res = await fetch(`${PP_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          /* PayPal echoes this back on the webhook, so it is the parcel id. */
          custom_id: input.parcelId,
          description: `WayPool parcel ${input.parcelId}`,
          amount: { currency_code: input.currency, value: input.amountMajor },
        },
      ],
      application_context: {
        brand_name: 'WayPool',
        user_action: 'PAY_NOW',
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  })
  const body = (await res.json()) as {
    id?: string
    links?: Array<{ rel: string; href: string }>
    message?: string
  }
  const approve = body.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action')
  if (!res.ok || !approve || !body.id) throw new Error(body.message ?? `paypal ${res.status}`)
  return { provider: 'paypal', url: approve.href, reference: body.id }
}

export async function createPaymentLink(input: {
  parcelId: string
  /** Rupees. Converted to the smallest unit for whichever provider is live. */
  amountInr: number
  name: string
  email: string
  phone?: string
  origin: string
}): Promise<PaymentLink> {
  const provider = configuredProvider()
  if (!provider) throw new Error('no-payment-provider')

  const back = `${input.origin}/sender/track`
  if (provider === 'razorpay') {
    return razorpayLink({
      parcelId: input.parcelId,
      amountPaise: Math.round(input.amountInr * 100),
      name: input.name,
      email: input.email,
      phone: input.phone,
      callbackUrl: back,
    })
  }
  return paypalLink({
    parcelId: input.parcelId,
    amountMajor: input.amountInr.toFixed(2),
    currency: process.env.PAYPAL_CURRENCY ?? 'USD',
    returnUrl: back,
    cancelUrl: back,
  })
}

/* ── Verifying what comes back ─────────────────────────────────────────────
   A webhook endpoint is a public URL that marks things paid, so an unsigned
   one is a button labelled "give me a free parcel". Razorpay signs with
   HMAC-SHA256 over the raw body; the comparison is constant-time, because a
   fast rejection leaks how much of a forged signature was right.
   ────────────────────────────────────────────────────────────────────────── */
export function verifyRazorpaySignature(rawBody: string, signature: string): boolean {
  if (!RZP_WEBHOOK_SECRET || !signature) return false
  const expected = createHmac('sha256', RZP_WEBHOOK_SECRET).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Which parcel a webhook is about, and whether it is actually paid. */
export function readWebhook(body: unknown): { parcelId: string; paid: boolean } | null {
  const e = body as {
    event?: string
    payload?: { payment_link?: { entity?: { notes?: { parcelId?: string }; status?: string } } }
    event_type?: string
    resource?: { custom_id?: string; status?: string }
  }

  /* Razorpay */
  if (typeof e.event === 'string') {
    const entity = e.payload?.payment_link?.entity
    const parcelId = entity?.notes?.parcelId
    if (!parcelId) return null
    return { parcelId, paid: e.event === 'payment_link.paid' || entity?.status === 'paid' }
  }

  /* PayPal */
  if (typeof e.event_type === 'string') {
    const parcelId = e.resource?.custom_id
    if (!parcelId) return null
    return {
      parcelId,
      paid:
        e.event_type === 'PAYMENT.CAPTURE.COMPLETED' ||
        e.event_type === 'CHECKOUT.ORDER.APPROVED',
    }
  }

  return null
}

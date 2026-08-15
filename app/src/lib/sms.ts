/* ═══════════════════════════════════════════════════════════════════════════
   SMS delivery.

   Sending a text to an Indian number needs three things this app cannot
   contain: a licensed gateway account, a DLT-registered sender ID and
   template, and a server to hold the API key — a key shipped in a browser
   bundle is a key anyone can read and spend.

   So this module is an adapter, not a fake. Point `VITE_SMS_ENDPOINT` at
   something that can send (your own backend route, an MSG91/Twilio-fronting
   function) and every OTP in the app goes out over real SMS with no other
   change. Leave it unset and delivery reports itself as unconfigured, and the
   verification screen shows the code in-app instead — the code itself is
   already real either way.

   Below the sender sits WebOTP, which is the part that actually improves the
   experience today: on Android Chrome it reads an arriving OTP and fills the
   form without the user leaving the app.
   ═══════════════════════════════════════════════════════════════════════════ */

export type SmsResult =
  | { sent: true; provider: string }
  | { sent: false; reason: 'unconfigured' | 'failed'; detail?: string }

const ENDPOINT = import.meta.env.VITE_SMS_ENDPOINT as string | undefined
const SENDER = (import.meta.env.VITE_SMS_SENDER as string | undefined) ?? 'DIKKIC'

/** True when a delivery endpoint is configured for this build. */
export const smsConfigured = () => Boolean(ENDPOINT)

/**
 * Sends one OTP.
 *
 * The payload is deliberately provider-neutral — phone, code, template — so
 * the endpoint on the other side can front MSG91, Twilio, Gupshup or anything
 * else without this file knowing which.
 */
export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  if (!ENDPOINT) return { sent: false, reason: 'unconfigured' }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: `+91${phone.replace(/\D/g, '').slice(-10)}`,
        sender: SENDER,
        code,
        // The DLT-approved template body. The trailing `@` and `#` lines are
        // what WebOTP keys off; changing them breaks autofill.
        text: `${code} is your DikkiConnect verification code. Valid for 5 minutes. Do not share it with anyone.`,
      }),
    })
    if (!res.ok) {
      return { sent: false, reason: 'failed', detail: `HTTP ${res.status}` }
    }
    return { sent: true, provider: new URL(ENDPOINT).host }
  } catch (err) {
    return { sent: false, reason: 'failed', detail: String(err).slice(0, 120) }
  }
}

/* ── WebOTP ──────────────────────────────────────────────────────────────── */

interface OtpCredentialRequest extends CredentialRequestOptions {
  otp: { transport: string[] }
}

/**
 * Waits for an SMS to arrive and returns the code inside it.
 *
 * Chrome on Android only. Requires the message to end with a line of the form
 * `@your-domain.com #123456` — without it the browser will not surface the
 * message to the page, by design.
 *
 * Returns null on any browser that does not support it, so callers can attach
 * this unconditionally.
 */
export function awaitSmsCode(signal?: AbortSignal): Promise<string | null> {
  if (typeof navigator === 'undefined' || !('OTPCredential' in window)) {
    return Promise.resolve(null)
  }
  return navigator.credentials
    .get({ otp: { transport: ['sms'] }, signal } as OtpCredentialRequest)
    .then((cred) => (cred as (Credential & { code?: string }) | null)?.code ?? null)
    .catch(() => null)
}

/** Does this browser support reading an incoming SMS? */
export const canAutofillSms = () => typeof window !== 'undefined' && 'OTPCredential' in window

/* ═══════════════════════════════════════════════════════════════════════════
   SMS delivery, server side.

   Three providers, because which one you can actually get depends on paperwork
   you may or may not have finished:

     · MSG91     — the usual Indian choice. Needs DLT registration (company
                   PAN/GST) and an approved template, but once you have those
                   it is cheap and reliable, and its OTP endpoint handles
                   retries for you.
     · Fast2SMS  — Indian, and its "otp" route can send without a per-template
                   DLT approval on some plans, which makes it the fastest way
                   to get a working code today.
     · Twilio    — no Indian paperwork on your side, but messages to Indian
                   numbers route internationally and DND-registered numbers
                   often drop them. Fine for testing, unreliable for a launch.

   Whichever is configured wins, in that order. None configured reports
   `unconfigured` and the caller falls back to email — nothing pretends.

   Every key is read from the environment here, on the server. That is the
   whole reason this file exists rather than living in the app: a key shipped
   in a browser bundle is a key anyone can read and spend.
   ═══════════════════════════════════════════════════════════════════════════ */

export type SmsResult =
  | { sent: true; provider: string; id?: string }
  | { sent: false; reason: 'unconfigured' | 'failed'; detail?: string; provider?: string }

const MSG91_KEY = process.env.MSG91_AUTH_KEY
const MSG91_TEMPLATE = process.env.MSG91_TEMPLATE_ID
const MSG91_SENDER = process.env.MSG91_SENDER_ID ?? 'DIKKIC'

const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER

export function smsProvider(): 'msg91' | 'fast2sms' | 'twilio' | null {
  if (MSG91_KEY && MSG91_TEMPLATE) return 'msg91'
  if (FAST2SMS_KEY) return 'fast2sms'
  if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) return 'twilio'
  return null
}

export const smsConfigured = () => smsProvider() !== null

/** Ten digits, no country code — every Indian provider wants it that way. */
const local = (phone: string) => phone.replace(/\D/g, '').slice(-10)

async function viaMsg91(phone: string, code: string): Promise<SmsResult> {
  const url = new URL('https://control.msg91.com/api/v5/otp')
  url.searchParams.set('template_id', MSG91_TEMPLATE!)
  url.searchParams.set('mobile', `91${local(phone)}`)
  url.searchParams.set('otp', code)
  url.searchParams.set('sender', MSG91_SENDER)

  const res = await fetch(url, { method: 'POST', headers: { authkey: MSG91_KEY! } })
  const body = (await res.json().catch(() => ({}))) as { type?: string; message?: string }
  if (!res.ok || body.type === 'error') {
    return { sent: false, reason: 'failed', provider: 'msg91', detail: body.message ?? `HTTP ${res.status}` }
  }
  return { sent: true, provider: 'msg91', id: body.message }
}

async function viaFast2Sms(phone: string, code: string): Promise<SmsResult> {
  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: FAST2SMS_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route: 'otp',
      variables_values: code,
      numbers: local(phone),
      flash: 0,
    }),
  })
  const body = (await res.json().catch(() => ({}))) as {
    return?: boolean
    message?: string | string[]
    request_id?: string
  }
  if (!res.ok || body.return === false) {
    const detail = Array.isArray(body.message) ? body.message.join('; ') : body.message
    return { sent: false, reason: 'failed', provider: 'fast2sms', detail: detail ?? `HTTP ${res.status}` }
  }
  return { sent: true, provider: 'fast2sms', id: body.request_id }
}

async function viaTwilio(phone: string, code: string): Promise<SmsResult> {
  const body = new URLSearchParams({
    To: `+91${local(phone)}`,
    From: TWILIO_FROM!,
    Body: `${code} is your DikkiConnect verification code. Valid for 5 minutes. Do not share it.`,
  })
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
  )
  const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string }
  if (!res.ok) {
    return { sent: false, reason: 'failed', provider: 'twilio', detail: json.message ?? `HTTP ${res.status}` }
  }
  return { sent: true, provider: 'twilio', id: json.sid }
}

export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  const provider = smsProvider()
  if (!provider) return { sent: false, reason: 'unconfigured' }

  try {
    if (provider === 'msg91') return await viaMsg91(phone, code)
    if (provider === 'fast2sms') return await viaFast2Sms(phone, code)
    return await viaTwilio(phone, code)
  } catch (err) {
    return { sent: false, reason: 'failed', provider, detail: String(err).slice(0, 160) }
  }
}

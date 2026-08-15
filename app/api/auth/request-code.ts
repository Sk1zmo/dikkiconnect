import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import {
  OTP_TTL_SECONDS,
  findAccount,
  issueChallenge,
  mask,
  parseIdentifier,
  record,
} from '../_lib/auth.js'
import { mailConfigured, otpEmail, sendMail } from '../_lib/mail.js'
import { sendOtpSms, smsConfigured } from '../_lib/sms.js'

/**
 * POST /api/auth/request-code   { identifier }
 *
 * Issues a verification code and delivers it. The response says which channel
 * carried it and whether it left the building — no code, no hash, no hint. A
 * caller learns only what it already knew: that it asked.
 *
 * It also does not reveal whether the identifier belongs to an existing
 * account, so this cannot be used to enumerate who has signed up.
 *
 * Channel choice, in order:
 *   · a phone number goes by SMS if a gateway is configured;
 *   · otherwise, and for any email identifier, it goes by email — for a phone
 *     number that means the address on that account, which is why signup
 *     collects one.
 * If the first choice fails at the provider, the other is tried before giving
 * up, because a code that arrives by the wrong channel still beats no code.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const id = parseIdentifier(String(req.body?.identifier ?? ''))
  if (!id) return res.status(400).json({ error: 'bad-identifier' })

  const issued = await issueChallenge(id)
  if (!issued.ok) {
    await record({ kind: 'otp.throttled', identifier: mask(id.value), ok: false })
    return res.status(429).json({ error: 'too-soon', retryInSeconds: issued.retryInSeconds })
  }

  const minutes = Math.round(OTP_TTL_SECONDS / 60)
  const account = id.kind === 'phone' ? await findAccount(id) : null

  const phone = id.kind === 'phone' ? id.value : (account?.phone ?? null)
  const email = id.kind === 'email' ? id.value : (account?.email ?? null)

  const attempts: Array<{ channel: 'sms' | 'email'; to: string }> = []
  if (id.kind === 'phone' && phone && smsConfigured()) attempts.push({ channel: 'sms', to: phone })
  if (email) attempts.push({ channel: 'email', to: email })
  // A number with no account and no SMS gateway has nowhere to receive a code.
  if (id.kind === 'phone' && phone && !smsConfigured() && !email) {
    attempts.push({ channel: 'sms', to: phone })
  }

  if (attempts.length === 0) {
    await record({
      kind: 'otp.undeliverable',
      identifier: mask(id.value),
      ok: false,
      detail: 'no channel available for this identifier',
    })
    return res.status(200).json({
      ok: true,
      delivered: false,
      reason: 'no-channel',
      smsConfigured: smsConfigured(),
      mailConfigured: mailConfigured(),
      expiresAt: issued.expiresAt,
    })
  }

  let last: { reason: string; detail?: string; channel: string } | null = null

  for (const attempt of attempts) {
    if (attempt.channel === 'sms') {
      const sms = await sendOtpSms(attempt.to, issued.code)
      if (sms.sent) {
        await record({
          kind: 'otp.sent',
          identifier: mask(attempt.to),
          ok: true,
          detail: `sms · ${sms.provider}`,
        })
        return res.status(200).json({
          ok: true,
          delivered: true,
          channel: 'sms',
          to: mask(attempt.to),
          provider: sms.provider,
          expiresAt: issued.expiresAt,
        })
      }
      last = { reason: sms.reason, detail: sms.detail, channel: 'sms' }
      await record({
        kind: sms.reason === 'unconfigured' ? 'otp.sms-unconfigured' : 'otp.send-failed',
        identifier: mask(attempt.to),
        ok: false,
        detail: `sms · ${sms.reason}${sms.detail ? ` · ${sms.detail}` : ''}`,
      })
      continue
    }

    const { subject, html, text } = otpEmail(issued.code, minutes)
    const mail = await sendMail(attempt.to, subject, html, text)
    if (mail.sent) {
      await record({
        kind: 'otp.sent',
        identifier: mask(attempt.to),
        ok: true,
        detail: `email · ${mail.provider}`,
      })
      return res.status(200).json({
        ok: true,
        delivered: true,
        channel: 'email',
        to: mask(attempt.to),
        provider: mail.provider,
        expiresAt: issued.expiresAt,
      })
    }
    last = { reason: mail.reason, detail: mail.detail, channel: 'email' }
    await record({
      kind: mail.reason === 'unconfigured' ? 'otp.mail-unconfigured' : 'otp.send-failed',
      identifier: mask(attempt.to),
      ok: false,
      detail: `email · ${mail.reason}${mail.detail ? ` · ${mail.detail}` : ''}`,
    })
  }

  return res.status(200).json({
    ok: true,
    delivered: false,
    reason: last?.reason ?? 'failed',
    channel: last?.channel,
    detail: last?.detail,
    smsConfigured: smsConfigured(),
    mailConfigured: mailConfigured(),
    expiresAt: issued.expiresAt,
  })
}

export default withCors(handler)

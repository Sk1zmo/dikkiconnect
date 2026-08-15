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

/**
 * POST /api/auth/request-code   { identifier }
 *
 * Issues a verification code and mails it. The response says whether the mail
 * left the building and nothing else — no code, no hash, no hint. A caller can
 * learn only what it already knew: that it asked.
 *
 * Note it does not reveal whether the identifier belongs to an existing
 * account either. That check happens after verification, so this endpoint
 * cannot be used to enumerate who has signed up.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const id = parseIdentifier(String(req.body?.identifier ?? ''))
  if (!id) {
    return res.status(400).json({ error: 'bad-identifier' })
  }

  const issued = await issueChallenge(id)
  if (!issued.ok) {
    await record({ kind: 'otp.throttled', identifier: mask(id.value), ok: false })
    return res.status(429).json({ error: 'too-soon', retryInSeconds: issued.retryInSeconds })
  }

  const minutes = Math.round(OTP_TTL_SECONDS / 60)

  // Email is the only channel that can be switched on without a regulator in
  // the way. A phone-only identifier still needs its code somewhere it can be
  // read, so we look for an account with that number and use its address.
  let to: string | null = id.kind === 'email' ? id.value : null
  if (!to) {
    const account = await findAccount(id)
    to = account?.email ?? null
  }

  if (!to) {
    await record({
      kind: 'otp.undeliverable',
      identifier: mask(id.value),
      ok: false,
      detail: 'no email on file for this number',
    })
    return res.status(200).json({
      ok: true,
      channel: 'none',
      delivered: false,
      reason: 'no-email-for-number',
      expiresAt: issued.expiresAt,
    })
  }

  const { subject, html, text } = otpEmail(issued.code, minutes)
  const mail = await sendMail(to, subject, html, text)

  await record({
    kind: mail.sent ? 'otp.sent' : 'otp.send-failed',
    identifier: mask(to),
    ok: mail.sent,
    detail: mail.sent ? `resend ${mail.id}` : `${mail.reason}${mail.detail ? ` · ${mail.detail}` : ''}`,
  })

  return res.status(200).json({
    ok: true,
    channel: 'email',
    delivered: mail.sent,
    to: mask(to),
    configured: mailConfigured(),
    reason: mail.sent ? undefined : mail.reason,
    expiresAt: issued.expiresAt,
  })
}

export default withCors(handler)

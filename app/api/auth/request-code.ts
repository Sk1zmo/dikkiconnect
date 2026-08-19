import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { OTP_TTL_SECONDS, issueChallenge, mask, parseIdentifier, record } from '../_lib/auth.js'
import { mailConfigured, otpEmail, sendMail } from '../_lib/mail.js'

/**
 * POST /api/auth/request-code   { identifier }
 *
 * Issues a verification code and emails it. Email is the only channel: SMS to
 * an Indian number needs DLT registration, an approved template and a licensed
 * gateway, and a delivery path that depends on paperwork is a delivery path
 * that is sometimes broken. One channel that always works beats two where one
 * silently is not there.
 *
 * The response says whether the mail left the building and nothing else — no
 * code, no hash, no hint. It also does not reveal whether the address belongs
 * to an existing account, so this cannot be used to enumerate who has signed
 * up.
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
  const { subject, html, text } = otpEmail(issued.code, minutes)
  const mail = await sendMail(id.value, subject, html, text)

  await record({
    kind: mail.sent ? 'otp.sent' : mail.reason === 'unconfigured' ? 'otp.mail-unconfigured' : 'otp.send-failed',
    identifier: mask(id.value),
    ok: mail.sent,
    detail: mail.sent ? mail.provider : `${mail.reason}${mail.detail ? ` · ${mail.detail}` : ''}`,
  })

  return res.status(200).json({
    ok: true,
    channel: 'email',
    delivered: mail.sent,
    to: mask(id.value),
    provider: mail.sent ? mail.provider : undefined,
    reason: mail.sent ? undefined : mail.reason,
    mailConfigured: mailConfigured(),
    expiresAt: issued.expiresAt,
  })
}

export default withCors(handler)

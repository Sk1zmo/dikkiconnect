import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import {
  OTP_TTL_SECONDS,
  issueChallenge,
  mask,
  parseIdentifier,
  record,
  resolveIdentifier,
} from '../_lib/auth.js'
import { mailConfigured, otpEmail, sendMail } from '../_lib/mail.js'

/**
 * POST /api/auth/request-code   { identifier }
 *
 * The identifier is one field: an email address, or the mobile number of an
 * account that already exists. Either way the code goes out by email, because
 * SMS to an Indian number needs DLT registration, an approved template and a
 * licensed gateway, and a delivery path that depends on paperwork is a
 * delivery path that is sometimes broken. Accepting the number at the door
 * costs nothing and saves a returning driver from remembering which address
 * they signed up with.
 *
 * The response says whether the mail left the building and nothing else — no
 * code, no hash, no hint. An address is never confirmed or denied, so this
 * cannot be used to enumerate who has signed up. A number is the one exception
 * and it has to be: an unknown number has no inbox behind it, and the only
 * useful thing to say is so.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const id = parseIdentifier(String(req.body?.identifier ?? ''))
  if (!id) return res.status(400).json({ error: 'bad-identifier' })

  const { email } = await resolveIdentifier(id)
  if (!email) {
    await record({ kind: 'otp.unknown-number', identifier: mask(id.value), ok: false })
    return res.status(404).json({ error: 'no-account' })
  }

  const issued = await issueChallenge(email)
  if (!issued.ok) {
    await record({ kind: 'otp.throttled', identifier: mask(email), ok: false })
    return res.status(429).json({ error: 'too-soon', retryInSeconds: issued.retryInSeconds })
  }

  const minutes = Math.round(OTP_TTL_SECONDS / 60)
  const { subject, html, text } = otpEmail(issued.code, minutes)
  const mail = await sendMail(email, subject, html, text)

  /* With no mail provider configured there is no way to receive a code, and so
     no way to sign in — which makes the whole app untestable on a machine
     without SMTP credentials. Printing it to the server's own console is the
     narrowest fix: it never enters a response, and it only happens when asked
     for explicitly, because a code in a log file is a credential in a log
     file. Never set this on a deployment people other than you can reach. */
  if (!mail.sent && process.env.DEV_PRINT_CODES === '1') {
    console.log(`[DEV_PRINT_CODES] ${mask(email)} → ${issued.code}`)
  }

  await record({
    kind: mail.sent ? 'otp.sent' : mail.reason === 'unconfigured' ? 'otp.mail-unconfigured' : 'otp.send-failed',
    identifier: mask(email),
    ok: mail.sent,
    detail: mail.sent ? mail.provider : `${mail.reason}${mail.detail ? ` · ${mail.detail}` : ''}`,
  })

  return res.status(200).json({
    ok: true,
    channel: 'email',
    delivered: mail.sent,
    to: mask(email),
    provider: mail.sent ? mail.provider : undefined,
    reason: mail.sent ? undefined : mail.reason,
    mailConfigured: mailConfigured(),
    expiresAt: issued.expiresAt,
  })
}

export default withCors(handler)

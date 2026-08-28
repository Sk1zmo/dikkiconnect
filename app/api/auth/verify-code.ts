import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import {
  createSession,
  mask,
  parseIdentifier,
  record,
  resolveIdentifier,
  verifyChallenge,
} from '../_lib/auth.js'

/**
 * POST /api/auth/verify-code   { identifier, code }
 *
 * The comparison happens here against a salted hash, in constant time. A wrong
 * code costs an attempt; the fifth destroys the challenge outright rather than
 * leaving it to be ground down.
 *
 * On success an existing account gets a session token immediately. A new
 * identifier gets a short-lived signup ticket instead — proof that this
 * identifier was verified, without which /api/auth/signup refuses to create
 * anything.
 *
 * The identifier is resolved the same way request-code resolved it, so a
 * challenge raised against a number is checked against the inbox that number
 * belongs to — the two can never end up looking at different keys.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const id = parseIdentifier(String(req.body?.identifier ?? ''))
  const code = String(req.body?.code ?? '').replace(/\D/g, '')

  if (!id || code.length !== 6) return res.status(400).json({ error: 'bad-request' })

  const { email } = await resolveIdentifier(id)
  if (!email) return res.status(404).json({ ok: false, reason: 'no-challenge', attemptsLeft: 0 })

  const result = await verifyChallenge(email, code)

  if (!result.ok) {
    await record({
      kind: `otp.${result.reason}`,
      identifier: mask(email),
      ok: false,
      detail: `${result.attemptsLeft} attempts left`,
    })
    return res.status(401).json({ ok: false, reason: result.reason, attemptsLeft: result.attemptsLeft })
  }

  if (result.account) {
    const token = await createSession(result.account)
    await record({ kind: 'auth.signin', identifier: mask(email), ok: true })
    return res.status(200).json({ ok: true, isNewUser: false, token, account: result.account })
  }

  await record({ kind: 'auth.verified-new', identifier: mask(email), ok: true })
  return res.status(200).json({
    ok: true,
    isNewUser: true,
    /* Carries the verified address back so signup cannot be called for a
       different one. Short-lived by virtue of the challenge already being
       gone. Only ever an address: a number that got this far already had an
       account, so it never reaches signup. */
    ticket: Buffer.from(`email:${email}:${Date.now()}`).toString('base64url'),
  })
}

export default withCors(handler)

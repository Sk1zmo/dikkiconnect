import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { createSession, mask, parseIdentifier, record, verifyChallenge } from '../_lib/auth.js'

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
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const id = parseIdentifier(String(req.body?.identifier ?? ''))
  const code = String(req.body?.code ?? '').replace(/\D/g, '')

  if (!id || code.length !== 6) return res.status(400).json({ error: 'bad-request' })

  const result = await verifyChallenge(id, code)

  if (!result.ok) {
    await record({
      kind: `otp.${result.reason}`,
      identifier: mask(id.value),
      ok: false,
      detail: `${result.attemptsLeft} attempts left`,
    })
    return res.status(401).json({ ok: false, reason: result.reason, attemptsLeft: result.attemptsLeft })
  }

  if (result.account) {
    const token = await createSession(result.account)
    await record({ kind: 'auth.signin', identifier: mask(id.value), ok: true })
    return res.status(200).json({ ok: true, isNewUser: false, token, account: result.account })
  }

  await record({ kind: 'auth.verified-new', identifier: mask(id.value), ok: true })
  return res.status(200).json({
    ok: true,
    isNewUser: true,
    // Carries the verified identifier back so signup cannot be called for a
    // different one. Short-lived by virtue of the challenge already being gone.
    ticket: Buffer.from(`${id.kind}:${id.value}:${Date.now()}`).toString('base64url'),
  })
}

export default withCors(handler)

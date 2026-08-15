import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  createAccount,
  createSession,
  findAccount,
  mask,
  parseIdentifier,
  record,
} from '../_lib/auth.js'
import { sendMail, welcomeEmail } from '../_lib/mail.js'

const TICKET_TTL_MS = 10 * 60_000

/**
 * POST /api/auth/signup   { ticket, name, email, phone, role }
 *
 * Creates the account for an identifier that has just passed verification. The
 * ticket is what proves that — without one, or with one older than ten
 * minutes, this refuses. Otherwise anybody could POST an address and mint an
 * account for it.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const { ticket, name, email, phone, role } = req.body ?? {}

  let verified: { kind: string; value: string; at: number }
  try {
    const [kind, value, at] = Buffer.from(String(ticket), 'base64url').toString().split(':')
    verified = { kind, value, at: Number(at) }
  } catch {
    return res.status(400).json({ error: 'bad-ticket' })
  }
  if (!verified.value || !Number.isFinite(verified.at)) {
    return res.status(400).json({ error: 'bad-ticket' })
  }
  if (Date.now() - verified.at > TICKET_TTL_MS) {
    return res.status(401).json({ error: 'ticket-expired' })
  }

  if (String(name ?? '').trim().length < 2) return res.status(400).json({ error: 'bad-name' })

  // The verified identifier always wins over whatever the form claimed, so a
  // ticket for one address can never create an account for another.
  const suppliedEmail = String(email ?? '').trim().toLowerCase()
  const suppliedPhone = String(phone ?? '').replace(/\D/g, '').slice(-10)
  const finalEmail = verified.kind === 'email' ? verified.value : suppliedEmail
  const finalPhone = verified.kind === 'phone' ? verified.value : suppliedPhone

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(finalEmail)) {
    return res.status(400).json({ error: 'bad-email' })
  }

  const id = parseIdentifier(verified.value)
  if (!id) return res.status(400).json({ error: 'bad-ticket' })

  const existing = await findAccount(id)
  if (existing) {
    const token = await createSession(existing)
    return res.status(200).json({ ok: true, token, account: existing, existed: true })
  }

  const account = await createAccount({
    id,
    name: String(name),
    email: finalEmail,
    phone: finalPhone,
    role: String(role ?? 'sender'),
  })
  const token = await createSession(account)

  await record({ kind: 'account.created', identifier: mask(finalEmail), ok: true, detail: account.roles[0] })

  // Best effort — a welcome mail that fails must never fail the signup.
  const { subject, html, text } = welcomeEmail(account.name.split(' ')[0])
  void sendMail(finalEmail, subject, html, text)

  return res.status(200).json({ ok: true, token, account })
}

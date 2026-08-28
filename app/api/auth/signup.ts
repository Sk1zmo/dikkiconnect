import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import {
  createAccount,
  createSession,
  findAccountByEmail,
  findAccountByPhone,
  mask,
  parseIdentifier,
  parsePhone,
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
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const { ticket, name, phone, role } = req.body ?? {}

  let verified: { kind: string; value: string; at: number }
  try {
    /* kind:value:issuedAt, where value is an address that may itself contain a
       colon. Take the ends and let the middle be whatever it is. */
    const parts = Buffer.from(String(ticket), 'base64url').toString().split(':')
    const at = Number(parts.pop())
    const kind = String(parts.shift())
    verified = { kind, value: parts.join(':'), at }
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

  /* The verified address always wins over whatever the form claimed — a ticket
     for one address can never create an account for another. The number is
     taken at face value: it is contact information, and although it doubles as
     a sign-in alias afterwards, the code for it still only ever goes to this
     address. Claiming somebody else's number buys you nothing you did not
     already have. */
  const finalEmail = verified.value
  const finalPhone = parsePhone(String(phone ?? ''))

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(finalEmail)) {
    return res.status(400).json({ error: 'bad-email' })
  }
  if (!finalPhone) {
    return res.status(400).json({ error: 'bad-phone', detail: 'A 10-digit mobile number is required.' })
  }

  const id = parseIdentifier(verified.value)
  if (!id || id.kind !== 'email') return res.status(400).json({ error: 'bad-ticket' })

  const existing = await findAccountByEmail(id.value)
  if (existing) {
    const token = await createSession(existing)
    return res.status(200).json({ ok: true, token, account: existing, existed: true })
  }

  /* The number doubles as a sign-in alias, so it can only point at one
     account. Letting a second signup claim a number already in use would
     quietly take sign-in-by-number away from whoever registered it first. */
  const numberInUse = await findAccountByPhone(finalPhone)
  if (numberInUse) return res.status(409).json({ error: 'phone-taken' })

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

export default withCors(handler)

import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { K, kvDel, kvGet, kvList, kvPush, kvSet } from './store.js'

/* ═══════════════════════════════════════════════════════════════════════════
   Verification, server side.

   The whole point of moving this off the client: the code is generated here,
   stored here as a salted hash, and compared here. It is never in a response
   body, never in the bundle, never in localStorage. The only copy that leaves
   the server goes to the user's inbox.

   Rules enforced here rather than in the UI, because a UI rule is a
   suggestion:
     · six digits, from a CSPRNG
     · five minutes to live
     · five attempts, then the challenge is destroyed
     · single use — a correct code is deleted the moment it is accepted
     · one outstanding challenge per identifier
     · a thirty-second floor between sends, so the endpoint cannot be used to
       mail-bomb somebody
   ═══════════════════════════════════════════════════════════════════════════ */

export const OTP_TTL_SECONDS = 5 * 60
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_SECONDS = 30
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export interface Challenge {
  identifier: string
  channel: 'email'
  hash: string
  salt: string
  issuedAt: number
  expiresAt: number
  attempts: number
}

export interface Account {
  id: string
  name: string
  email: string
  phone: string
  roles: string[]
  createdAt: string
  kycTier: string
  avatarTone: number
}

/**
 * An account is identified by its email address and nothing else.
 *
 * The phone number is still collected and stored — a driver has to be
 * reachable, and a hub manager has to be able to ring a receiver — but it is
 * contact information, not a credential. Nobody signs in with it, so nothing
 * has to be true about it for the login to be sound.
 */
export type Identifier = { kind: 'email'; value: string }

export function parseIdentifier(raw: string): Identifier | null {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? { kind: 'email', value: v } : null
}

/** Ten digits, or null. Stored on the account; never used to authenticate. */
export const parsePhone = (raw: string): string | null => {
  const digits = (raw ?? '').replace(/\D/g, '').slice(-10)
  return digits.length === 10 ? digits : null
}

const sixDigits = () => String(randomInt(0, 1_000_000)).padStart(6, '0')

const hashCode = (code: string, salt: string) =>
  createHash('sha256').update(`${salt}:${code}`).digest('hex')

/* ── Events ──────────────────────────────────────────────────────────────── */

export interface AppEvent {
  at: string
  kind: string
  identifier?: string
  detail?: string
  ok?: boolean
}

/** Everything the ops view shows comes from here. */
export async function record(e: Omit<AppEvent, 'at'>) {
  await kvPush(K.events, { ...e, at: new Date().toISOString() } satisfies AppEvent)
}

export const readEvents = (limit = 120) => kvList<AppEvent>(K.events, limit)

/** Addresses are masked everywhere they are shown or logged. */
export function mask(identifier: string) {
  if (!identifier.includes('@')) {
    return `${identifier.slice(0, 2)}${'•'.repeat(Math.max(0, identifier.length - 4))}${identifier.slice(-2)}`
  }
  const [user, domain] = identifier.split('@')
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(1, user.length - 2))}@${domain}`
}

/* ── Challenges ──────────────────────────────────────────────────────────── */

export type IssueResult =
  | { ok: true; code: string; expiresAt: number }
  | { ok: false; reason: 'too-soon'; retryInSeconds: number }

/**
 * Creates a challenge and returns the plaintext code to the caller *inside the
 * server* so it can be mailed. It is deliberately not part of any response.
 */
export async function issueChallenge(id: Identifier): Promise<IssueResult> {
  const key = K.challenge(id.value)
  const existing = await kvGet<Challenge>(key)
  const now = Date.now()

  if (existing) {
    const since = (now - existing.issuedAt) / 1000
    if (since < OTP_RESEND_SECONDS) {
      return { ok: false, reason: 'too-soon', retryInSeconds: Math.ceil(OTP_RESEND_SECONDS - since) }
    }
  }

  const code = sixDigits()
  const salt = randomBytes(16).toString('hex')
  const challenge: Challenge = {
    identifier: id.value,
    channel: 'email',
    hash: hashCode(code, salt),
    salt,
    issuedAt: now,
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    attempts: 0,
  }
  await kvSet(key, challenge, OTP_TTL_SECONDS)
  return { ok: true, code, expiresAt: challenge.expiresAt }
}

export type VerifyResult =
  | { ok: true; account: Account | null }
  | { ok: false; reason: 'no-challenge' | 'expired' | 'locked' | 'wrong'; attemptsLeft: number }

export async function verifyChallenge(id: Identifier, code: string): Promise<VerifyResult> {
  const key = K.challenge(id.value)
  const challenge = await kvGet<Challenge>(key)

  if (!challenge) return { ok: false, reason: 'no-challenge', attemptsLeft: 0 }
  if (Date.now() > challenge.expiresAt) {
    await kvDel(key)
    return { ok: false, reason: 'expired', attemptsLeft: 0 }
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await kvDel(key)
    return { ok: false, reason: 'locked', attemptsLeft: 0 }
  }

  const supplied = Buffer.from(hashCode(code, challenge.salt), 'hex')
  const expected = Buffer.from(challenge.hash, 'hex')
  const match = supplied.length === expected.length && timingSafeEqual(supplied, expected)

  if (!match) {
    const attempts = challenge.attempts + 1
    const left = Math.max(0, OTP_MAX_ATTEMPTS - attempts)
    if (left === 0) {
      await kvDel(key)
      return { ok: false, reason: 'locked', attemptsLeft: 0 }
    }
    const ttl = Math.max(1, Math.ceil((challenge.expiresAt - Date.now()) / 1000))
    await kvSet(key, { ...challenge, attempts }, ttl)
    return { ok: false, reason: 'wrong', attemptsLeft: left }
  }

  // Correct — destroy it so it cannot be replayed.
  await kvDel(key)
  const account = await findAccount(id)
  return { ok: true, account }
}

/* ── Accounts ────────────────────────────────────────────────────────────── */

export const accountKey = (id: Identifier) => `${id.kind}:${id.value}`

export async function findAccount(id: Identifier): Promise<Account | null> {
  return kvGet<Account>(K.account(accountKey(id)))
}

export async function createAccount(details: {
  id: Identifier
  name: string
  email: string
  phone: string
  role: string
}): Promise<Account> {
  const account: Account = {
    id: `usr-${Date.now().toString(36)}${randomBytes(3).toString('hex')}`,
    name: details.name.trim(),
    email: details.email.trim().toLowerCase(),
    phone: details.phone.replace(/\D/g, '').slice(-10),
    roles: [details.role],
    createdAt: new Date().toISOString(),
    kycTier: 'none',
    avatarTone: randomInt(0, 6),
  }

  await kvSet(K.account(`email:${account.email}`), account)
  await kvPush(K.accountIndex, { id: account.id, at: account.createdAt }, 1000)

  return account
}

export async function updateAccount(account: Account, patch: Partial<Account>): Promise<Account> {
  const next = { ...account, ...patch }
  await kvSet(K.account(`email:${next.email}`), next)
  return next
}

/* ── Sessions ────────────────────────────────────────────────────────────── */

/**
 * Sessions store the account's lookup key rather than just its id, so
 * resolving a token is one read instead of a scan. Tokens are 24 random bytes
 * and carry no meaning — losing one tells an attacker nothing about the next.
 */
export async function createSession(account: Account): Promise<string> {
  const token = randomBytes(24).toString('base64url')
  await kvSet(
    K.session(token),
    { key: `email:${account.email}`, accountId: account.id, at: Date.now() },
    SESSION_TTL_SECONDS,
  )
  return token
}

export async function accountForToken(token: string | undefined): Promise<Account | null> {
  if (!token) return null
  const sess = await kvGet<{ key: string }>(K.session(token))
  if (!sess?.key) return null
  return kvGet<Account>(K.account(sess.key))
}

export const destroySession = (token: string) => kvDel(K.session(token))

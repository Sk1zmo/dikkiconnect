import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocalStorage } from './hooks'
import { sendOtpSms, smsConfigured, type SmsResult } from './sms'
import type { KycTier, Role } from './types'

/* ═══════════════════════════════════════════════════════════════════════════
   Accounts and OTP.

   Every account here is a real record keyed by mobile number: sign up once,
   sign in from then on, and your parcels, rides and wallet follow the number.
   There are no shared demo logins.

   The OTP is a genuine one — generated per request, six digits, single-use,
   five-minute expiry, five attempts, thirty-second resend cooldown.

   Delivery goes through `sms.ts`, which posts to whatever endpoint the build
   is configured with. When one is set the code arrives by real SMS; when it
   is not, the verification screen shows the code in-app and says why. The
   code, and every rule around it, is identical either way — only the last
   hop changes.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Account {
  id: string
  name: string
  phone: string
  email: string
  /** Roles this person has used. The first one is where they land on sign-in. */
  roles: Role[]
  createdAt: string
  kycTier: KycTier
  avatarTone: number
}

/** A live verification challenge. One per number at a time. */
interface Challenge {
  phone: string
  code: string
  issuedAt: number
  expiresAt: number
  attempts: number
}

export type VerifyResult =
  | { ok: true; isNewUser: boolean }
  | { ok: false; reason: 'no-challenge' | 'expired' | 'locked' | 'wrong'; attemptsLeft: number }

export const OTP_TTL_MS = 5 * 60_000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_SECONDS = 30

/** Cryptographically random six digits — not Math.random(). */
function generateCode() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(buf[0] % 1_000_000).padStart(6, '0')
}

export const normalisePhone = (raw: string) => raw.replace(/\D/g, '').slice(-10)

interface AuthState {
  /** The signed-in account, or null. */
  account: Account | null
  authed: boolean
  accounts: Account[]

  /** Issue a fresh code for a number. Returns the code so the UI can show it. */
  requestOtp: (phone: string) => { code: string; expiresAt: number }
  /** Outcome of the last delivery attempt — drives what the UI tells the user. */
  delivery: SmsResult | null
  /** Is an SMS gateway configured for this build? */
  smsEnabled: boolean
  /** The code currently outstanding, for the in-app delivery panel. */
  pendingCode: (phone: string) => string | null
  /** Attempts left on the outstanding challenge. */
  attemptsLeft: (phone: string) => number
  /**
   * Check a code. On success an existing account is signed in immediately;
   * a new number is left for `completeSignup` to finish.
   */
  verifyOtp: (phone: string, code: string) => VerifyResult
  /** Create the account for a number that has just passed verification. */
  completeSignup: (details: { phone: string; name: string; email: string; role: Role }) => Account
  /** Has this number already verified but not yet finished signing up? */
  isVerifiedPending: (phone: string) => boolean

  updateAccount: (patch: Partial<Omit<Account, 'id' | 'phone'>>) => void
  addRole: (role: Role) => void
  signOut: () => void
  /** Wipes accounts and every ledger — the reset button in Settings. */
  deleteAccount: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useLocalStorage<Account[]>('dikkiconnect.accounts', [])
  const [sessionPhone, setSessionPhone] = useLocalStorage<string | null>(
    'dikkiconnect.session',
    null,
  )

  // Challenges live in memory only. A reload drops them, which is the correct
  // behaviour — the user simply requests a new code.
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null)
  const [delivery, setDelivery] = useState<SmsResult | null>(null)

  const account = useMemo(
    () => accounts.find((a) => a.phone === sessionPhone) ?? null,
    [accounts, sessionPhone],
  )

  const requestOtp = useCallback<AuthState['requestOtp']>((rawPhone) => {
    const phone = normalisePhone(rawPhone)
    const now = Date.now()
    const next: Challenge = {
      phone,
      code: generateCode(),
      issuedAt: now,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
    }
    setChallenge(next)

    // Fire-and-forget: the challenge is live the moment it is generated, so a
    // slow gateway must never hold up the verification screen.
    setDelivery(null)
    void sendOtpSms(phone, next.code).then(setDelivery)

    return { code: next.code, expiresAt: next.expiresAt }
  }, [])

  const pendingCode = useCallback<AuthState['pendingCode']>(
    (rawPhone) => {
      const phone = normalisePhone(rawPhone)
      if (!challenge || challenge.phone !== phone) return null
      if (Date.now() > challenge.expiresAt) return null
      return challenge.code
    },
    [challenge],
  )

  const attemptsLeft = useCallback<AuthState['attemptsLeft']>(
    (rawPhone) => {
      const phone = normalisePhone(rawPhone)
      if (!challenge || challenge.phone !== phone) return OTP_MAX_ATTEMPTS
      return Math.max(0, OTP_MAX_ATTEMPTS - challenge.attempts)
    },
    [challenge],
  )

  const verifyOtp = useCallback<AuthState['verifyOtp']>(
    (rawPhone, code) => {
      const phone = normalisePhone(rawPhone)

      if (!challenge || challenge.phone !== phone) {
        return { ok: false, reason: 'no-challenge', attemptsLeft: 0 }
      }
      if (Date.now() > challenge.expiresAt) {
        setChallenge(null)
        return { ok: false, reason: 'expired', attemptsLeft: 0 }
      }
      if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
        return { ok: false, reason: 'locked', attemptsLeft: 0 }
      }

      if (code !== challenge.code) {
        const attempts = challenge.attempts + 1
        setChallenge({ ...challenge, attempts })
        const left = Math.max(0, OTP_MAX_ATTEMPTS - attempts)
        return { ok: false, reason: left === 0 ? 'locked' : 'wrong', attemptsLeft: left }
      }

      // Correct — burn the challenge so the code cannot be replayed.
      setChallenge(null)
      const existing = accounts.find((a) => a.phone === phone)
      if (existing) {
        setSessionPhone(phone)
        setVerifiedPhone(null)
        return { ok: true, isNewUser: false }
      }
      setVerifiedPhone(phone)
      return { ok: true, isNewUser: true }
    },
    [challenge, accounts, setSessionPhone],
  )

  const completeSignup = useCallback<AuthState['completeSignup']>(
    ({ phone: rawPhone, name, email, role }) => {
      const phone = normalisePhone(rawPhone)
      const created: Account = {
        id: `usr-${phone}`,
        name: name.trim(),
        email: email.trim(),
        phone,
        roles: [role],
        createdAt: new Date().toISOString(),
        kycTier: 'none',
        avatarTone: phone.charCodeAt(9) % 6,
      }
      setAccounts((list) => [created, ...list.filter((a) => a.phone !== phone)])
      setSessionPhone(phone)
      setVerifiedPhone(null)
      return created
    },
    [setAccounts, setSessionPhone],
  )

  const isVerifiedPending = useCallback<AuthState['isVerifiedPending']>(
    (rawPhone) => verifiedPhone === normalisePhone(rawPhone),
    [verifiedPhone],
  )

  const updateAccount = useCallback<AuthState['updateAccount']>(
    (patch) => {
      if (!sessionPhone) return
      setAccounts((list) =>
        list.map((a) => (a.phone === sessionPhone ? { ...a, ...patch } : a)),
      )
    },
    [sessionPhone, setAccounts],
  )

  const addRole = useCallback<AuthState['addRole']>(
    (role) => {
      if (!sessionPhone) return
      setAccounts((list) =>
        list.map((a) =>
          a.phone === sessionPhone && !a.roles.includes(role)
            ? { ...a, roles: [...a.roles, role] }
            : a,
        ),
      )
    },
    [sessionPhone, setAccounts],
  )

  const signOut = useCallback(() => {
    setSessionPhone(null)
    setChallenge(null)
    setVerifiedPhone(null)
  }, [setSessionPhone])

  const deleteAccount = useCallback(() => {
    const phone = sessionPhone
    setAccounts((list) => list.filter((a) => a.phone !== phone))
    setSessionPhone(null)
    setChallenge(null)
    setVerifiedPhone(null)
  }, [sessionPhone, setAccounts, setSessionPhone])

  const value = useMemo<AuthState>(
    () => ({
      account,
      authed: account !== null,
      accounts,
      requestOtp,
      delivery,
      smsEnabled: smsConfigured(),
      pendingCode,
      attemptsLeft,
      verifyOtp,
      completeSignup,
      isVerifiedPending,
      updateAccount,
      addRole,
      signOut,
      deleteAccount,
    }),
    [
      account,
      accounts,
      requestOtp,
      delivery,
      pendingCode,
      attemptsLeft,
      verifyOtp,
      completeSignup,
      isVerifiedPending,
      updateAccount,
      addRole,
      signOut,
      deleteAccount,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

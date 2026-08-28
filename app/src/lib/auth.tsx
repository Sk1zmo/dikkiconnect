import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocalStorage } from './hooks'
import { DEMO, DEMO_ACCOUNT } from './demo'
import type { KycTier, Role } from './types'

/* ═══════════════════════════════════════════════════════════════════════════
   Accounts and verification — client side.

   An account lives at an email address. The code is issued, hashed, counted
   and compared by the API; the only copy that leaves the server goes to that
   inbox. All this file does is ask, and report what the server said.

   Sign-in takes one thing: an address, or the mobile number of an account that
   already has one. The number is an alias, not a second credential — the
   server resolves it to the account's address and mails the code there. No
   code is ever sent to a phone, and that is deliberate: texting an Indian
   number needs DLT registration and an approved template, and a login that
   depends on paperwork is a login that is sometimes broken.

   That is the difference between a verification step and a piece of theatre:
   the check now happens somewhere the person being checked cannot reach.

   What is kept locally is a session token and the account record the server
   returned, so a reload does not force a fresh code.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Account {
  id: string
  name: string
  email: string
  phone: string
  roles: Role[]
  createdAt: string
  kycTier: KycTier
  avatarTone: number
}

export const OTP_TTL_MS = 5 * 60_000
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_SECONDS = 30

export type RequestResult =
  | { ok: true; delivered: boolean; to?: string; reason?: string; provider?: string }
  | {
      ok: false
      reason: 'bad-identifier' | 'no-account' | 'too-soon' | 'offline' | 'no-api'
      retryInSeconds?: number
    }

export type SignupResult =
  | { ok: true; account: Account }
  | { ok: false; reason: 'phone-taken' | 'failed' }

export type VerifyResult =
  | { ok: true; isNewUser: false }
  | { ok: true; isNewUser: true; ticket: string }
  | {
      ok: false
      reason: 'no-challenge' | 'expired' | 'locked' | 'wrong' | 'offline' | 'no-api'
      attemptsLeft: number
    }

export const normalisePhone = (raw: string) => raw.replace(/\D/g, '').slice(-10)

/**
 * Where the API lives.
 *
 * On the web this is the same origin and the empty string is correct. Inside
 * the APK it is not: Capacitor serves the bundled app from https://localhost,
 * so a relative /api/… resolves to a host that does not exist and every sign-in
 * fails with a network error. The Android build is compiled with
 * VITE_API_ORIGIN pointing at the deployment.
 */
const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN as string | undefined) ?? ''

/** Distinguishes the two ways this can fail, because they need different fixes. */
export type ApiFailure = 'network' | 'no-api'

async function api<T>(path: string, body?: unknown): Promise<T | ApiFailure> {
  let res: Response
  try {
    res = await fetch(`${API_ORIGIN}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // Genuinely could not reach it: offline, DNS, or a CORS preflight refused.
    return 'network'
  }

  /* A deployment without the serverless functions answers /api/* with the SPA
     fallback — HTML, status 200. Parsing that as JSON throws, and reporting it
     as "check your connection" sends people to debug a network that is fine.
     Content-type tells us which of the two happened. */
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('application/json')) return 'no-api'

  try {
    return (await res.json()) as T
  } catch {
    return 'no-api'
  }
}

const failed = (r: unknown): r is ApiFailure => r === 'network' || r === 'no-api'

interface AuthState {
  account: Account | null
  authed: boolean
  /** True until the stored session has been checked. */
  loading: boolean

  requestCode: (identifier: string) => Promise<RequestResult>
  verifyCode: (identifier: string, code: string) => Promise<VerifyResult>
  completeSignup: (details: {
    ticket: string
    name: string
    /** Contact, and a sign-in alias. The verified email comes from the ticket. */
    phone: string
    role: Role
  }) => Promise<SignupResult>

  updateAccount: (patch: Partial<Omit<Account, 'id'>>) => void
  addRole: (role: Role) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useLocalStorage<string | null>('dikkiconnect.token', null)
  const [account, setAccount] = useLocalStorage<Account | null>('dikkiconnect.account', null)
  const [loading, setLoading] = useState(false)

  // A token without an account (cleared cache, older build) is not a session.
  useEffect(() => {
    if (token && !account) setToken(null)
  }, [token, account, setToken])

  /* A demo build signs itself in. The branch is compiled out of the real
     bundle entirely, so this is not a bypass sitting dormant in production. */
  useEffect(() => {
    if (!DEMO) return
    if (!account) setAccount(DEMO_ACCOUNT as unknown as Account)
    if (!token) setToken('demo-session')
  }, [account, token, setAccount, setToken])

  const requestCode = useCallback<AuthState['requestCode']>(async (identifier) => {
    const res = await api<{
      ok?: boolean
      error?: string
      retryInSeconds?: number
      delivered?: boolean
      to?: string
      reason?: string
      provider?: string
    }>('/api/auth/request-code', { identifier })

    if (failed(res)) return { ok: false, reason: res === 'no-api' ? 'no-api' : 'offline' }
    if (res.error === 'too-soon') {
      return { ok: false, reason: 'too-soon', retryInSeconds: res.retryInSeconds }
    }
    // A number with no account behind it: there is no inbox to mail.
    if (res.error === 'no-account') return { ok: false, reason: 'no-account' }
    if (!res.ok) return { ok: false, reason: 'bad-identifier' }

    return {
      ok: true,
      delivered: Boolean(res.delivered),
      to: res.to,
      reason: res.reason,
      provider: res.provider,
    }
  }, [])

  const verifyCode = useCallback<AuthState['verifyCode']>(
    async (identifier, code) => {
      const res = await api<{
        ok?: boolean
        reason?: VerifyResult extends { reason: infer R } ? R : never
        attemptsLeft?: number
        isNewUser?: boolean
        ticket?: string
        token?: string
        account?: Account
      }>('/api/auth/verify-code', { identifier, code })

      if (failed(res)) {
        return { ok: false, reason: res === 'no-api' ? 'no-api' : 'offline', attemptsLeft: 0 }
      }
      if (!res.ok) {
        return {
          ok: false,
          reason: (res.reason ?? 'wrong') as 'wrong',
          attemptsLeft: res.attemptsLeft ?? 0,
        }
      }
      if (res.isNewUser) return { ok: true, isNewUser: true, ticket: res.ticket ?? '' }

      if (res.token && res.account) {
        setToken(res.token)
        setAccount(res.account)
      }
      return { ok: true, isNewUser: false }
    },
    [setToken, setAccount],
  )

  const completeSignup = useCallback<AuthState['completeSignup']>(
    async (details) => {
      setLoading(true)
      const res = await api<{ ok?: boolean; error?: string; token?: string; account?: Account }>(
        '/api/auth/signup',
        details,
      )
      setLoading(false)
      if (failed(res)) return { ok: false, reason: 'failed' }
      if (res.error === 'phone-taken') return { ok: false, reason: 'phone-taken' }
      if (!res.ok || !res.account || !res.token) return { ok: false, reason: 'failed' }
      setToken(res.token)
      setAccount(res.account)
      return { ok: true, account: res.account }
    },
    [setToken, setAccount],
  )

  const updateAccount = useCallback<AuthState['updateAccount']>(
    (patch) => setAccount((a) => (a ? { ...a, ...patch } : a)),
    [setAccount],
  )

  const addRole = useCallback<AuthState['addRole']>(
    (role) =>
      setAccount((a) => (a && !a.roles.includes(role) ? { ...a, roles: [...a.roles, role] } : a)),
    [setAccount],
  )

  const signOut = useCallback(() => {
    setToken(null)
    setAccount(null)
  }, [setToken, setAccount])

  const value = useMemo<AuthState>(
    () => ({
      account,
      authed: DEMO || Boolean(account && token),
      loading,
      requestCode,
      verifyCode,
      completeSignup,
      updateAccount,
      addRole,
      signOut,
    }),
    [
      account,
      token,
      loading,
      requestCode,
      verifyCode,
      completeSignup,
      updateAccount,
      addRole,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

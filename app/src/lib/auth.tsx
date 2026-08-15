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
import type { KycTier, Role } from './types'

/* ═══════════════════════════════════════════════════════════════════════════
   Accounts and verification — client side.

   This file used to generate the code itself. It no longer knows how. Codes
   are issued, hashed, counted and compared by the API; the only copy that
   leaves the server goes to the user's inbox. Everything here does is ask, and
   report what the server said.

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
  | { ok: true; channel: 'email'; delivered: boolean; to?: string; reason?: string }
  | { ok: false; reason: 'bad-identifier' | 'too-soon' | 'offline'; retryInSeconds?: number }

export type VerifyResult =
  | { ok: true; isNewUser: false }
  | { ok: true; isNewUser: true; ticket: string }
  | {
      ok: false
      reason: 'no-challenge' | 'expired' | 'locked' | 'wrong' | 'offline'
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

async function api<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    return (await res.json()) as T
  } catch {
    return null
  }
}

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
    email: string
    phone: string
    role: Role
  }) => Promise<Account | null>

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

  const requestCode = useCallback<AuthState['requestCode']>(async (identifier) => {
    const res = await api<{
      ok?: boolean
      error?: string
      retryInSeconds?: number
      channel?: 'email'
      delivered?: boolean
      to?: string
      reason?: string
    }>('/api/auth/request-code', { identifier })

    if (!res) return { ok: false, reason: 'offline' }
    if (res.error === 'too-soon') {
      return { ok: false, reason: 'too-soon', retryInSeconds: res.retryInSeconds }
    }
    if (!res.ok) return { ok: false, reason: 'bad-identifier' }

    return {
      ok: true,
      channel: 'email',
      delivered: Boolean(res.delivered),
      to: res.to,
      reason: res.reason,
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

      if (!res) return { ok: false, reason: 'offline', attemptsLeft: 0 }
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
      const res = await api<{ ok?: boolean; token?: string; account?: Account }>(
        '/api/auth/signup',
        details,
      )
      setLoading(false)
      if (!res?.ok || !res.account || !res.token) return null
      setToken(res.token)
      setAccount(res.account)
      return res.account
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
      authed: Boolean(account && token),
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

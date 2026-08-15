import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsRight, UserRound } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'

/**
 * Phone-first auth. Per PRD §8.1 there is no password anywhere in
 * DikkiConnect — a code to your number is the only way in.
 *
 * The layout is deliberately spare: one card, one field, one button. Every
 * other decision — which portal, what your name is, whether you drive — happens
 * after you are through the door, because none of it is needed to get you
 * there and all of it is friction in front of a first-run user.
 */
export default function Login() {
  const navigate = useNavigate()
  const { requestOtp, accounts } = useAuth()

  const [value, setValue] = useState('')
  const [email, setEmail] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  const isEmail = value.includes('@')
  const digits = value.replace(/\D/g, '')
  const valid = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
    : digits.length === 10
  const returning = accounts.find((a) => a.phone === digits)

  const submit = () => {
    if (!value.trim()) {
      setError('Enter your mobile number to continue')
      return
    }

    if (isEmail) {
      /* Every account is keyed to a mobile number: the OTP, the custody chain
         and the payout account all hang off it. An email on its own cannot
         open any of that — so keep it and ask for the number, rather than
         dead-ending on a field we invited them to fill. */
      if (!valid) {
        setError('That email doesn’t look right')
        return
      }
      setEmail(value.trim())
      setValue('')
      setError(undefined)
      setNotice('Got it — now your mobile number, and we’ll attach that email to the account.')
      return
    }

    if (!valid) {
      setError('Enter a valid 10-digit mobile number')
      return
    }

    setError(undefined)
    setSending(true)
    // Issue the code before navigating, so the verify screen always has a live
    // challenge to check against.
    requestOtp(digits)
    const qs = new URLSearchParams({ phone: digits })
    if (email) qs.set('email', email)
    setTimeout(() => navigate(`/auth/otp?${qs.toString()}`), 600)
  }

  return (
    <Screen tone="white">
      <TopBar back backTo="/" className="pt-safe" />

      <div className="device-scroll flex flex-1 flex-col justify-center px-6 pb-10">
        <div className="anim-scale-in mx-auto w-full max-w-[344px] rounded-(--radius-2xl) border border-ink-200/80 bg-white px-6 py-11 shadow-(--shadow-e2)">
          <div className="flex justify-center">
            <span className="grid size-11 place-items-center rounded-(--radius-md) bg-brand-50 text-brand-600">
              <ChevronsRight size={22} strokeWidth={2.6} />
            </span>
          </div>

          <h1 className="text-display mt-5 text-center text-[23px] leading-tight font-extrabold text-ink-900">
            Log in or sign up
          </h1>

          <div className="mt-7">
            <div
              className={cn(
                'flex items-center rounded-(--radius-md) border-2 bg-white transition-colors',
                error ? 'border-danger-400' : 'border-ink-200 focus-within:border-brand-500',
              )}
            >
              {!isEmail && digits.length > 0 && (
                <span className="pl-3.5 text-[15px] font-bold text-ink-500">+91</span>
              )}
              <input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError(undefined)
                }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                inputMode={isEmail ? 'email' : 'tel'}
                autoComplete="tel"
                placeholder="Phone number or email"
                className="h-13 w-full bg-transparent px-3.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
              />
            </div>

            {error && (
              <p className="anim-fade-in mt-2 text-[12.5px] font-semibold text-danger-600">
                {error}
              </p>
            )}
            {notice && !error && (
              <p className="anim-fade-in mt-2 text-[12.5px] font-semibold text-brand-700">
                {notice}
              </p>
            )}

            {returning && !error && (
              <div className="anim-fade-in mt-2.5 flex items-center gap-2.5 rounded-(--radius-md) border border-success-100 bg-success-50 px-3 py-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success-500/15 text-success-600">
                  <UserRound size={14} />
                </span>
                <p className="min-w-0 truncate text-[12.5px] font-semibold text-success-800">
                  Welcome back, {returning.name.split(' ')[0]}
                </p>
              </div>
            )}

            <button
              onClick={submit}
              disabled={sending}
              className={cn(
                'pressable focus-ring mt-3.5 h-13 w-full rounded-full text-[15px] font-bold text-white',
                'bg-brand-600 shadow-(--shadow-brand-sm) hover:bg-brand-700 disabled:opacity-70',
              )}
            >
              {sending ? 'Sending code…' : 'Continue'}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-200" />
            <span className="text-[12px] font-medium text-ink-400">or</span>
            <span className="h-px flex-1 bg-ink-200" />
          </div>

          <div className="flex justify-center gap-3.5">
            {[
              { id: 'google', label: 'Continue with Google', mark: <GoogleMark /> },
              { id: 'apple', label: 'Continue with Apple', mark: <AppleMark /> },
            ].map((p) => (
              <button
                key={p.id}
                aria-label={p.label}
                onClick={() =>
                  setError(
                    `${p.id === 'google' ? 'Google' : 'Apple'} sign-in needs its OAuth app registered under a company account — use your mobile number for now.`,
                  )
                }
                className="pressable grid size-13 place-items-center rounded-(--radius-md) border border-ink-200 bg-white hover:bg-ink-50"
              >
                {p.mark}
              </button>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-[300px] text-center text-[11.5px] leading-relaxed text-ink-400">
          By continuing you agree to DikkiConnect&apos;s{' '}
          <span className="font-semibold text-ink-600">Terms</span>,{' '}
          <span className="font-semibold text-ink-600">Privacy Policy</span> and the{' '}
          <span className="font-semibold text-ink-600">Prohibited Items</span> declaration.
        </p>
      </div>
    </Screen>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[21px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3c.9-2.7 3.4-5 6.4-5Z"
      />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[21px]" fill="currentColor" aria-hidden>
      <path d="M16.4 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8-.7 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2C3.5 12.4 4.6 16 6 18c.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2a9 9 0 0 0 1.1-2.3c-.1 0-2.2-.9-2.2-3ZM14.3 6.3c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.6.6-1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2Z" />
    </svg>
  )
}

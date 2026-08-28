import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsRight } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Sheet } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'

const POLICY = [
  {
    title: 'One thing gets you in',
    body: 'An email address, or the mobile number already on your account. Either way the 6-digit code goes to your inbox — nothing is ever texted, so nothing depends on an SMS route being approved that day.',
  },
  {
    title: 'Why we hold a number at all',
    body: 'So a driver can reach you at the door, and a hub can ring a receiver whose parcel has been waiting. We ask for it once, when the account is created. It is contact information: nothing is granted on the strength of it.',
  },
  {
    title: 'What we keep',
    body: 'Your name, email, number, the parcels and rides you book, and the OTP timestamps that form each delivery’s custody chain. That chain is what protects you in a dispute, so it is retained even after a delivery closes.',
  },
  {
    title: 'Verification documents',
    body: 'Aadhaar and licence checks run through a licensed verification partner. We store only the partner’s masked token and the pass/fail result — never the raw document number.',
  },
  {
    title: 'Location and photos',
    body: 'Location is used only while you have a trip or parcel in progress, to show it on the map — background tracking is off. The camera is used to scan parcel QR codes and photograph handovers, which is what protects both sides in a dispute. You can decline either and still use the app.',
  },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * What the single field accepts, matched to the server's own rule so the two
 * can never disagree about what a valid entry is.
 *
 * +91 98765 43210, 09876543210 and 9876543210 are the same number.
 */
function parseIdentifier(raw: string): { kind: 'email' | 'phone'; value: string } | null {
  const v = raw.trim().toLowerCase()
  if (!v) return null
  if (EMAIL_RE.test(v)) return { kind: 'email', value: v }

  const digits = v.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 13) return null
  const last10 = digits.slice(-10)
  return /^[6-9]\d{9}$/.test(last10) ? { kind: 'phone', value: last10 } : null
}

/**
 * Sign in.
 *
 * One field, because one field is all anybody should have to think about at a
 * door. An address or a number both land here and the server works out which
 * inbox the code belongs in. Nothing is boxed or bordered around it either — a
 * login screen that draws attention to itself is a login screen delaying the
 * app.
 */
export default function Login() {
  const navigate = useNavigate()
  const { requestCode } = useAuth()

  const [value, setValue] = useState('')
  const [policyOpen, setPolicyOpen] = useState(false)
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>()

  /* Digits only, so far: give the number pad rather than making somebody hunt
     for it. Anything with a letter or an @ in it is an address being typed. */
  const numeric = value.trim().length > 0 && !/[a-z@]/i.test(value)

  const submit = () => {
    const id = parseIdentifier(value)
    if (!id) {
      setError(
        value.includes('@')
          ? 'That email address doesn’t look right'
          : /\d/.test(value)
            ? 'That mobile number doesn’t look right — 10 digits, starting 6 to 9'
            : 'Enter your phone number or email',
      )
      return
    }

    setSending(true)
    setError(undefined)
    void (async () => {
      const result = await requestCode(id.value)
      setSending(false)

      if (!result.ok) {
        if (result.reason === 'no-account') {
          setError('No account uses that number yet. Enter your email address to sign up.')
        } else if (result.reason === 'too-soon') {
          setError(`A code was just sent. Try again in ${result.retryInSeconds ?? 30}s.`)
        } else if (result.reason === 'no-api') {
          setError(
            'This build has no sign-in server attached. Open the app at its current address, or reinstall the latest build.',
          )
        } else if (result.reason === 'offline') {
          setError('Could not reach DikkiConnect. Check your connection and try again.')
        } else {
          setError('That wasn’t accepted. Check it and try again.')
        }
        return
      }

      if (!result.delivered) {
        setError(
          result.reason === 'unconfigured'
            ? 'Email delivery isn’t switched on for this deployment yet.'
            : 'We couldn’t send the code just now. Try again in a moment.',
        )
        return
      }

      const qs = new URLSearchParams({ id: id.value })
      if (result.to) qs.set('to', result.to)
      navigate(`/auth/otp?${qs.toString()}`)
    })()
  }

  return (
    <Screen tone="white">
      <TopBar back backTo="/" className="pt-safe" />

      <div className="device-scroll flex flex-1 flex-col justify-center px-7 pb-10">
        <div className="mx-auto w-full max-w-[330px]">
          <div className="flex justify-center">
            <span className="grid size-11 place-items-center rounded-(--radius-md) bg-brand-50 text-brand-600">
              <ChevronsRight size={22} strokeWidth={2.6} />
            </span>
          </div>

          <h1 className="text-display mt-5 text-center text-[23px] leading-tight font-extrabold text-ink-900">
            Log in or sign up
          </h1>

          {/* ── The one credential ─────────────────────────────────────── */}
          <div
            className={cn(
              'mt-7 rounded-(--radius-md) border bg-white transition-colors',
              error ? 'border-danger-400' : 'border-ink-300 focus-within:border-ink-900',
            )}
          >
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(undefined)
              }}
              onFocus={() => setTouched(true)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              type="text"
              inputMode={numeric ? 'tel' : 'email'}
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="Phone number or email"
              className="h-13 w-full bg-transparent px-3.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>

          {error && (
            <p className="anim-fade-in mt-2 text-[12.5px] leading-snug font-semibold text-danger-600">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={sending}
            className={cn(
              'pressable focus-ring mt-3 h-13 w-full rounded-full text-[15px] font-bold text-white',
              'bg-brand-600 shadow-(--shadow-brand-sm) hover:bg-brand-700 disabled:opacity-70',
            )}
          >
            {sending ? 'Sending code…' : 'Continue'}
          </button>

          {/* Held back until the field is engaged. Shown up front it is one
              more thing to read before the only thing that matters. */}
          {touched && (
            <p className="anim-fade-in mt-3 text-[12px] leading-[1.5] text-ink-500">
              We’ll email you a 6-digit code — including when you sign in with your number.{' '}
              <button
                onClick={() => setPolicyOpen(true)}
                className="pressable-sm font-bold text-ink-800 underline underline-offset-2"
              >
                Privacy Policy
              </button>
            </p>
          )}

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
                    `${p.id === 'google' ? 'Google' : 'Apple'} sign-in needs its OAuth app registered under a company account — use your email for now.`,
                  )
                }
                className="pressable grid size-13 place-items-center rounded-(--radius-md) border border-ink-300 bg-white hover:bg-ink-50"
              >
                {p.mark}
              </button>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-[300px] text-center text-[11.5px] leading-relaxed text-ink-400">
          By continuing you agree to DikkiConnect&apos;s{' '}
          <button
            onClick={() => setPolicyOpen(true)}
            className="pressable-sm font-semibold text-ink-600 underline underline-offset-2"
          >
            Terms
          </button>
          ,{' '}
          <button
            onClick={() => setPolicyOpen(true)}
            className="pressable-sm font-semibold text-ink-600 underline underline-offset-2"
          >
            Privacy Policy
          </button>{' '}
          and the{' '}
          <button
            onClick={() => setPolicyOpen(true)}
            className="pressable-sm font-semibold text-ink-600 underline underline-offset-2"
          >
            Prohibited Items
          </button>{' '}
          declaration.
        </p>
      </div>

      <Sheet
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
        title="Privacy & terms"
        subtitle="The short version, in plain language"
        fullHeight
      >
        <div className="flex flex-col gap-5 pb-4">
          {POLICY.map((section) => (
            <div key={section.title}>
              <p className="text-[13.5px] font-bold text-ink-900">{section.title}</p>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-600">{section.body}</p>
            </div>
          ))}
          <div className="rounded-(--radius-md) bg-ink-50 p-3.5">
            <p className="text-[12px] leading-relaxed text-ink-500">
              This is a summary for the pilot. The binding Terms of Service and Privacy Policy are
              issued by the registered entity operating DikkiConnect and will be linked here before
              public launch.
            </p>
          </div>
        </div>
      </Sheet>
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

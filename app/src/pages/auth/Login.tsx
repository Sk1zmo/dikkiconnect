import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronsRight } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Sheet } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'

/**
 * Dial codes. India is the whole served network today, so it leads; the rest
 * are here because a number that cannot be entered is a sender who cannot be
 * called back.
 */
const DIAL_CODES = [
  { code: '+91', label: 'India', digits: 10 },
  { code: '+971', label: 'United Arab Emirates', digits: 9 },
  { code: '+65', label: 'Singapore', digits: 8 },
  { code: '+44', label: 'United Kingdom', digits: 10 },
  { code: '+1', label: 'United States', digits: 10 },
  { code: '+61', label: 'Australia', digits: 9 },
]

const POLICY = [
  {
    title: 'Your email is your account',
    body: 'We use it to send verification codes and to identify you across the sender, driver, passenger and hub portals. We never sell it, and other users never see it.',
  },
  {
    title: 'Why we also ask for your number',
    body: 'So a driver can reach you at the door, and a hub can ring a receiver whose parcel has been waiting. It is contact information, not a password — nothing is granted on the strength of it, and codes are never sent to it.',
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

/**
 * Sign in.
 *
 * One credential — the email address — because that is where the code goes.
 * The number is collected alongside it because every role in this product
 * eventually needs to phone somebody, and asking once here is kinder than
 * asking at the door.
 */
export default function Login() {
  const navigate = useNavigate()
  const { requestCode } = useAuth()

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dial, setDial] = useState(DIAL_CODES[0])
  const [dialOpen, setDialOpen] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({})

  const digits = phone.replace(/\D/g, '')
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const phoneOk = digits.length === dial.digits

  const submit = () => {
    const next: typeof errors = {}
    if (!emailOk) {
      next.email = email.trim() ? 'That email doesn’t look right' : 'Enter your email address'
    }
    if (!phoneOk) next.phone = `Enter your ${dial.digits}-digit mobile number`
    setErrors(next)
    if (Object.keys(next).length) return

    setSending(true)
    void (async () => {
      const result = await requestCode(email.trim().toLowerCase())
      setSending(false)

      if (!result.ok) {
        if (result.reason === 'too-soon') {
          setErrors({ email: `A code was just sent. Try again in ${result.retryInSeconds ?? 30}s.` })
        } else if (result.reason === 'no-api') {
          setErrors({
            email:
              'This build has no sign-in server attached. Open the app at its current address, or reinstall the latest build.',
          })
        } else if (result.reason === 'offline') {
          setErrors({ email: 'Could not reach DikkiConnect. Check your connection and try again.' })
        } else {
          setErrors({ email: 'That email address was not accepted.' })
        }
        return
      }

      if (!result.delivered) {
        setErrors({
          email:
            result.reason === 'unconfigured'
              ? 'Email delivery isn’t switched on for this deployment yet.'
              : 'We couldn’t send the code just now. Try again in a moment.',
        })
        return
      }

      // The number rides along so signup can store it without asking twice.
      const qs = new URLSearchParams({ id: email.trim().toLowerCase(), phone: digits })
      if (result.to) qs.set('to', result.to)
      navigate(`/auth/otp?${qs.toString()}`)
    })()
  }

  return (
    <Screen tone="white">
      <TopBar back backTo="/" className="pt-safe" />

      <div className="device-scroll flex flex-1 flex-col justify-center px-6 pb-10">
        <div className="anim-scale-in mx-auto w-full max-w-[344px] rounded-(--radius-2xl) border border-ink-200/80 bg-white px-6 py-10 shadow-(--shadow-e2)">
          <div className="flex justify-center">
            <span className="grid size-11 place-items-center rounded-(--radius-md) bg-brand-50 text-brand-600">
              <ChevronsRight size={22} strokeWidth={2.6} />
            </span>
          </div>

          <h1 className="text-display mt-5 text-center text-[23px] leading-tight font-extrabold text-ink-900">
            Log in or sign up
          </h1>

          <div className="mt-7 flex flex-col gap-3">
            {/* ── Email — the credential ────────────────────────────────── */}
            <div>
              <div
                className={cn(
                  'rounded-(--radius-md) border-2 bg-white transition-colors',
                  errors.email ? 'border-danger-400' : 'border-ink-200 focus-within:border-brand-500',
                )}
              >
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((x) => ({ ...x, email: undefined }))
                  }}
                  onFocus={() => setTouched(true)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Email address"
                  className="h-13 w-full bg-transparent px-3.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
                />
              </div>
              {errors.email && (
                <p className="anim-fade-in mt-1.5 text-[12.5px] font-semibold text-danger-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* ── Phone — contact only ──────────────────────────────────── */}
            <div>
              <div
                className={cn(
                  'flex items-stretch overflow-hidden rounded-(--radius-md) border-2 bg-white transition-colors',
                  errors.phone ? 'border-danger-400' : 'border-ink-200 focus-within:border-brand-500',
                )}
              >
                <button
                  type="button"
                  onClick={() => setDialOpen(true)}
                  className="flex shrink-0 items-center gap-1.5 border-r-2 border-ink-200 bg-ink-50 px-3.5 text-[15px] font-bold text-ink-800"
                >
                  {dial.code}
                  <ChevronDown size={15} className="text-ink-500" />
                </button>
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^\d ]/g, ''))
                    setErrors((x) => ({ ...x, phone: undefined }))
                  }}
                  onFocus={() => setTouched(true)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={dial.digits + 2}
                  placeholder="Mobile number"
                  className="h-13 w-full min-w-0 bg-transparent px-3.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
                />
              </div>
              {errors.phone && (
                <p className="anim-fade-in mt-1.5 text-[12.5px] font-semibold text-danger-600">
                  {errors.phone}
                </p>
              )}
            </div>

            <button
              onClick={submit}
              disabled={sending}
              className={cn(
                'pressable focus-ring mt-1 h-13 w-full rounded-full text-[15px] font-bold text-white',
                'bg-brand-600 shadow-(--shadow-brand-sm) hover:bg-brand-700 disabled:opacity-70',
              )}
            >
              {sending ? 'Sending code…' : 'Continue'}
            </button>

            {/* Held back until a field is engaged. Shown up front it is one
                more thing to read before the only thing that matters. */}
            {touched && (
              <p className="anim-fade-in text-[12px] leading-[1.5] text-ink-500">
                We&apos;ll email you a 6-digit code. Your number is for delivery contact only — no
                codes are sent to it.{' '}
                <button
                  onClick={() => setPolicyOpen(true)}
                  className="pressable-sm font-bold text-ink-800 underline underline-offset-2"
                >
                  Privacy Policy
                </button>
              </p>
            )}
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
                  setErrors({
                    email: `${p.id === 'google' ? 'Google' : 'Apple'} sign-in needs its OAuth app registered under a company account — use your email for now.`,
                  })
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
        open={dialOpen}
        onClose={() => setDialOpen(false)}
        title="Country code"
        subtitle="DikkiConnect operates in India — other codes are accepted for contact"
      >
        <div className="flex flex-col">
          {DIAL_CODES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setDial(c)
                setDialOpen(false)
              }}
              className={cn(
                'pressable flex items-center gap-3.5 rounded-(--radius-md) px-3 py-3.5 text-left transition-colors',
                c.code === dial.code ? 'bg-brand-50' : 'hover:bg-ink-50',
              )}
            >
              <span
                className={cn(
                  'grid h-9 min-w-[52px] place-items-center rounded-(--radius-sm) text-[13px] font-extrabold',
                  c.code === dial.code ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600',
                )}
              >
                {c.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-ink-900">{c.label}</span>
                <span className="text-[12px] text-ink-500">{c.digits}-digit numbers</span>
              </span>
              {c.code === dial.code && (
                <span className="text-[12px] font-bold text-brand-600">Selected</span>
              )}
            </button>
          ))}
        </div>
      </Sheet>

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
          <div className="rounded-(--radius-md) border border-ink-200 bg-ink-50 p-3.5">
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

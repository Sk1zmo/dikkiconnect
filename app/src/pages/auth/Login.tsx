import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Phone } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Button, Divider, Field, Note } from '@/components/ui'
import { LogoTile } from '@/components/brand/Logo'
import { HeroImage } from '@/components/viz/HeroImage'
import { cn } from '@/lib/cn'

/** Phone-first auth. Per PRD §8.1 there is no password anywhere in DikkiConnect. */
export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>()

  const digits = phone.replace(/\D/g, '')
  const valid = digits.length === 10

  const submit = () => {
    if (!valid) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setError(undefined)
    setSending(true)
    setTimeout(() => navigate(`/auth/otp?phone=${digits}`), 1000)
  }

  return (
    <Screen tone="white">
      {/* Hero banner.
          Drop a file at `app/public/login-hero.jpg` and it appears here
          automatically — no code change needed. Until then the scene stands in,
          so the screen never shows a broken image. */}
      <div className="relative h-[210px] shrink-0 overflow-hidden bg-dusk-900">
        <HeroImage focus="top" sceneAlign="xMidYMin" className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        <TopBar back backTo="/" floating tone="dark" className="pt-safe" />
      </div>

      <div className="device-scroll -mt-8 flex-1 px-7">
        <LogoTile size={56} className="relative mb-6" />

        <h1 className="text-display text-[28px] leading-[1.14] font-extrabold text-ink-900">
          Enter your mobile number
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-500">
          We&apos;ll text you a 6-digit code. New here? This creates your account too.
        </p>

        <div className="mt-8">
          <Field
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="98450 12345"
            value={phone}
            error={error}
            maxLength={11}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^\d ]/g, ''))
              setError(undefined)
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            prefix={
              <span className="flex items-center gap-2 border-r border-ink-200 pr-3">
                <Phone size={15} />
                <span className="text-[15px] font-bold text-ink-700">+91</span>
              </span>
            }
            hint="Standard SMS rates may apply"
          />

          <Button
            block
            size="lg"
            loading={sending}
            onClick={submit}
            disabled={!valid}
            iconRight={!sending ? <ArrowRight size={18} /> : undefined}
            className="mt-2"
          >
            {sending ? 'Sending code…' : 'Continue'}
          </Button>
        </div>

        <Divider label="or continue with" className="my-7" />

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Google', mark: <GoogleMark /> },
            { label: 'Truecaller', mark: <TruecallerMark /> },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setPhone('9845067890')
                setError(undefined)
              }}
              className={cn(
                'pressable flex h-13 items-center justify-center gap-2.5 rounded-(--radius-md) border border-ink-200 bg-white',
                'text-[14px] font-semibold text-ink-800 shadow-(--shadow-e1) hover:bg-ink-50',
              )}
            >
              {p.mark}
              {p.label}
            </button>
          ))}
        </div>

        <Note tone="neutral" className="mt-7">
          By continuing you agree to DikkiConnect&apos;s{' '}
          <span className="font-bold text-brand-700">Terms of Service</span>,{' '}
          <span className="font-bold text-brand-700">Privacy Policy</span> and the{' '}
          <span className="font-bold text-brand-700">Prohibited Items</span> declaration.
        </Note>
      </div>

      <div className="pb-safe shrink-0 px-7 py-5 text-center">
        <button
          onClick={() => navigate('/auth/role')}
          className="pressable-sm text-[13px] font-semibold text-ink-400 hover:text-ink-600"
        >
          Explore as a demo user →
        </button>
      </div>
    </Screen>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
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

function TruecallerMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#0089FF" />
      <path
        d="M8.4 6.2c.5-.4 1.2-.3 1.6.2l1.2 1.6c.4.5.3 1.2-.2 1.5l-.8.6c.5 1.2 1.5 2.2 2.7 2.7l.6-.8c.4-.5 1-.6 1.5-.2l1.6 1.2c.5.4.6 1.1.2 1.6l-.7.9c-.6.8-1.7 1-2.6.6a12.4 12.4 0 0 1-6.4-6.4c-.4-.9-.2-2 .6-2.6l.7-.9Z"
        fill="#fff"
      />
    </svg>
  )
}

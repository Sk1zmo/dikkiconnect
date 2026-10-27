import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Buildings,
  Car,
  Package,
  Phone,
  UserCircle,
  Users,
} from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { ActionBar, Button, Field, Note, useToast } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/cn'
import type { Role } from '@/lib/types'

const ROLES: Array<{ id: Role; icon: typeof Package; label: string; blurb: string }> = [
  { id: 'sender', icon: Package, label: 'Send a parcel', blurb: 'Ship things between cities' },
  { id: 'traveler', icon: Car, label: 'Drive & earn', blurb: 'Carry parcels and passengers' },
  { id: 'passenger', icon: Users, label: 'Find a ride', blurb: 'Book a seat on a car going your way' },
  { id: 'hub', icon: Buildings, label: 'Run a hub', blurb: 'Take in and hand out parcels' },
]

/**
 * Account creation. Only addresses with no account behind them land here — an
 * existing one signs straight in from the OTP screen.
 *
 * The number is asked for here rather than at the door, because this is the
 * one moment it is genuinely needed and the only moment it is asked at all.
 * Signing in later takes either the address or the number, and never both.
 */
export default function Signup() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const { completeSignup } = useAuth()
  const { setRole } = useApp()

  const ticket = params.get('ticket') ?? ''
  const identifier = params.get('id') ?? ''

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setChosenRole] = useState<Role>('sender')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [creating, setCreating] = useState(false)

  /* The ticket is the server's proof that this identifier just passed
     verification. Without one the signup endpoint refuses anyway — this only
     saves the user a pointless form. */
  useEffect(() => {
    if (!ticket || !identifier) navigate('/auth/login', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const digits = phone.replace(/\D/g, '')

  const submit = () => {
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Enter your full name'
    /* The number is optional for the beta, but a number that IS typed has to
       be real — a half-entered one on a parcel is worse than none at all. */
    if (digits && !/^[6-9]\d{9}$/.test(digits)) {
      next.phone = 'That doesn’t look like a mobile number'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setCreating(true)
    void (async () => {
      const result = await completeSignup({ ticket, name, phone: digits, role })
      setCreating(false)
      if (!result.ok) {
        setErrors(
          result.reason === 'phone-taken'
            ? { phone: 'That number is already on another account. Sign in with it instead.' }
            : { name: 'Could not create the account. Ask for a new code and try again.' },
        )
        return
      }
      setRole(role)
      toast.success(
        'Account created',
        `Welcome to WayPool, ${result.account.name.split(' ')[0]}.`,
      )
      navigate('/auth/role', { replace: true })
    })()
  }

  return (
    <Screen tone="white">
      <TopBar back backTo="/auth/login" title="Create your account" />

      <ScreenBody>
        <h1 className="text-display text-[26px] leading-[1.16] font-extrabold text-ink-900">
          Almost there
        </h1>
        <p className="mt-2 text-[14px] leading-[1.55] text-ink-500">
          <span className="font-bold text-ink-800">{identifier}</span> is verified. One more
          thing: the name that goes on your parcels and rides.
        </p>

        <div className="mt-7 flex flex-col gap-4">
          <Field
            label="Full name"
            placeholder="Your name as on ID"
            autoComplete="name"
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((x) => ({ ...x, name: undefined }))
            }}
            prefix={<UserCircle size={15} />}
          />

          {/* Optional for the beta.

              It was required, which put a second thing to type in front of a
              tester before they had seen a single screen — and bought nothing,
              because the sign-in code goes to the email either way. It is kept
              rather than removed because a hub ringing a sender about a parcel
              is a real need, and because a number still signs you in without
              typing an address. */}
          <Field
            label="Mobile number"
            optional
            placeholder="10-digit number"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={11}
            value={phone}
            error={errors.phone}
            hint="Only used if a hub needs to reach you about a parcel. You can add it later."
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^\d ]/g, ''))
              setErrors((x) => ({ ...x, phone: undefined }))
            }}
            prefix={
              <span className="flex items-center gap-1.5 text-[14px] font-bold text-ink-700">
                <Phone size={15} className="text-ink-400" />
                +91
              </span>
            }
          />
        </div>

        <p className="mt-7 mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          What brings you here?
        </p>
        {/* Selected is a brand ring, not a brand wash — the icon square already
            flips to brand-600 when a tile is picked, and two tints on the same
            object made the grid read as noisier than a four-way choice is. Same
            rule as the role picker on the next screen. */}
        <div className="grid grid-cols-2 gap-2.5">
          {ROLES.map((r) => {
            const active = role === r.id
            const Icon = r.icon
            return (
              <button
                key={r.id}
                onClick={() => setChosenRole(r.id)}
                className={cn(
                  'springy focus-ring rounded-(--radius-md) border bg-white p-4 text-left',
                  active
                    ? 'border-transparent ring-2 ring-brand-600'
                    : 'border-ink-200 hover:border-ink-300',
                )}
              >
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-(--radius-sm)',
                    active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
                  )}
                >
                  <Icon size={17} />
                </span>
                <span className="mt-2.5 block text-[13.5px] font-bold text-ink-900">{r.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-500">
                  {r.blurb}
                </span>
              </button>
            )
          })}
        </div>

        <Note tone="neutral" className="mt-6">
          You can switch between all four portals any time — this only picks where you land first.
        </Note>
      </ScreenBody>

      <ActionBar>
        <Button
          block
          size="lg"
          loading={creating}
          onClick={submit}
          iconRight={!creating ? <ArrowRight size={18} /> : undefined}
        >
          {creating ? 'Creating account…' : 'Create account'}
        </Button>
      </ActionBar>
    </Screen>
  )
}

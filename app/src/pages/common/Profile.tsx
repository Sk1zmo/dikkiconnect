import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Buildings,
  CalendarBlank,
  Car,
  Check,
  CaretRight,
  CreditCard,
  FileText,
  Gift,
  Question,
  SignOut,
  Package,
  Pencil,
  Phone,
  Gear as SettingsIcon,
  ShieldCheck,
  Users,
} from '@phosphor-icons/react'
import { Screen, ScreenBody } from '@/components/layout/Screen'
import { ConfirmDialog, Sheet, useToast } from '@/components/ui'
import { useApp } from '@/lib/store'
import { APP_VERSION, BRAND } from '@/lib/brand'
import { maskPhone } from '@/lib/format'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   Profile.

   White background, clean typography, outline icons. Hierarchy is carried in
   three places and nowhere else:

     · the statistics row — an icon above each figure, so the three numbers
       can be scanned without reading their labels;
     · the Current Mode card — the one tinted surface on the screen, because
       switching mode is the one thing here that changes what the app is;
     · Refer & earn — a supporting line and a green figure, so the reward is
       legible without looking like an advert.

   Tokens (from the profile spec). Blue is the brand token; the greys, tint
   and green are the spec's exact values.

     primary text   #111827      secondary text  #6B7280
     divider        #F3F4F6      row icon bg     #F9FAFB on #F3F4F6
     chevron        #B0B4BA      success green   #16A34A
     mode tint      brand-50     mode label      brand-700
   ═══════════════════════════════════════════════════════════════════════════ */

const ROLE_META: Record<
  Role,
  { icon: typeof Package; label: string; mode: string; home: string; blurb: string }
> = {
  sender: {
    icon: Package,
    label: 'Send a parcel',
    mode: 'Parcel Sender',
    home: '/sender',
    blurb: 'Book intercity delivery',
  },
  traveler: {
    icon: Users,
    label: 'Share a ride',
    mode: 'Driver',
    home: '/traveler',
    blurb: 'Carry parcels and riders',
  },
  passenger: {
    icon: Car,
    label: 'Book a ride',
    mode: 'Passenger',
    home: '/passenger',
    blurb: 'Book an affordable seat',
  },
  hub: {
    icon: Buildings,
    label: 'Run a hub',
    mode: 'Hub Partner',
    home: '/hub',
    blurb: 'Intake and handoffs',
  },
}

/** Initials, capped at two — three reads as an acronym rather than a person. */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/* ── Row ───────────────────────────────────────────────────────────────────
   One row type for the whole screen: a leading icon in a soft grey rounded
   square, a title, an optional supporting line, an optional value on the right
   and a chevron. Rows are full-width buttons at least 48px tall.

   The square replaced a circle. A circle is what an avatar is, and on a screen
   that opens with a real avatar the repeated circles below it read as a column
   of tiny faces. It also puts these rows in the same shape as every list row
   elsewhere in the app, which all use the rounded square.                    */
function Row({
  icon: Icon,
  title,
  subtitle,
  meta,
  metaTone = 'muted',
  chevron = true,
  to,
  onClick,
  tone = 'default',
}: {
  icon: typeof Package
  title: string
  subtitle?: string
  meta?: string
  metaTone?: 'muted' | 'success'
  chevron?: boolean
  to?: string
  onClick?: () => void
  tone?: 'default' | 'accent'
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => (to ? navigate(to) : onClick?.())}
      className="group flex min-h-12 w-full items-center gap-3.5 py-3 text-left transition-opacity active:opacity-55"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) border border-[#F3F4F6] bg-[#F9FAFB]">
        <Icon size={17} className={tone === 'accent' ? 'text-brand-600' : 'text-[#6B7280]'} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[15px] font-medium',
            tone === 'accent' ? 'text-brand-600' : 'text-[#111827]',
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="mt-0.5 block text-[12.5px] leading-snug text-[#6B7280]">
            {subtitle}
          </span>
        )}
      </span>
      {meta && (
        <span
          className={cn(
            'tabular shrink-0',
            metaTone === 'success'
              ? 'text-[15px] font-extrabold text-[#16A34A]'
              : 'text-[13.5px] text-[#6B7280]',
          )}
        >
          {meta}
        </span>
      )}
      {chevron && <CaretRight size={16} className="shrink-0 text-[#B0B4BA]" />}
    </button>
  )
}

/** Section label: 11px, medium, muted, uppercase. */
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="pt-6 pb-1.5 text-[11px] font-medium tracking-[0.06em] text-[#6B7280] uppercase">
      {children}
    </p>
  )
}

/** Full-bleed hairline. Pulled out to the shell edges by negative margin. */
const Rule = () => <span className="-mx-5 block h-px bg-[#F3F4F6]" />

export default function Profile() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, role, setRole, signOut } = useApp()

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)

  const switchTo = (next: Role) => {
    setRole(next)
    setSwitcherOpen(false)
    toast.success('Switched mode', ROLE_META[next].label)
    navigate(ROLE_META[next].home)
  }

  const STATS = [
    { icon: Package, value: '18', label: 'Parcels sent' },
    { icon: Car, value: '7', label: 'Rides taken' },
    // Year only, per the content spec.
    { icon: CalendarBlank, value: '2025', label: 'Member since' },
  ]

  const current = ROLE_META[role]

  return (
    <Screen tone="white">
      <ScreenBody className="px-5 pb-8" padded={false}>
        {/* ── Identity ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-7 pb-6">
          <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-brand-600 text-[20px] font-bold tracking-[-0.02em] text-white">
            {initials(user.name)}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[19px] leading-tight font-semibold text-[#111827]">
              {user.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="tabular truncate text-[14px] text-[#6B7280]">{maskPhone(user.phone)}</p>
              <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand-600">
                <ShieldCheck size={13} />
                Verified
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/profile/edit')}
            aria-label="Edit profile"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[#F3F4F6] bg-[#F9FAFB] transition-opacity active:opacity-55"
          >
            <Pencil size={17} className="text-[#6B7280]" />
          </button>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────────
            Icon, then the figure, then the label — the icon says what the
            number is before the label has been read.

            The figure carries the row on its own now: display face, extrabold,
            tabular, and four points larger, with the label dropped to a quiet
            semibold caption underneath. Set at the same weight as its label the
            strip read as three captions; the numbers are the reason anybody
            looks at it. */}
        <div className="grid grid-cols-3 rounded-2xl border border-[#F3F4F6] py-4">
          {STATS.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className={cn(
                  'flex flex-col items-center text-center',
                  i > 0 && 'border-l border-[#F3F4F6]',
                )}
              >
                <Icon size={18} className="text-[#6B7280]" />
                <p className="tabular text-display tracking-title mt-2 text-[22px] leading-none font-extrabold text-[#111827]">
                  {s.value}
                </p>
                <p className="mt-1.5 text-[11.5px] font-semibold text-[#6B7280]">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* ── Current mode ──────────────────────────────────────────────────
            The one tinted surface on the screen. Tapping anywhere on the card
            opens the switcher; "Switch" is a label, not a separate target. */}
        <button
          onClick={() => setSwitcherOpen(true)}
          className="mt-4 flex w-full items-center gap-4 rounded-2xl bg-brand-50 p-4 text-left transition-opacity active:opacity-70"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium tracking-[0.06em] text-brand-700 uppercase">
              Current mode
            </span>
            <span className="mt-1 block truncate text-[16px] font-semibold text-[#111827]">
              {current.label}
            </span>
            <span className="mt-0.5 block text-[13px] text-[#6B7280]">
              You are currently in {current.mode} mode.
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-brand-600">
            Switch
            <ArrowRight size={15} />
          </span>
        </button>

        {/* Drivers only: the one piece of state that can block earning. */}
        {role === 'traveler' && (
          <div className="mt-2">
            <Row
              icon={ShieldCheck}
              title="Finish verification"
              meta="5 of 7"
              to="/traveler/kyc"
              tone="accent"
            />
            <Rule />
          </div>
        )}

        <SectionLabel>Account</SectionLabel>
        <Rule />
        <Row icon={Pencil} title="Edit profile" to="/profile/edit" />
        <Rule />
        <Row icon={CreditCard} title="Payment methods" meta="UPI" to="/payment-methods" />
        <Rule />
        <Row
          icon={Phone}
          title="Emergency contacts"
          meta="1"
          onClick={() => toast.info('Emergency contacts', 'Rahul S. · +91 98450 98450')}
        />
        <Rule />
        <Row
          icon={FileText}
          title="Documents"
          onClick={() => toast.info('Documents', 'All your invoices are emailed automatically.')}
        />
        <Rule />

        <SectionLabel>Preferences</SectionLabel>
        <Rule />
        <Row icon={Bell} title="Notifications" to="/notifications" />
        <Rule />
        <Row icon={SettingsIcon} title="Settings" to="/settings" />
        <Rule />
        <Row
          icon={Gift}
          title="Refer & earn"
          subtitle="Invite friends and earn rewards"
          meta="₹100"
          metaTone="success"
          chevron={false}
          onClick={() => toast.success('Invite link copied', 'Share it anywhere.')}
        />
        <Rule />

        <SectionLabel>Support</SectionLabel>
        <Rule />
        <Row icon={Question} title="Help centre" to="/help" />
        <Rule />

        {/* Sign out sits below the specified sections; it is the only way out
            of the account, so it stays. Black, not red — the dialog carries
            the warning. */}
        <button
          onClick={() => setSignOutOpen(true)}
          className="mt-6 flex min-h-12 w-full items-center gap-3.5 py-3 text-left transition-opacity active:opacity-55"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) border border-[#F3F4F6] bg-[#F9FAFB]">
            <SignOut size={17} className="text-[#6B7280]" />
          </span>
          <span className="flex-1 text-[15px] font-medium text-[#111827]">Sign out</span>
        </button>
        <Rule />

        <p className="pt-6 pb-2 text-[12px] text-[#B0B4BA]">
          {BRAND.name} {APP_VERSION} · Bangalore ↔ Mysore
        </p>
      </ScreenBody>

      {/* ── Role switcher ────────────────────────────────────────────────── */}
      <Sheet
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        title="Switch mode"
        subtitle="One account, four ways to use it"
      >
        <div className="-mx-5">
          {(Object.keys(ROLE_META) as Role[]).map((r) => {
            const meta = ROLE_META[r]
            const Icon = meta.icon
            const active = r === role
            return (
              <button
                key={r}
                onClick={() => switchTo(r)}
                className="flex w-full items-center gap-4 border-t border-[#F3F4F6] px-5 py-4 text-left transition-opacity last:border-b active:opacity-55"
              >
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-(--radius-sm) border',
                    active
                      ? 'border-brand-100 bg-brand-50 text-brand-600'
                      : 'border-[#F3F4F6] bg-[#F9FAFB] text-[#6B7280]',
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-[15px] font-semibold',
                      active ? 'text-brand-600' : 'text-[#111827]',
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-[#6B7280]">{meta.blurb}</span>
                </span>
                {active && <Check size={18} className="shrink-0 text-brand-600" />}
              </button>
            )
          })}
        </div>
      </Sheet>

      <ConfirmDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => {
          signOut()
          navigate('/', { replace: true, state: { signedOut: true } })
        }}
        tone="danger"
        icon={<SignOut size={26} />}
        title={`Sign out of ${BRAND.name}?`}
        body="Your bookings and wallet stay on your account. Signing back in takes an email or mobile number and a code — no password."
        confirmLabel="Sign out"
      />
    </Screen>
  )
}

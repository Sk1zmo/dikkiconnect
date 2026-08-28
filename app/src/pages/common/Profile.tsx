import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  Car,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  HelpCircle,
  LogOut,
  Package,
  Pencil,
  Phone,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Screen, ScreenBody } from '@/components/layout/Screen'
import { ConfirmDialog, Sheet, useToast } from '@/components/ui'
import { useApp } from '@/lib/store'
import { maskPhone } from '@/lib/format'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   Profile — minimal.

   The rest of the app is built on tinted cards, elevation and a blue gradient
   hero. This screen deliberately is not, because a settings list is the one
   place where decoration has nothing to decorate: it is forty words and
   fourteen destinations, and every shadow drawn around them is a shadow the
   eye has to discount before it can read.

   Three colours, and each one has exactly one job:

     · white   — every surface, without exception. No cards, no tints, no
                 second grey to signal grouping; whitespace groups instead.
     · black   — anything you are meant to read.
     · blue    — anything you are meant to act on, plus identity. Used at most
                 twice per viewport; the moment a third blue thing appears the
                 colour stops meaning "here" and starts meaning nothing.

   Structure is carried by hairlines and space, not containers. Rules run
   full-bleed rather than inset, because an inset rule is a card outline that
   lost its nerve — either the row is a discrete object or the list is one
   surface, and this list is one surface.
   ═══════════════════════════════════════════════════════════════════════════ */

const ROLE_META: Record<Role, { icon: typeof Package; label: string; home: string; blurb: string }> =
  {
    sender: {
      icon: Package,
      label: 'Send parcels',
      home: '/sender',
      blurb: 'Book intercity delivery',
    },
    traveler: {
      icon: Car,
      label: 'Drive & earn',
      home: '/traveler',
      blurb: 'Carry parcels and riders',
    },
    passenger: { icon: Users, label: 'Book rides', home: '/passenger', blurb: 'Share a car seat' },
    hub: { icon: Building2, label: 'Manage a hub', home: '/hub', blurb: 'Intake and handoffs' },
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
   One row type for the whole screen. The icon is a 17px line glyph in mid
   grey and never gets a tile behind it: a tinted square around an icon exists
   to separate it from a busy background, and there is no busy background
   left to separate it from.                                                  */
function Row({
  icon: Icon,
  title,
  meta,
  to,
  onClick,
  tone = 'default',
}: {
  icon: typeof Package
  title: string
  meta?: string
  to?: string
  onClick?: () => void
  tone?: 'default' | 'accent'
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => (to ? navigate(to) : onClick?.())}
      className="group flex w-full items-center gap-4 py-[15px] text-left transition-opacity active:opacity-55"
    >
      <Icon
        size={17}
        strokeWidth={1.75}
        className={cn('shrink-0', tone === 'accent' ? 'text-brand-600' : 'text-black/40')}
      />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[15px] font-medium',
          tone === 'accent' ? 'text-brand-600' : 'text-black',
        )}
      >
        {title}
      </span>
      {meta && <span className="shrink-0 text-[13.5px] text-black/40">{meta}</span>}
      <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 text-black/25" />
    </button>
  )
}

/** Section label. Sentence case, not uppercase — caps are a second voice. */
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="pt-7 pb-1 text-[12.5px] font-semibold tracking-[-0.005em] text-black/40">
      {children}
    </p>
  )
}

/** Full-bleed hairline. Pulled out to the shell edges by negative margin. */
const Rule = () => <span className="-mx-5 block h-px bg-black/[0.07]" />

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
    { value: '18', label: 'Parcels sent' },
    { value: '7', label: 'Rides taken' },
    { value: '2025', label: 'Member since' },
  ]

  return (
    <Screen tone="white">
      <ScreenBody className="px-5 pb-8" padded={false}>
        {/* ── Identity ──────────────────────────────────────────────────────
            The avatar is the screen's one saturated element. It is a square
            with a soft radius rather than a circle, because a circle here
            competes with the tab bar's circular glyphs for the same meaning. */}
        <div className="flex items-center gap-4 pt-8 pb-7">
          <span className="grid size-[62px] shrink-0 place-items-center rounded-[19px] bg-brand-600 text-[21px] font-bold tracking-[-0.02em] text-white">
            {initials(user.name)}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-display truncate text-[25px] leading-tight font-bold text-black">
              {user.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="tabular truncate text-[14px] text-black/50">{maskPhone(user.phone)}</p>
              <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand-600">
                <ShieldCheck size={13} strokeWidth={2} />
                Verified
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/profile/edit')}
            aria-label="Edit profile"
            className="grid size-9 shrink-0 place-items-center rounded-full transition-opacity active:opacity-55"
          >
            <Pencil size={17} strokeWidth={1.75} className="text-black/40" />
          </button>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────────
            Numbers get the weight, labels get the grey. Divided by hairlines
            rather than boxed, so three figures read as one row of facts. */}
        <Rule />
        <div className="grid grid-cols-3 py-5">
          {STATS.map((s, i) => (
            <div key={s.label} className={cn(i > 0 && 'border-l border-black/[0.07] pl-4')}>
              <p className="tabular text-[22px] leading-none font-bold tracking-[-0.03em] text-black">
                {s.value}
              </p>
              <p className="mt-1.5 text-[12.5px] text-black/40">{s.label}</p>
            </div>
          ))}
        </div>
        <Rule />

        {/* ── Mode ──────────────────────────────────────────────────────────
            The only row that carries a real action word, so it is the only
            row allowed to be blue. */}
        <button
          onClick={() => setSwitcherOpen(true)}
          className="flex w-full items-center gap-4 py-[18px] text-left transition-opacity active:opacity-55"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] text-black/40">Current mode</span>
            <span className="mt-1 block truncate text-[16px] font-semibold text-black">
              {ROLE_META[role].label}
            </span>
          </span>
          <span className="shrink-0 text-[14px] font-semibold text-brand-600">Switch</span>
        </button>
        <Rule />

        {/* Drivers only: the one piece of state that can block earning. */}
        {role === 'traveler' && (
          <>
            <Row
              icon={ShieldCheck}
              title="Finish verification"
              meta="5 of 7"
              to="/traveler/kyc"
              tone="accent"
            />
            <Rule />
          </>
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
          meta="₹100"
          onClick={() => toast.success('Invite link copied', 'Share it anywhere.')}
        />
        <Rule />

        <SectionLabel>Support</SectionLabel>
        <Rule />
        <Row icon={HelpCircle} title="Help centre" to="/help" />
        <Rule />
        <Row icon={Phone} title="Contact support" to="/support" />
        <Rule />

        {/* Sign out stays black. Red would be a fourth colour spent on the
            least likely tap on the screen, and the dialog already carries the
            warning. */}
        <button
          onClick={() => setSignOutOpen(true)}
          className="flex w-full items-center gap-4 py-[15px] text-left transition-opacity active:opacity-55"
        >
          <LogOut size={17} strokeWidth={1.75} className="shrink-0 text-black/40" />
          <span className="flex-1 text-[15px] font-medium text-black">Sign out</span>
        </button>
        <Rule />

        <p className="pt-6 pb-2 text-[12px] text-black/25">
          DikkiConnect 1.0.0 · Bangalore ↔ Mysore
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
                className="flex w-full items-center gap-4 border-t border-black/[0.07] px-5 py-4 text-left transition-opacity last:border-b active:opacity-55"
              >
                <Icon
                  size={19}
                  strokeWidth={1.75}
                  className={cn('shrink-0', active ? 'text-brand-600' : 'text-black/40')}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-[15px] font-semibold',
                      active ? 'text-brand-600' : 'text-black',
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-black/40">{meta.blurb}</span>
                </span>
                {active && (
                  <Check size={18} strokeWidth={2.4} className="shrink-0 text-brand-600" />
                )}
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
          navigate('/', { replace: true })
        }}
        tone="danger"
        icon={<LogOut size={26} />}
        title="Sign out of DikkiConnect?"
        body="You'll need your mobile number and an OTP to sign back in."
        confirmLabel="Sign out"
      />
    </Screen>
  )
}

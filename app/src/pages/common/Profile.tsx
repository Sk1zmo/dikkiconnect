import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  Car,
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
  Star,
  Users,
} from 'lucide-react'
import { Screen, ScreenBody, BrandHeader } from '@/components/layout/Screen'
import {
  Avatar,
  Badge,
  Card,
  ConfirmDialog,
  Group,
  ListRow,
  Note,
  Sheet,
  useToast,
} from '@/components/ui'
import { useApp } from '@/lib/store'
import { maskPhone } from '@/lib/format'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/cn'

const ROLE_META: Record<Role, { icon: typeof Package; label: string; home: string; blurb: string }> =
  {
    sender: { icon: Package, label: 'Send parcels', home: '/sender', blurb: 'Book intercity delivery' },
    traveler: { icon: Car, label: 'Drive & earn', home: '/traveler', blurb: 'Carry parcels and riders' },
    passenger: { icon: Users, label: 'Book rides', home: '/passenger', blurb: 'Share a car seat' },
    hub: { icon: Building2, label: 'Manage a hub', home: '/hub', blurb: 'Intake and handoffs' },
  }

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

  return (
    <Screen>
      <BrandHeader className="pt-safe">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size={64} onBrand />
          <div className="min-w-0 flex-1">
            <p className="text-display truncate text-[21px] font-extrabold">{user.name}</p>
            <p className="tabular mt-0.5 truncate text-[13px] text-white/70">
              {maskPhone(user.phone)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold backdrop-blur-md">
                <ShieldCheck size={11} />
                Verified
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold backdrop-blur-md">
                <Star size={11} className="fill-current" />
                4.9
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            aria-label="Edit profile"
            className="pressable-sm grid size-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur-md"
          >
            <Pencil size={17} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            { label: 'Parcels sent', value: '18' },
            { label: 'Rides taken', value: '7' },
            { label: 'Member since', value: '2025' },
          ].map((s) => (
            <div key={s.label} className="rounded-(--radius-md) bg-white/12 px-3 py-2.5 backdrop-blur-md">
              <p className="tabular text-[17px] leading-none font-extrabold">{s.value}</p>
              <p className="mt-1.5 text-[10px] font-semibold text-white/65">{s.label}</p>
            </div>
          ))}
        </div>
      </BrandHeader>

      <ScreenBody className="pt-5">
        {/* Mode switcher */}
        <Card onClick={() => setSwitcherOpen(true)} className="flex items-center gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
            {(() => {
              const Icon = ROLE_META[role].icon
              return <Icon size={19} />
            })()}
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
              Current mode
            </p>
            <p className="mt-0.5 truncate text-[14.5px] font-bold text-ink-900">
              {ROLE_META[role].label}
            </p>
          </div>
          <Badge tone="brand" size="sm">
            Switch
          </Badge>
          <ChevronRight size={17} className="shrink-0 text-ink-300" />
        </Card>

        {/* KYC prompt for drivers */}
        {role === 'traveler' && (
          <Card to="/traveler/kyc" className="mt-3 flex items-center gap-3.5 border-warn-100 bg-warn-50">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-warn-500/15 text-warn-600">
              <ShieldCheck size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-warn-800">Verification: 5 of 7 complete</p>
              <p className="mt-0.5 text-[12px] text-warn-700/85">Licence and RC still pending</p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-warn-600" />
          </Card>
        )}

        {/* Account */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Account
        </p>
        <Group>
          <ListRow
            icon={<Pencil size={17} />}
            title="Edit profile"
            subtitle="Name, email and photo"
            to="/profile/edit"
            chevron
          />
          <ListRow
            icon={<CreditCard size={17} />}
            title="Payment methods"
            subtitle="UPI, cards and wallets"
            to="/payment-methods"
            chevron
          />
          <ListRow
            icon={<Phone size={17} />}
            title="Emergency contacts"
            subtitle="1 contact saved"
            onClick={() => toast.info('Emergency contacts', 'Rahul S. · +91 98450 98450')}
            chevron
          />
          <ListRow
            icon={<FileText size={17} />}
            title="Documents"
            subtitle="KYC, invoices and receipts"
            onClick={() => toast.info('Documents', 'All your invoices are emailed automatically.')}
            chevron
          />
        </Group>

        {/* Preferences */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Preferences
        </p>
        <Group>
          <ListRow
            icon={<Bell size={17} />}
            title="Notifications"
            subtitle="Push, SMS and email"
            to="/notifications"
            chevron
          />
          <ListRow
            icon={<SettingsIcon size={17} />}
            title="Settings"
            subtitle="Language, privacy and data"
            to="/settings"
            chevron
          />
          <ListRow
            icon={<Gift size={17} />}
            iconTone="success"
            title="Refer & earn"
            subtitle="₹100 per friend who joins"
            onClick={() => toast.success('Invite link copied', 'Share it anywhere.')}
            chevron
          />
        </Group>

        {/* Support */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Support
        </p>
        <Group>
          <ListRow
            icon={<HelpCircle size={17} />}
            title="Help centre"
            subtitle="Guides and common questions"
            to="/help"
            chevron
          />
          <ListRow
            icon={<Phone size={17} />}
            title="Contact support"
            subtitle="Chat with a human, 24×7"
            to="/support"
            chevron
          />
          <ListRow
            icon={<LogOut size={17} />}
            iconTone="danger"
            title="Sign out"
            onClick={() => setSignOutOpen(true)}
          />
        </Group>

        <Note tone="neutral" className="mt-6">
          DikkiConnect · version 1.0.0 (pilot) · Bangalore ↔ Mysore corridor
        </Note>
      </ScreenBody>

      {/* Role switcher */}
      <Sheet
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        title="Switch mode"
        subtitle="One DikkiConnect account, four ways to use it"
      >
        <div className="flex flex-col gap-2.5">
          {(Object.keys(ROLE_META) as Role[]).map((r) => {
            const meta = ROLE_META[r]
            const Icon = meta.icon
            const active = r === role
            return (
              <button
                key={r}
                onClick={() => switchTo(r)}
                className={cn(
                  'pressable flex items-center gap-3.5 rounded-(--radius-md) border-2 bg-white p-4 text-left transition-all',
                  active ? 'border-brand-600 bg-brand-50/50' : 'border-ink-200',
                )}
              >
                <span
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-(--radius-sm)',
                    active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
                  )}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-ink-900">{meta.label}</span>
                  <span className="mt-0.5 block text-[12px] text-ink-500">{meta.blurb}</span>
                </span>
                {active && <Badge tone="brand" size="sm">Current</Badge>}
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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, Car, Package, Users } from 'lucide-react'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useApp } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import type { Role } from '@/lib/types'

const ROLES: Array<{
  id: Role
  icon: typeof Package
  title: string
  body: string
  home: string
  accent: string
}> = [
  {
    id: 'sender',
    icon: Package,
    title: 'Send a parcel',
    body: 'Book intercity delivery through a hub near you',
    home: '/sender',
    accent: 'from-brand-500 to-brand-700',
  },
  {
    id: 'traveler',
    icon: Car,
    title: 'Drive & earn',
    body: 'Carry parcels and passengers on trips you already make',
    home: '/traveler',
    accent: 'from-success-500 to-success-700',
  },
  {
    id: 'passenger',
    icon: Users,
    title: 'Book a ride',
    body: 'Share an intercity car seat at cost',
    home: '/passenger',
    accent: 'from-accent-500 to-accent-600',
  },
  {
    id: 'hub',
    icon: Building2,
    title: 'Run a hub',
    body: 'Manage intake, handoffs and inventory at your shop',
    home: '/hub',
    accent: 'from-warn-500 to-warn-700',
  },
]

/**
 * Role picker. DikkiConnect is one account across four apps — the PRD's whole
 * economics depend on a single driver-acquisition funnel serving both lines.
 */
export default function RoleSelect() {
  const navigate = useNavigate()
  const { setRole, user } = useApp()
  const { addRole, account } = useAuth()
  const [selected, setSelected] = useState<Role>(account?.roles[0] ?? 'sender')
  const [going, setGoing] = useState(false)

  const enter = () => {
    setGoing(true)
    setRole(selected)
    // Records the role on the account, so the profile shows every portal this
    // person actually uses rather than just the one they signed up through.
    addRole(selected)
    const home = ROLES.find((r) => r.id === selected)?.home ?? '/sender'
    setTimeout(() => navigate(home, { replace: true }), 620)
  }

  return (
    <Screen tone="white">
      <div className="device-scroll flex-1 px-6 pt-safe">
        <div className="pt-6">
          <p className="text-[13px] font-semibold text-brand-600">
            Welcome, {user.name.split(' ')[0]} 👋
          </p>
          <h1 className="text-display mt-2 text-[28px] leading-[1.14] font-extrabold text-ink-900">
            What brings you to DikkiConnect?
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-500">
            Pick one to start. You can switch any time from your profile — it&apos;s all one account.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {ROLES.map((r, i) => {
            const active = selected === r.id
            const Icon = r.icon
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setSelected(r.id)}
                className={cn(
                  'pressable focus-ring flex items-center gap-4 rounded-(--radius-lg) border-2 bg-white p-4 text-left transition-all duration-200',
                  active
                    ? 'border-brand-600 shadow-(--shadow-brand-sm)'
                    : 'border-ink-200 hover:border-ink-300',
                )}
              >
                <span
                  className={cn(
                    'grid size-12 shrink-0 place-items-center rounded-(--radius-md) bg-gradient-to-br text-white transition-transform duration-300',
                    r.accent,
                    active ? 'scale-100' : 'scale-95 opacity-80',
                  )}
                >
                  <Icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15.5px] font-bold text-ink-900">{r.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-500">
                    {r.body}
                  </span>
                </span>
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all',
                    active ? 'border-brand-600 bg-brand-600' : 'border-ink-300',
                  )}
                >
                  {active && <span className="size-2 rounded-full bg-white" />}
                </span>
              </motion.button>
            )
          })}
        </div>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-ink-400">
          Driving requires KYC. Aadhaar + selfie unlocks parcels; licence + RC unlocks passengers.
        </p>
      </div>

      <div className="pb-safe shrink-0 px-6 py-5">
        <Button
          block
          size="lg"
          loading={going}
          onClick={enter}
          iconRight={!going ? <ArrowRight size={18} /> : undefined}
        >
          {going ? 'Setting up…' : 'Continue'}
        </Button>
      </div>
    </Screen>
  )
}

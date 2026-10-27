import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Buildings, Car, Package, Users } from '@phosphor-icons/react'
import { Screen } from '@/components/layout/Screen'
import { ActionBar, Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { BRAND } from '@/lib/brand'
import { useApp } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { roleHome, type Role } from '@/lib/types'

const ROLES: Array<{
  id: Role
  icon: typeof Package
  title: string
  body: string
  accent: string
}> = [
  // Icon accents come from the onboarding spec (blue / purple / green /
  // orange). Blue is the brand token rather than the spec's placeholder hex so
  // the first card matches the selected border and the Continue button.
  {
    id: 'sender',
    icon: Package,
    title: 'Send a parcel',
    body: 'Book intercity delivery through a hub near you',
    accent: 'bg-brand-600',
  },
  {
    id: 'traveler',
    icon: Users,
    title: 'Share a ride',
    body: 'Share an intercity car seat at cost',
    accent: 'bg-[#7C4DDB]',
  },
  {
    id: 'passenger',
    icon: Car,
    title: 'Book a ride',
    body: 'Book an affordable intercity seat',
    accent: 'bg-[#1E9E6A]',
  },
  {
    id: 'hub',
    icon: Buildings,
    title: 'Run a hub',
    body: 'Manage intake, handoffs and inventory at your shop',
    accent: 'bg-[#D8791F]',
  },
]

/**
 * Role picker. WayPool is one account across four apps — the PRD's whole
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
    setTimeout(() => navigate(roleHome(selected), { replace: true }), 620)
  }

  return (
    <Screen tone="white">
      <div className="device-scroll flex-1 px-5 pt-safe">
        <div className="pt-6">
          <p className="text-[13px] font-semibold text-brand-600">
            Welcome, {user.name.split(' ')[0]}
          </p>
          <h1 className="text-display mt-2 text-[28px] leading-[1.14] font-extrabold text-ink-900">
            What brings you to {BRAND.name}?
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-500">
            Pick one to start. You can switch any time from your profile
          </p>
        </div>

        {/* Each card carries its own colour in the icon square, so filling the
            card with brand-50 when it is picked put two tints on one object and
            made the four cards read as four different kinds of thing. The
            selected state is a 2px brand ring instead: the card stays white,
            the accent stays the only colour, and the ring is the same signal on
            every card. */}
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
                  'pressable focus-ring flex items-center gap-4 rounded-(--radius-lg) border bg-white p-4 text-left transition-all duration-200',
                  active
                    ? 'border-transparent ring-2 ring-brand-600'
                    : 'border-ink-200 hover:border-ink-300',
                )}
              >
                <span
                  className={cn(
                    'grid size-12 shrink-0 place-items-center rounded-(--radius-md) text-white transition-all duration-300',
                    r.accent,
                    active ? 'scale-100' : 'scale-95',
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
                    'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all duration-200',
                    active ? 'border-brand-600 bg-brand-600' : 'border-ink-300 bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full bg-white transition-transform duration-200',
                      active ? 'scale-100' : 'scale-0',
                    )}
                  />
                </span>
              </motion.button>
            )
          })}
        </div>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-ink-400">
          Driving requires KYC. Aadhaar + selfie unlocks parcels; licence + RC unlocks passengers.
        </p>
      </div>

      <ActionBar>
        <Button
          block
          size="lg"
          variant="brand"
          loading={going}
          onClick={enter}
          iconRight={!going ? <ArrowRight size={18} /> : undefined}
        >
          {going ? 'Setting up…' : 'Continue'}
        </Button>
      </ActionBar>
    </Screen>
  )
}

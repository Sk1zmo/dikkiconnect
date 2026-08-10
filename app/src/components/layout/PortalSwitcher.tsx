import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Car, Check, ChevronsUpDown, Package, Users } from 'lucide-react'
import { Sheet } from '@/components/ui'
import { useApp } from '@/lib/store'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/cn'

export const PORTALS: Array<{
  id: Role
  icon: typeof Package
  label: string
  blurb: string
  home: string
  accent: string
}> = [
  {
    id: 'sender',
    icon: Package,
    label: 'Sender',
    blurb: 'Book and track intercity parcels',
    home: '/sender',
    accent: 'from-brand-500 to-brand-700',
  },
  {
    id: 'traveler',
    icon: Car,
    label: 'Driver',
    blurb: 'Carry parcels and passengers, earn on trips',
    home: '/traveler',
    accent: 'from-success-500 to-success-700',
  },
  {
    id: 'passenger',
    icon: Users,
    label: 'Passenger',
    blurb: 'Book a cost-shared intercity seat',
    home: '/passenger',
    accent: 'from-accent-500 to-accent-600',
  },
  {
    id: 'hub',
    icon: Building2,
    label: 'Hub manager',
    blurb: 'Intake, handoffs, inventory and settlement',
    home: '/hub',
    accent: 'from-warn-500 to-warn-700',
  },
]

/**
 * Always-visible portal switcher.
 *
 * One account spans four apps (PRD §3), but that was previously only reachable
 * three taps deep under Profile — so reviewers never found the driver or hub
 * portals at all. Surfacing it on every landing screen makes the multi-role
 * model legible instead of hidden.
 */
export function PortalSwitcher({ tone = 'onBrand' }: { tone?: 'onBrand' | 'light' }) {
  const navigate = useNavigate()
  const { role, setRole } = useApp()
  const [open, setOpen] = useState(false)

  const current = PORTALS.find((p) => p.id === role) ?? PORTALS[0]
  const Icon = current.icon

  const go = (p: (typeof PORTALS)[number]) => {
    setRole(p.id)
    setOpen(false)
    navigate(p.home)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Current portal: ${current.label}. Switch portal`}
        className={cn(
          'springy-sm focus-ring inline-flex items-center gap-2 rounded-full py-1.5 pr-2.5 pl-3 text-[12px] font-bold',
          tone === 'onBrand'
            ? 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md'
            : 'bg-ink-100 text-ink-700',
        )}
      >
        <Icon size={13} />
        {current.label}
        <ChevronsUpDown size={13} className="opacity-70" />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Switch portal"
        subtitle="One DikkiConnect account, four apps. Your data follows you."
      >
        <div className="flex flex-col gap-2.5">
          {PORTALS.map((p) => {
            const PIcon = p.icon
            const active = p.id === role
            return (
              <button
                key={p.id}
                onClick={() => go(p)}
                className={cn(
                  'springy flex items-center gap-3.5 rounded-(--radius-md) border-2 bg-white p-4 text-left',
                  active ? 'border-brand-600 bg-brand-50/50' : 'border-ink-200 hover:border-ink-300',
                )}
              >
                <span
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-gradient-to-br text-white',
                    p.accent,
                  )}
                >
                  <PIcon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-ink-900">{p.label}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-500">
                    {p.blurb}
                  </span>
                </span>
                {active && <Check size={18} className="shrink-0 text-brand-600" />}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => {
            setOpen(false)
            navigate('/admin')
          }}
          className="springy mt-3 flex w-full items-center gap-3.5 rounded-(--radius-md) border-2 border-dashed border-ink-300 p-4 text-left"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-900 text-white">
            <Building2 size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-bold text-ink-900">Admin console</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-ink-500">
              Desktop ops — users, KYC, payments, disputes
            </span>
          </span>
        </button>
      </Sheet>
    </>
  )
}

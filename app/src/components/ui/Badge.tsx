import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { ParcelStatus } from '@/lib/types'

type Tone = 'brand' | 'success' | 'warn' | 'danger' | 'neutral' | 'accent' | 'dark'

const TONES: Record<Tone, { chip: string; dot: string }> = {
  brand: { chip: 'bg-brand-50 text-brand-700 ring-brand-100', dot: 'bg-brand-600' },
  success: { chip: 'bg-success-50 text-success-700 ring-success-100', dot: 'bg-success-500' },
  warn: { chip: 'bg-warn-50 text-warn-700 ring-warn-100', dot: 'bg-warn-500' },
  danger: { chip: 'bg-danger-50 text-danger-700 ring-danger-100', dot: 'bg-danger-500' },
  neutral: { chip: 'bg-ink-100 text-ink-600 ring-ink-200', dot: 'bg-ink-400' },
  accent: { chip: 'bg-accent-50 text-accent-600 ring-accent-100', dot: 'bg-accent-500' },
  dark: { chip: 'bg-ink-900 text-white ring-ink-900', dot: 'bg-white' },
}

export function Badge({
  children,
  tone = 'neutral',
  dot,
  icon,
  className,
  size = 'md',
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  icon?: ReactNode
  className?: string
  size?: 'sm' | 'md'
}) {
  const t = TONES[tone]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold whitespace-nowrap ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11px]',
        t.chip,
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', t.dot)} />}
      {icon}
      {children}
    </span>
  )
}

/* ── Parcel status → label + tone, in one place ───────────────────────────── */

export const PARCEL_STATUS_META: Record<ParcelStatus, { label: string; tone: Tone; short: string }> =
  {
    booked: { label: 'Booked', tone: 'brand', short: 'Booked' },
    at_origin_hub: { label: 'At origin hub', tone: 'warn', short: 'At hub' },
    assigned: { label: 'Traveler assigned', tone: 'accent', short: 'Assigned' },
    in_transit: { label: 'In transit', tone: 'brand', short: 'In transit' },
    at_destination_hub: { label: 'Ready for pickup', tone: 'warn', short: 'Ready' },
    delivered: { label: 'Delivered', tone: 'success', short: 'Delivered' },
    cancelled: { label: 'Cancelled', tone: 'danger', short: 'Cancelled' },
  }

export function StatusBadge({
  status,
  short,
  size = 'md',
}: {
  status: ParcelStatus
  short?: boolean
  size?: 'sm' | 'md'
}) {
  const meta = PARCEL_STATUS_META[status]
  return (
    <Badge tone={meta.tone} dot size={size}>
      {short ? meta.short : meta.label}
    </Badge>
  )
}

/** Small live "pulse" marker for anything currently moving. */
export function LiveDot({ label = 'Live', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2 py-0.5 text-[10.5px] font-bold text-success-700 ring-1 ring-success-100 ring-inset',
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="anim-ping absolute inline-flex size-full rounded-full bg-success-500" />
        <span className="relative inline-flex size-1.5 rounded-full bg-success-500" />
      </span>
      {label}
    </span>
  )
}

/** Verified / KYC tier marker. */
export function VerifiedChip({
  tier,
  className,
}: {
  tier: 'parcel_only' | 'passenger_ready' | 'none'
  className?: string
}) {
  if (tier === 'none')
    return (
      <Badge tone="neutral" size="sm" className={className}>
        Unverified
      </Badge>
    )
  return (
    <Badge tone={tier === 'passenger_ready' ? 'success' : 'brand'} size="sm" className={className}>
      {tier === 'passenger_ready' ? 'Fully verified' : 'Parcel verified'}
    </Badge>
  )
}

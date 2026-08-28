import {
  ArrowRight,
  Building2,
  Clock,
  Fuel,
  Home,
  MapPin,
  Navigation,
  Package,
  ShieldCheck,
  Timer,
  Users,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar, Badge, Card, StatusBadge, Stars } from '@/components/ui'
import { MiniTimeline } from '@/components/viz/Timeline'
import { categoryById, cityName, travelerById } from '@/lib/data'
import { ageInHub, inr, kg, relative, shortDate, time } from '@/lib/format'
import type { Hub, Parcel, ParcelJob, Trip } from '@/lib/types'
import { CategoryIcon } from '@/components/domain/CategoryIcon'

/* ═══════════════════════════════════════════════════════════════════════════
   Domain cards — the repeated content units across the whole app.
   ═══════════════════════════════════════════════════════════════════════════ */

export function ParcelCard({
  parcel,
  to,
  onClick,
  showTimeline = true,
}: {
  parcel: Parcel
  to?: string
  onClick?: () => void
  showTimeline?: boolean
}) {
  const cat = categoryById(parcel.category)
  const traveler = travelerById(parcel.travelerId)
  const live = parcel.status === 'in_transit'

  return (
    <Card to={to} onClick={onClick} className="overflow-hidden">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-ink-700">
          <CategoryIcon id={cat.id} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="tabular truncate text-[14.5px] font-extrabold text-ink-900">{parcel.id}</p>
            {parcel.fragile && (
              <Badge tone="warn" size="sm">
                Fragile
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
            {cityName(parcel.fromCityId)} → {cityName(parcel.toCityId)} · {kg(parcel.weightKg)}
          </p>
        </div>
        <StatusBadge status={parcel.status} short size="sm" />
      </div>

      {showTimeline && parcel.status !== 'cancelled' && (
        <MiniTimeline events={parcel.timeline} className="mb-3" />
      )}

      <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {traveler ? (
            <>
              <Avatar name={traveler.name} size={22} tone={traveler.avatarTone} />
              <span className="truncate text-[12px] font-semibold text-ink-600">
                {traveler.name}
              </span>
            </>
          ) : (
            <>
              <Clock size={13} className="shrink-0 text-ink-400" />
              <span className="truncate text-[12px] text-ink-500">
                {parcel.status === 'delivered'
                  ? `Delivered ${shortDate(parcel.etaAt)}`
                  : parcel.status === 'cancelled'
                    ? 'Refund processed'
                    : `Finding a traveler`}
              </span>
            </>
          )}
        </div>
        <span className="tabular shrink-0 text-[13px] font-bold text-ink-900">
          {live ? `ETA ${time(parcel.etaAt)}` : inr(parcel.price)}
        </span>
      </div>
    </Card>
  )
}

export function TripCard({
  trip,
  to,
  onClick,
  showSeats = true,
  compact,
}: {
  trip: Trip
  to?: string
  onClick?: () => void
  showSeats?: boolean
  compact?: boolean
}) {
  const traveler = travelerById(trip.travelerId)
  const soldOut = trip.seatsLeft === 0

  return (
    <Card to={to} onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="tabular text-display text-[19px] font-extrabold text-ink-900">
              {time(trip.departAt)}
            </span>
            <ArrowRight size={13} className="text-ink-300" />
            <span className="tabular text-[15px] font-bold text-ink-600">{time(trip.arriveAt)}</span>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
            {cityName(trip.fromCityId)} → {cityName(trip.toCityId)} ·{' '}
            {Math.round(
              (new Date(trip.arriveAt).getTime() - new Date(trip.departAt).getTime()) / 3_600_000,
            )}
            h drive
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-display text-[19px] font-extrabold text-brand-700">
            {inr(trip.farePerSeat)}
          </p>
          <p className="text-[10.5px] font-semibold text-ink-400">per seat</p>
        </div>
      </div>

      {!compact && traveler && (
        <div className="mt-3.5 flex items-center gap-2.5 border-t border-ink-100 pt-3.5">
          <Avatar name={traveler.name} size={34} tone={traveler.avatarTone} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-ink-900">{traveler.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-500">
              <Stars value={traveler.rating} size={10} />
              <span className="font-semibold text-ink-700">{traveler.rating.toFixed(1)}</span>
              <span className="text-ink-300">·</span>
              <span className="truncate">{traveler.vehicle.model}</span>
            </div>
          </div>
          {showSeats && (
            <Badge tone={soldOut ? 'neutral' : trip.seatsLeft <= 1 ? 'warn' : 'success'} size="sm">
              {soldOut ? 'Full' : `${trip.seatsLeft} seat${trip.seatsLeft > 1 ? 's' : ''}`}
            </Badge>
          )}
        </div>
      )}

      {!compact && trip.viaStops.length > 0 && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-400">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">via {trip.viaStops.join(' · ')}</span>
        </p>
      )}
    </Card>
  )
}

/** A parcel job offered to a traveler — payout-forward, with an expiry clock. */
export function JobCard({
  job,
  onAccept,
  onView,
  accepting,
}: {
  job: ParcelJob
  onAccept?: () => void
  onView?: () => void
  accepting?: boolean
}) {
  const cat = categoryById(job.category)
  const urgent = new Date(job.expiresAt).getTime() - Date.now() < 20 * 60_000

  return (
    <Card padded={false} className="overflow-hidden">
      <button onClick={onView} className="w-full px-4 pt-4 text-left">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-ink-700">
            <CategoryIcon id={cat.id} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[14px] font-bold text-ink-900">{cat.label}</p>
              <Badge tone="neutral" size="sm">
                {job.size} · {kg(job.weightKg)}
              </Badge>
              {job.fragile && (
                <Badge tone="warn" size="sm">
                  Fragile
                </Badge>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-500">
              {job.mode === 'p2p' ? (
                <Home size={12} className="shrink-0 text-brand-600" />
              ) : (
                <Building2 size={12} className="shrink-0 text-ink-400" />
              )}
              <span className="truncate">
                {job.fromLabel} → {job.toLabel}
              </span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tabular text-display text-[20px] font-extrabold text-success-600">
              +{inr(job.payout)}
            </p>
            <p className="text-[10.5px] font-semibold text-ink-400">payout</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] font-semibold text-ink-500">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold',
              job.mode === 'p2p'
                ? 'bg-brand-50 text-brand-700'
                : 'bg-ink-100 text-ink-600',
            )}
          >
            {job.mode === 'p2p' ? 'Door to door' : 'Hub to hub'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Fuel size={12} className="text-ink-400" />
            {job.detourKm} km detour
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5',
              urgent ? 'text-danger-600' : 'text-ink-500',
            )}
          >
            <Timer size={12} />
            Expires {relative(job.expiresAt)}
          </span>
        </div>
      </button>

      <div className="mt-3.5 flex gap-2 border-t border-ink-100 p-3">
        <button
          onClick={onView}
          className="pressable h-10 flex-1 rounded-(--radius-sm) bg-ink-100 text-[13px] font-semibold text-ink-700"
        >
          Details
        </button>
        <button
          onClick={onAccept}
          disabled={accepting}
          className="pressable h-10 flex-[1.4] rounded-(--radius-sm) bg-action text-[13px] font-bold text-white hover:bg-action-hover disabled:opacity-60"
        >
          {accepting ? 'Accepting…' : 'Accept job'}
        </button>
      </div>
    </Card>
  )
}

/** Hub picker row — distance, hours, load. */
export function HubCard({
  hub,
  selected,
  onSelect,
  showLoad,
  km,
  minutes,
  road,
  nearest,
}: {
  hub: Hub
  selected?: boolean
  onSelect?: () => void
  showLoad?: boolean
  /** Measured distance from the user. Falls back to distance from city centre. */
  km?: number
  /** Drive time, when the router has answered. */
  minutes?: number | null
  /** True when `km` is a road distance rather than a straight line. */
  road?: boolean
  /** Marks the closest hub in the list. */
  nearest?: boolean
}) {
  const loadPct = Math.round((hub.held / hub.capacity) * 100)
  const busy = loadPct > 70
  const shownKm = km ?? hub.distanceKm

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'pressable focus-ring w-full rounded-(--radius-lg) border-2 bg-white p-4 text-left transition-all duration-200',
        selected
          ? 'border-brand-600 bg-brand-50/50 shadow-(--shadow-brand-sm)'
          : 'border-ink-200 hover:border-ink-300',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-(--radius-sm)',
            selected ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600',
          )}
        >
          <Package size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14px] font-bold text-ink-900">
              {hub.name.split('·').pop()?.trim()}
            </p>
            {nearest && (
              <Badge tone="brand" size="sm">
                Nearest
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-ink-500">{hub.address}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-ink-400">{hub.landmark}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-[13.5px] font-extrabold text-ink-900">{shownKm} km</p>
          {minutes != null ? (
            <p className="tabular mt-0.5 text-[11px] font-bold text-brand-600">{minutes} min</p>
          ) : (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-warn-600">
              ★ {hub.rating}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-ink-100 pt-3 text-[11.5px]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink-600">
          <Clock size={11.5} className="text-ink-400" />
          {hub.openFrom} – {hub.openTo}
        </span>
        {road && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink-500">
            <Navigation size={11} className="text-ink-400" />
            By road
          </span>
        )}
        {showLoad && (
          <Badge tone={busy ? 'warn' : 'success'} size="sm" dot>
            {busy ? 'Busy' : 'Free'} · {loadPct}%
          </Badge>
        )}
        {!showLoad && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-success-600">
            <ShieldCheck size={11.5} />
            Verified partner
          </span>
        )}
      </div>
    </button>
  )
}

/** Hub inventory row with time-in-hub aging (PRD §8.2 flags anything >24h). */
export function InventoryRow({
  parcelId,
  shelf,
  intakeAt,
  state,
  onClick,
}: {
  parcelId: string
  shelf: string
  intakeAt: string
  state: 'waiting' | 'assigned' | 'delayed' | 'lost'
  onClick?: () => void
}) {
  const tone = { waiting: 'brand', assigned: 'accent', delayed: 'warn', lost: 'danger' } as const
  const label = { waiting: 'Waiting', assigned: 'Assigned', delayed: 'Delayed', lost: 'Lost' }

  return (
    <button
      onClick={onClick}
      className="pressable flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink-50"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-[11px] font-extrabold text-ink-600">
        {shelf}
      </span>
      <div className="min-w-0 flex-1">
        <p className="tabular truncate text-[14px] font-bold text-ink-900">{parcelId}</p>
        <p className="mt-0.5 text-[11.5px] text-ink-500">In hub {ageInHub(intakeAt)}</p>
      </div>
      <Badge tone={tone[state]} size="sm" dot>
        {label[state]}
      </Badge>
    </button>
  )
}

/** Promotional strip — Airbnb-style tonal banner, not a loud ad. */
export function PromoBanner({
  title,
  body,
  code,
  icon,
  onClick,
}: {
  title: string
  body: string
  code?: string
  icon?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="pressable relative flex w-full items-center gap-4 overflow-hidden rounded-(--radius-lg) bg-brand-600 p-4 text-left text-white"
    >
      <span className="relative grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-white/15">
        {icon ?? <Zap size={20} />}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-[14px] font-bold">{title}</span>
        <span className="mt-0.5 block truncate text-[12px] text-white/75">{body}</span>
      </span>
      {code && (
        <span className="relative shrink-0 rounded-md border border-dashed border-white/45 px-2.5 py-1 text-[11px] font-extrabold tracking-wider">
          {code}
        </span>
      )}
    </button>
  )
}

/** Seat / capacity meter used on trip creation and traveler dashboards. */
export function CapacityMeter({
  label,
  used,
  total,
  icon,
  tone = 'brand',
}: {
  label: string
  used: number
  total: number
  icon?: React.ReactNode
  tone?: 'brand' | 'success'
}) {
  return (
    <div className="rounded-(--radius-md) border border-ink-100 bg-white p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            'grid size-7 place-items-center rounded-(--radius-xs)',
            tone === 'brand' ? 'bg-brand-50 text-brand-600' : 'bg-success-50 text-success-600',
          )}
        >
          {icon ?? <Users size={14} />}
        </span>
        <span className="text-[12px] font-semibold text-ink-600">{label}</span>
        <span className="tabular ml-auto text-[13px] font-extrabold text-ink-900">
          {used}/{total}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i < used ? (tone === 'brand' ? 'bg-brand-600' : 'bg-success-500') : 'bg-ink-200',
            )}
          />
        ))}
      </div>
    </div>
  )
}

import { Navigate, useParams } from 'react-router-dom'
import {
  Armchair,
  Car,
  Cigarette,
  Languages,
  Luggage,
  MessageCircle,
  Music,
  PawPrint,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  Note,
  Stars,
  VerifiedChip,
} from '@/components/ui'
import { RouteMap } from '@/components/viz/Map'
import { cityName, travelerById } from '@/lib/data'
import { useTrip } from '@/lib/store'
import { dayDate, inr, time } from '@/lib/format'

const PREFERENCES = [
  { icon: Music, label: 'Music welcome', ok: true },
  { icon: Cigarette, label: 'No smoking', ok: false },
  { icon: PawPrint, label: 'Pets on request', ok: true },
  { icon: Luggage, label: '1 cabin bag each', ok: true },
]

const REVIEWS = [
  {
    name: 'Rhea Menon',
    rating: 5,
    text: 'Left exactly on time and drove really calmly on the highway. Would book again.',
    when: '2 weeks ago',
  },
  {
    name: 'Vikram S.',
    rating: 5,
    text: 'Clean car, good AC, and he waited when my meeting ran late. Very considerate.',
    when: 'Last month',
  },
]

export default function RideDetail() {
  const { id } = useParams()
  const trip = useTrip(id)
  if (!trip) return <Navigate to="/passenger" replace />

  const driver = travelerById(trip.travelerId)!
  const durationH = (
    (new Date(trip.arriveAt).getTime() - new Date(trip.departAt).getTime()) /
    3_600_000
  ).toFixed(1)

  return (
    <Screen>
      <div className="relative shrink-0">
        <RouteMap
          height={190}
          fromLabel={cityName(trip.fromCityId)}
          toLabel={cityName(trip.toCityId)}
        />
        <TopBar floating tone="dark" back className="pt-safe" />
      </div>

      <ScreenBody className="-mt-6 pt-0">
        {/* Timing */}
        <Card elevation={3}>
          <p className="text-[11.5px] font-bold tracking-wide text-ink-400 uppercase">
            {dayDate(trip.departAt)}
          </p>
          <div className="mt-3 flex gap-3.5">
            <span className="mt-1.5 flex flex-col items-center gap-1">
              <span className="size-2.5 rounded-full bg-brand-600 ring-4 ring-brand-600/15" />
              <span className="h-10 w-px border-l-2 border-dashed border-ink-200" />
              <span className="size-2.5 rounded-full bg-success-500 ring-4 ring-success-500/15" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-3.5">
                <p className="tabular text-display text-[19px] leading-none font-extrabold text-ink-900">
                  {time(trip.departAt)}
                </p>
                <p className="mt-1 truncate text-[13px] font-semibold text-ink-700">
                  {cityName(trip.fromCityId)}
                </p>
                <p className="truncate text-[11.5px] text-ink-500">
                  Pickup point shared after booking
                </p>
              </div>
              <div>
                <p className="tabular text-display text-[19px] leading-none font-extrabold text-ink-900">
                  {time(trip.arriveAt)}
                </p>
                <p className="mt-1 truncate text-[13px] font-semibold text-ink-700">
                  {cityName(trip.toCityId)}
                </p>
                <p className="truncate text-[11.5px] text-ink-500">
                  Drop near {trip.viaStops.at(-1) ?? 'city centre'}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular text-display text-[24px] leading-none font-extrabold text-brand-700">
                {inr(trip.farePerSeat)}
              </p>
              <p className="mt-1 text-[10.5px] font-bold text-ink-400">per seat</p>
              <Badge
                tone={trip.seatsLeft <= 1 ? 'warn' : 'success'}
                size="sm"
                className="mt-2"
              >
                {trip.seatsLeft} left
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-ink-100 pt-3.5 text-[11.5px] font-semibold text-ink-500">
            <span>{durationH}h journey</span>
            <span className="text-ink-300">·</span>
            <span>via {trip.viaStops.join(' · ')}</span>
          </div>
        </Card>

        {/* Driver */}
        <Card className="mt-3">
          <div className="flex items-center gap-3.5">
            <Avatar name={driver.name} size={52} tone={driver.avatarTone} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold text-ink-900">{driver.name}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                <Stars value={driver.rating} size={12} />
                <span className="font-bold text-ink-800">{driver.rating.toFixed(1)}</span>
                <span className="text-ink-300">·</span>
                <span>{driver.trips} trips</span>
              </div>
              <VerifiedChip tier={driver.kycTier} className="mt-2" />
            </div>
            <IconButton icon={<MessageCircle size={17} />} label="Message driver" />
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-(--radius-md) bg-ink-50 p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-white text-ink-700 shadow-(--shadow-e1)">
              <Car size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold text-ink-900">
                {driver.vehicle.model}
              </p>
              <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
                {driver.vehicle.colour} · {driver.vehicle.plate}
              </p>
            </div>
            <span className="shrink-0 text-[11.5px] font-semibold text-ink-500">
              {driver.vehicle.seats} seats
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-500">
            <Languages size={13} className="shrink-0 text-ink-400" />
            Speaks {driver.languages.join(', ')}
          </div>
        </Card>

        {/* Preferences */}
        <Card className="mt-3">
          <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            Ride preferences
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {PREFERENCES.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.label} className="flex items-center gap-2.5">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-(--radius-xs) ${
                      p.ok ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  <span className="truncate text-[12px] font-medium text-ink-600">{p.label}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Seats */}
        <Card className="mt-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              Seat availability
            </p>
            <span className="text-[11.5px] font-semibold text-ink-500">
              {trip.seatsTotal - trip.seatsLeft} booked
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: trip.seatsTotal }).map((_, i) => {
              const taken = i < trip.seatsTotal - trip.seatsLeft
              return (
                <div
                  key={i}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-(--radius-sm) py-3 ${
                    taken ? 'bg-ink-100 text-ink-400' : 'bg-brand-50 text-brand-600'
                  }`}
                >
                  <Armchair size={18} />
                  <span className="text-[10px] font-bold">{taken ? 'Taken' : 'Free'}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Reviews */}
        <Card className="mt-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              Recent reviews
            </p>
            <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-ink-800">
              <Star size={12} className="fill-warn-500 text-warn-500" />
              {driver.rating.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col gap-3.5">
            {REVIEWS.map((r) => (
              <div key={r.name} className="border-b border-ink-100 pb-3.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.name} size={28} />
                  <p className="flex-1 truncate text-[13px] font-bold text-ink-900">{r.name}</p>
                  <span className="shrink-0 text-[11px] text-ink-400">{r.when}</span>
                </div>
                <Stars value={r.rating} size={11} className="mt-1.5" />
                <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink-600">{r.text}</p>
              </div>
            ))}
          </div>
        </Card>

        <Note tone="neutral" icon={<ShieldCheck size={15} />} className="mt-3" title="Safety">
          Live trip sharing with an emergency contact is on by default, and an SOS button is one tap
          away for the whole ride.
        </Note>
      </ScreenBody>

      <ActionBar
        helper={
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-semibold text-ink-500">Cost share per seat</span>
            <span className="tabular text-display text-[22px] font-extrabold text-ink-900">
              {inr(trip.farePerSeat)}
            </span>
          </div>
        }
      >
        <Button block size="lg" to={`/passenger/checkout/${trip.id}`}>
          Request this seat
        </Button>
      </ActionBar>
    </Screen>
  )
}

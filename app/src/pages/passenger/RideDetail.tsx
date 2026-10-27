import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Armchair,
  Car,
  Cigarette,
  Suitcase,
  ChatCircle,
  MusicNotes,
  PawPrint,
  ShieldCheck,
} from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { ActionBar, Avatar, Badge, Button, Card, IconButton, Note } from '@/components/ui'
import { RouteMap } from '@/components/viz/Map'
import { cityName } from '@/lib/data'
import { useTrip } from '@/lib/store'
import { dayDate, inr, relative, time } from '@/lib/format'
import { leavingSoon, seatsScarce } from '@/lib/scarcity'

const PREFERENCES = [
  { icon: MusicNotes, label: 'Music welcome', ok: true },
  { icon: Cigarette, label: 'No smoking', ok: false },
  { icon: PawPrint, label: 'Pets on request', ok: true },
  { icon: Suitcase, label: '1 cabin bag each', ok: true },
]

export default function RideDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const trip = useTrip(id)
  if (trip === null) return <Navigate to="/passenger" replace />
  if (!trip) return null

  const durationH = (
    (new Date(trip.arriveAt).getTime() - new Date(trip.departAt).getTime()) /
    3_600_000
  ).toFixed(1)

  /* Two things on this screen can actually run out: the seats, and the time
     left to decide. Everything else here is stable, so those two — and only
     those two — get the signal yellow. A 90-minute window is the point past
     which "it leaves later today" stops being useful and becomes a deadline. */
  const soon = leavingSoon(trip.departAt)
  const scarce = seatsScarce(trip.seatsLeft)

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
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11.5px] font-bold tracking-wide text-ink-400 uppercase">
              {dayDate(trip.departAt)}
            </p>
            {soon && (
              <Badge tone="signal" size="sm">
                Leaves {relative(trip.departAt)}
              </Badge>
            )}
          </div>
          <div className="mt-3 flex gap-3.5">
            <span className="mt-1.5 flex flex-col items-center gap-1">
              <span className="size-2.5 rounded-full bg-brand-600 ring-4 ring-brand-600/15" />
              <span className="h-10 w-px border-l-2 border-dashed border-ink-200" />
              <span className="size-2.5 rounded-full bg-success-500 ring-4 ring-success-500/15" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-3.5">
                <p className="tabular text-display text-[19px] leading-none font-extrabold tracking-title text-ink-900">
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
                <p className="tabular text-display text-[19px] leading-none font-extrabold tracking-title text-ink-900">
                  {time(trip.arriveAt)}
                </p>
                <p className="mt-1 truncate text-[13px] font-semibold text-ink-700">
                  {cityName(trip.toCityId)}
                </p>
                <p className="truncate text-[11.5px] text-ink-500">
                  {trip.viaStops.length ? `Drop near ${trip.viaStops.at(-1)}` : 'Drop point shared after booking'}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular text-display text-[26px] leading-none font-extrabold tracking-title text-brand-700">
                {inr(trip.farePerSeat)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-ink-500">per seat</p>
              <Badge tone={scarce ? 'signal' : 'success'} size="sm" className="mt-2">
                {trip.seatsLeft} left
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 border-t border-ink-100 pt-3.5 text-[11.5px] font-semibold text-ink-500">
            <span>
              <span className="tabular font-extrabold text-ink-700">{durationH}h</span> journey
            </span>
            {trip.viaStops.length > 0 && (
              <>
                <span className="text-ink-300">·</span>
                <span>via {trip.viaStops.join(' · ')}</span>
              </>
            )}
          </div>
        </Card>

        {/* Driver */}
        <Card className="mt-3">
          <div className="flex items-center gap-3.5">
            <Avatar name={trip.travelerName} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold text-ink-900">{trip.travelerName}</p>
            </div>
            <IconButton
              icon={<ChatCircle size={17} />}
              label="Message driver"
              onClick={() => navigate(`/passenger/messages/${trip.id}`)}
            />
          </div>

          {trip.vehicle && (
            <div className="mt-4 flex items-center gap-3 rounded-(--radius-md) bg-ink-50 p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-white text-ink-700 shadow-(--shadow-e1)">
                <Car size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-ink-900">{trip.vehicle.model}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
                  {trip.vehicle.colour} · {trip.vehicle.plate}
                </p>
              </div>
              <span className="shrink-0 text-[11.5px] font-semibold text-ink-500">
                <span className="tabular font-extrabold text-ink-700">{trip.vehicle.seats}</span>{' '}
                seats
              </span>
            </div>
          )}
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
              <span className="tabular font-extrabold text-ink-700">
                {trip.seatsTotal - trip.seatsLeft}
              </span>{' '}
              booked
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: trip.seatsTotal }).map((_, i) => {
              const taken = i < trip.seatsTotal - trip.seatsLeft
              return (
                <div
                  key={i}
                  className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1.5 rounded-(--radius-md) py-3 ${
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

        <Note tone="neutral" icon={<ShieldCheck size={15} />} className="mt-3" title="Safety">
          Live trip sharing with an emergency contact is on by default, and an SOS button is one tap
          away for the whole ride.
        </Note>
      </ScreenBody>

      <ActionBar
        helper={
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11.5px] font-semibold text-ink-500">Cost share per seat</span>
            <span className="tabular text-display text-[22px] font-extrabold tracking-title text-ink-900">
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

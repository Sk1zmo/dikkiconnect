import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CaretRight, MagnifyingGlass, Star } from '@phosphor-icons/react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Segmented,
  SkeletonList,
} from '@/components/ui'
import { cityName } from '@/lib/data'
import { dayDate, inr, relative, time } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'
import { useMyRides } from '@/lib/store'
import { rides as ridesApi } from '@/lib/api'
import { LEAVING_SOON_MINS_LIST, leavingSoon } from '@/lib/scarcity'

type Tab = 'upcoming' | 'past'

export default function PassengerBookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('upcoming')
  // Fetched on demand per booking, never held longer than it takes to show
  // it — the server is asked again each time this is opened.
  const [codes, setCodes] = useState<Record<string, string>>({})
  const revealCode = (bookingId: string) => {
    void ridesApi.otp(bookingId).then(({ code }) => setCodes((c) => ({ ...c, [bookingId]: code })))
  }

  // Every row here is a seat this passenger actually paid for — the list is
  // empty until they book one, and it survives a reload.
  const rides = useMyRides()
  const { loading } = useLoaded(rides.upcoming, 900)

  const list = tab === 'upcoming' ? rides.upcoming : rides.past

  return (
    <Screen>
      <LargeTitle
        title="My rides"
        subtitle={`${rides.upcoming.length} upcoming · ${rides.past.length} completed`}
        className="pt-safe"
        action={
          <IconButton
            icon={<MagnifyingGlass size={17} />}
            label="Find a ride"
            onClick={() => navigate('/passenger')}
          />
        }
      />

      <div className="shrink-0 px-5 pb-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: 'Upcoming', badge: rides.upcoming.length },
            { value: 'past', label: 'Past' },
          ]}
        />
      </div>

      <ScreenBody>
        {loading ? (
          <SkeletonList count={3} />
        ) : list.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              kind={tab === 'upcoming' ? 'rides' : 'rides-done'}
              title={tab === 'upcoming' ? 'No seat booked yet' : 'No trips taken yet'}
              body={
                tab === 'upcoming'
                  ? 'Search a route and grab a seat in a car already heading that way.'
                  : 'Rides you complete will appear here with receipts and ratings.'
              }
              actionLabel={tab === 'upcoming' ? 'Find a ride' : undefined}
              actionTo="/passenger"
            />
          </Card>
        ) : (
          <div className="stagger flex flex-col gap-3">
            {list.map(({ ride, trip: t }) => {
              const upcoming = tab === 'upcoming'
              /* The one thing on this list that genuinely runs out: a seat you
                 have already paid for stops being useful the moment the car
                 leaves without you. Three hours is roughly when "later today"
                 turns into "start moving", so that is where the yellow starts. */
              const soon =
                upcoming &&
                ride.status !== 'cancelled' &&
                leavingSoon(t.departAt, LEAVING_SOON_MINS_LIST)
              return (
                <Card key={ride.id} padded={false} className="overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-4 py-2.5">
                    <Calendar size={13} className="shrink-0 text-ink-400" />
                    <span className="text-[11.5px] font-bold text-ink-600">
                      {dayDate(t.departAt)}
                    </span>
                    {soon && (
                      <Badge tone="signal" size="sm">
                        Leaves {relative(t.departAt)}
                      </Badge>
                    )}
                    <Badge
                      tone={
                        ride.status === 'cancelled'
                          ? 'neutral'
                          : upcoming
                            ? 'brand'
                            : 'success'
                      }
                      size="sm"
                      dot
                      className="ml-auto"
                    >
                      {ride.status === 'cancelled'
                        ? 'Cancelled'
                        : upcoming
                          ? `Confirmed · ${ride.seats} seat${ride.seats > 1 ? 's' : ''}`
                          : 'Completed'}
                    </Badge>
                  </div>

                  <button
                    onClick={() =>
                      navigate(upcoming ? `/passenger/tracking/${t.id}` : `/passenger/ride/${t.id}`)
                    }
                    className="pressable w-full px-4 py-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="tabular text-display text-[19px] font-extrabold tracking-title text-ink-900">
                            {time(t.departAt)}
                          </span>
                          <span className="text-[12px] text-ink-400">→</span>
                          <span className="tabular text-[15px] font-bold text-ink-600">
                            {time(t.arriveAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                          {cityName(t.fromCityId)} → {cityName(t.toCityId)}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-[17px] font-extrabold tracking-title text-ink-900">
                        {inr(ride.fare)}
                      </p>
                    </div>

                    <div className="mt-3.5 flex items-center gap-2.5 border-t border-ink-100 pt-3.5">
                      <Avatar name={t.travelerName} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-ink-900">{t.travelerName}</p>
                        {t.vehicle && (
                          <p className="tabular mt-0.5 truncate text-[11.5px] text-ink-500">
                            {t.vehicle.plate}
                          </p>
                        )}
                      </div>
                      <CaretRight size={16} className="shrink-0 text-ink-300" />
                    </div>
                  </button>

                  {upcoming ? (
                    <button
                      onClick={() => !codes[ride.id] && revealCode(ride.id)}
                      className="flex min-h-12 w-full items-center gap-3 border-t border-ink-100 bg-brand-50/50 px-4 py-3 text-left"
                    >
                      <span className="text-[11.5px] font-semibold text-brand-700/70">
                        Boarding OTP
                      </span>
                      <span className="tabular ml-auto text-[16px] font-extrabold tracking-[0.15em] text-brand-700">
                        {codes[ride.id] ?? 'Tap to show'}
                      </span>
                    </button>
                  ) : (
                    <div className="border-t border-ink-100 p-3">
                      <Button
                        variant="outline"
                        block
                        icon={<Star size={16} />}
                        onClick={() => navigate(`/passenger/complete/${t.id}`)}
                      >
                        Rate this ride
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </ScreenBody>
    </Screen>
  )
}

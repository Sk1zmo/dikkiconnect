import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Search, Star } from 'lucide-react'
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
  Stars,
} from '@/components/ui'
import { EmptyRoadArt } from '@/components/viz/Illustrations'
import { TRIPS, cityName, otpFor, travelerById } from '@/lib/data'
import { dayDate, inr, time } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'

type Tab = 'upcoming' | 'past'

const UPCOMING = TRIPS.slice(0, 2)
const PAST = TRIPS.slice(2, 4)

export default function PassengerBookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('upcoming')
  const { loading } = useLoaded(TRIPS, 950)

  const list = tab === 'upcoming' ? UPCOMING : PAST

  return (
    <Screen>
      <LargeTitle
        title="My rides"
        subtitle={`${UPCOMING.length} upcoming · ${PAST.length} completed`}
        className="pt-safe"
        action={
          <IconButton
            icon={<Search size={17} />}
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
            { value: 'upcoming', label: 'Upcoming', badge: UPCOMING.length },
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
              art={<EmptyRoadArt />}
              title={tab === 'upcoming' ? 'No rides booked' : 'No past rides'}
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
            {list.map((t) => {
              const driver = travelerById(t.travelerId)!
              const upcoming = tab === 'upcoming'
              return (
                <Card key={t.id} padded={false} className="overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-4 py-2.5">
                    <Calendar size={13} className="shrink-0 text-ink-400" />
                    <span className="text-[11.5px] font-bold text-ink-600">
                      {dayDate(t.departAt)}
                    </span>
                    <Badge tone={upcoming ? 'brand' : 'success'} size="sm" dot className="ml-auto">
                      {upcoming ? 'Confirmed' : 'Completed'}
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
                          <span className="tabular text-display text-[19px] font-extrabold text-ink-900">
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
                      <p className="tabular shrink-0 text-[15px] font-extrabold text-ink-900">
                        {inr(Math.round(t.farePerSeat * 1.06))}
                      </p>
                    </div>

                    <div className="mt-3.5 flex items-center gap-2.5 border-t border-ink-100 pt-3.5">
                      <Avatar name={driver.name} size={32} tone={driver.avatarTone} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-ink-900">{driver.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-500">
                          <Stars value={driver.rating} size={10} />
                          <span className="tabular truncate">{driver.vehicle.plate}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-ink-300" />
                    </div>
                  </button>

                  {upcoming ? (
                    <div className="flex items-center gap-3 border-t border-ink-100 bg-brand-50/50 px-4 py-3">
                      <span className="text-[11.5px] font-bold text-brand-700/70">Boarding OTP</span>
                      <span className="tabular ml-auto text-[16px] font-extrabold tracking-[0.15em] text-brand-700">
                        {otpFor(t.id + 'board')}
                      </span>
                    </div>
                  ) : (
                    <div className="border-t border-ink-100 p-3">
                      <Button
                        variant="outline"
                        block
                        size="sm"
                        icon={<Star size={14} />}
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

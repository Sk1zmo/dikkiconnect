import { useNavigate } from 'react-router-dom'
import { Headphones } from '@phosphor-icons/react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import { Avatar, Card, EmptyState } from '@/components/ui'
import { SUPPORT_THREAD, cityName } from '@/lib/data'
import { useMyRides } from '@/lib/store'
import { relative, time } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * One thread per trip this account is on, driver or passenger, plus the one
 * fixture thread that is honestly a fixture: WayPool Support, not a stand-in
 * for a real person. No fake "last message" preview — showing one would mean
 * either inventing text or fetching every thread's history just to render a
 * list, and the route and departure already say enough to pick the right one.
 */
export default function Messages() {
  const navigate = useNavigate()
  const { upcoming, past } = useMyRides()
  const threads = [...upcoming, ...past]

  return (
    <Screen>
      <LargeTitle title="Messages" subtitle="Drivers and WayPool support" className="pt-safe" />

      <ScreenBody>
        <Card padded={false} className="overflow-hidden">
          <button
            onClick={() => navigate('/passenger/messages/support')}
            className="pressable flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink-50"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
              <Headphones size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p className="truncate text-[14.5px] font-bold text-ink-900">WayPool Support</p>
                <span className="tabular ml-auto shrink-0 text-[11px] font-semibold text-ink-500">
                  {relative(SUPPORT_THREAD.at(-1)!.at)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                {SUPPORT_THREAD.at(-1)!.text}
              </p>
            </div>
          </button>
        </Card>

        <div className="mt-5">
          {threads.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                kind="messages"
                title="No ride conversations yet"
                body="Once you book a ride you can message the driver here."
                actionLabel="Find a ride"
                actionTo="/passenger"
              />
            </Card>
          ) : (
            <Card padded={false} className="overflow-hidden">
              {threads.map(({ ride, trip }, i) => (
                <button
                  key={ride.id}
                  onClick={() => navigate(`/passenger/messages/${trip.id}`)}
                  className={cn(
                    'pressable flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink-50',
                    i > 0 && 'border-t border-ink-100',
                  )}
                >
                  <Avatar name={trip.travelerName} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-[14.5px] font-bold text-ink-900">
                        {trip.travelerName}
                      </p>
                      <span className="tabular ml-auto shrink-0 text-[11px] font-semibold text-ink-500">
                        {time(trip.departAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                      {cityName(trip.fromCityId)} → {cityName(trip.toCityId)}
                    </p>
                  </div>
                </button>
              ))}
            </Card>
          )}
        </div>
      </ScreenBody>
    </Screen>
  )
}

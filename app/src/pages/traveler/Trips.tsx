import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, Navigation, Package, Plus, Users, X } from 'lucide-react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  Badge,
  Card,
  EmptyState,
  IconButton,
  Note,
  Segmented,
  SkeletonList,
  Stat,
  useToast,
} from '@/components/ui'
import { CapacityMeter, TripCard } from '@/components/domain/Cards'
import { EmptyRoadArt } from '@/components/viz/Illustrations'
import { compactInr, dayDate, inr, relative } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'
import { useApp, useMe, useMyTrips, useTrips } from '@/lib/store'


type Tab = 'upcoming' | 'past'

export default function TravelerTrips() {
  const ME = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')

  const allTrips = useTrips()
  const mine = useMyTrips(ME.id)
  const { startTrip, cancelTrip } = useApp()
  const { loading } = useLoaded(allTrips, 950)

  // Rides published ahead of time sit in "scheduled" until the driver starts
  // them, so a ride posted three days early is a first-class thing here.
  const upcoming = useMemo(
    () => [...mine.running, ...mine.scheduled],
    [mine.running, mine.scheduled],
  )
  const past = useMemo(
    () => (mine.completed.length ? mine.completed : allTrips.filter((t) => t.travelerId !== ME.id).slice(0, 2)),
    [mine.completed, allTrips],
  )
  const list = tab === 'upcoming' ? upcoming : past

  const start = (id: string) => {
    startTrip(id)
    toast.success('Trip started', 'Navigation is live and passengers have been notified.')
    navigate('/traveler/navigate')
  }

  return (
    <Screen>
      <LargeTitle
        title="Trips"
        subtitle={`${mine.scheduled.length} scheduled · ${mine.running.length} running · ${ME.trips} completed`}
        className="pt-safe"
        action={
          <IconButton
            icon={<Plus size={18} />}
            label="Publish a trip"
            tone="solid"
            onClick={() => navigate('/traveler/trips/new')}
          />
        }
      />

      <div className="shrink-0 px-5 pb-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: 'Scheduled & running', badge: upcoming.length },
            { value: 'past', label: 'Past' },
          ]}
        />
      </div>

      <ScreenBody>
        {tab === 'upcoming' && !loading && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2.5">
              <Stat label="This week" value={compactInr(4820)} tone="success" />
              <Stat label="Seats sold" value="7" tone="accent" />
              <Stat label="Parcels" value="14" tone="brand" />
            </div>
            {mine.scheduled.length > 0 && (
              <Note tone="brand" icon={<CalendarClock size={15} />} className="mb-4" title="Posted in advance">
                {mine.scheduled.length} ride{mine.scheduled.length === 1 ? ' is' : 's are'} live for
                passengers and parcel matching. Start one when you actually set off.
              </Note>
            )}
          </>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : list.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              art={<EmptyRoadArt />}
              title={tab === 'upcoming' ? 'No rides posted yet' : 'No past trips yet'}
              body={
                tab === 'upcoming'
                  ? 'Post a drive up to weeks ahead. It goes live straight away so seats and parcels fill before you leave.'
                  : 'Completed trips and their earnings will show up here.'
              }
              actionLabel={tab === 'upcoming' ? 'Post a ride in advance' : undefined}
              actionTo="/traveler/trips/new"
            />
          </Card>
        ) : (
          <div className="stagger flex flex-col gap-3">
            {list.map((t) => (
              <div key={t.id}>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <p className="text-[11.5px] font-bold tracking-wide text-ink-400 uppercase">
                    {dayDate(t.departAt)}
                  </p>
                  <Badge
                    tone={
                      t.status === 'running'
                        ? 'brand'
                        : t.status === 'published'
                          ? 'success'
                          : 'neutral'
                    }
                    size="sm"
                    dot
                  >
                    {t.status === 'running'
                      ? 'On the road'
                      : t.status === 'published'
                        ? `Live · departs ${relative(t.departAt)}`
                        : t.status}
                  </Badge>
                </div>
                <TripCard trip={t} showSeats={false} onClick={() => navigate('/traveler/navigate')} />
                <div className="mt-2 grid grid-cols-2 gap-2.5">
                  <CapacityMeter
                    label="Seats"
                    used={t.seatsTotal - t.seatsLeft}
                    total={t.seatsTotal}
                    icon={<Users size={14} />}
                  />
                  <CapacityMeter
                    label="Parcels"
                    used={t.parcelIds.length}
                    total={t.bootSlots.length}
                    icon={<Package size={14} />}
                    tone="success"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between rounded-(--radius-md) bg-white px-4 py-3 ring-1 ring-ink-100">
                  <span className="text-[12.5px] font-semibold text-ink-500">Projected earnings</span>
                  <span className="tabular text-[15px] font-extrabold text-success-600">
                    {inr(
                      (t.seatsTotal - t.seatsLeft) * t.farePerSeat + t.parcelIds.length * 132,
                    )}
                  </span>
                </div>

                {tab === 'upcoming' && (
                  <div className="mt-2 flex gap-2.5">
                    {t.status === 'published' ? (
                      <>
                        <button
                          onClick={() => {
                            cancelTrip(t.id)
                            toast.info('Ride cancelled', 'Anyone who booked has been refunded.')
                          }}
                          className="pressable h-11 flex-1 rounded-(--radius-md) border border-ink-200 bg-white text-[13px] font-semibold text-ink-600"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <X size={14} /> Cancel
                          </span>
                        </button>
                        <button
                          onClick={() => start(t.id)}
                          className="pressable h-11 flex-[1.6] rounded-(--radius-md) bg-action text-[13.5px] font-bold text-white shadow-(--shadow-action) hover:bg-action-hover"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Navigation size={15} /> Start trip
                          </span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate('/traveler/navigate')}
                        className="pressable h-11 w-full rounded-(--radius-md) bg-brand-600 text-[13.5px] font-bold text-white shadow-(--shadow-brand-sm)"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Navigation size={15} /> Open navigation
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScreenBody>
    </Screen>
  )
}

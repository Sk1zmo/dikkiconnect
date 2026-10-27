import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDots, NavigationArrow, Package, Plus, Users, X } from '@phosphor-icons/react'
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
import { explain } from '@/lib/api'
import { dayDate, inr, relative } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'
import { useApp, useMe, useMyTrips } from '@/lib/store'
import { seatsScarce } from '@/lib/scarcity'


type Tab = 'upcoming' | 'past'

export default function TravelerTrips() {
  const ME = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')

  const mine = useMyTrips(ME.id)
  const { startTrip, cancelTrip, tripsLoading, walletTxns } = useApp()
  const { loading: settling } = useLoaded(mine.all, 950)
  const loading = tripsLoading || settling

  // Rides published ahead of time sit in "scheduled" until the driver starts
  // them, so a ride posted three days early is a first-class thing here.
  const upcoming = useMemo(
    () => [...mine.running, ...mine.scheduled],
    [mine.running, mine.scheduled],
  )
  const list = tab === 'upcoming' ? upcoming : mine.completed

  const weekEarnings = useMemo(() => {
    const since = Date.now() - 7 * 86_400_000
    return walletTxns
      .filter((t) => t.kind === 'credit' && new Date(t.at).getTime() >= since)
      .reduce((s, t) => s + t.amount, 0)
  }, [walletTxns])
  const seatsSold = useMemo(
    () => mine.all.reduce((s, t) => s + (t.seatsTotal - t.seatsLeft), 0),
    [mine.all],
  )

  const start = (id: string) => {
    void startTrip(id)
      .then(() => {
        toast.success('Trip started', 'Navigation is live and passengers have been notified.')
        navigate('/traveler/navigate')
      })
      .catch((e) => toast.error('Could not start', explain(e)))
  }

  return (
    <Screen>
      <LargeTitle
        title="Trips"
        subtitle={`${mine.scheduled.length} scheduled · ${mine.running.length} running · ${mine.completed.length} completed`}
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
              <Stat label="This week" value={inr(weekEarnings)} tone="success" />
              <Stat label="Seats sold" value={String(seatsSold)} tone="accent" />
              <Stat label="Parcels" value="0" tone="brand" />
            </div>
            {mine.scheduled.length > 0 && (
              <Note tone="brand" icon={<CalendarDots size={15} />} className="mb-4" title="Posted in advance">
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
              kind="trips"
              title={tab === 'upcoming' ? 'You haven’t posted a trip' : 'No past trips yet'}
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
                  {/* Status stays in its own colour — it is a state, not an
                      urgency. The yellow beside it is reserved for the single
                      fact that decays: a ride with one or two seats left is
                      about to stop being bookable, and the driver may want to
                      drop the fare while it still can be. */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {t.status === 'published' && seatsScarce(t.seatsLeft) && (
                      <Badge tone="signal" size="sm">
                        {t.seatsLeft} seat{t.seatsLeft > 1 ? 's' : ''} left
                      </Badge>
                    )}
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
                </div>
                <TripCard trip={t} showSeats={false} onClick={() => navigate(`/traveler/trips/${t.id}`)} />
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
                {/* The only row on the card that is a number rather than a
                    state, so it is the one set loud. "Projected earnings"
                    drops to a caption: the driver already knows what the row
                    is for, and the figure is what they came back to check. */}
                <div className="mt-2 flex min-h-12 items-center justify-between gap-3 rounded-(--radius-md) border border-ink-200 bg-white px-4 py-3">
                  <span className="text-[11.5px] font-semibold text-ink-500">
                    Projected earnings
                  </span>
                  <span className="tabular text-[19px] leading-none font-extrabold tracking-title text-success-600">
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
                            void cancelTrip(t.id)
                              .then(() =>
                                toast.info(
                                  'Ride cancelled',
                                  'Anyone who paid by wallet has been refunded.',
                                ),
                              )
                              .catch((e) => toast.error('Could not cancel', explain(e)))
                          }}
                          className="pressable h-12 flex-1 rounded-(--radius-md) border border-ink-200 bg-white text-[13px] font-semibold text-ink-600"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <X size={14} /> Cancel
                          </span>
                        </button>
                        <button
                          onClick={() => start(t.id)}
                          className="pressable h-12 flex-[1.6] rounded-(--radius-md) bg-action text-[13.5px] font-bold text-white shadow-(--shadow-action) hover:bg-action-hover"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <NavigationArrow size={15} /> Start trip
                          </span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate('/traveler/navigate')}
                        className="pressable h-12 w-full rounded-(--radius-md) bg-brand-600 text-[13.5px] font-bold text-white shadow-(--shadow-brand-sm)"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <NavigationArrow size={15} /> Open navigation
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

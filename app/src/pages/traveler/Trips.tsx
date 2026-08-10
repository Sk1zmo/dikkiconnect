import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, Users } from 'lucide-react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  Badge,
  Card,
  EmptyState,
  IconButton,
  Segmented,
  SkeletonList,
  Stat,
} from '@/components/ui'
import { CapacityMeter, TripCard } from '@/components/domain/Cards'
import { EmptyRoadArt } from '@/components/viz/Illustrations'
import { TRAVELERS, TRIPS } from '@/lib/data'
import { compactInr, dayDate, inr } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'

const ME = TRAVELERS[0]

type Tab = 'upcoming' | 'past'

export default function TravelerTrips() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('upcoming')
  const { loading } = useLoaded(TRIPS, 950)

  const upcoming = useMemo(() => TRIPS.filter((t) => t.travelerId === ME.id), [])
  const past = useMemo(() => TRIPS.filter((t) => t.travelerId !== ME.id).slice(0, 2), [])
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <Screen>
      <LargeTitle
        title="Trips"
        subtitle={`${upcoming.length} upcoming · ${ME.trips} completed`}
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
            { value: 'upcoming', label: 'Upcoming', badge: upcoming.length },
            { value: 'past', label: 'Past' },
          ]}
        />
      </div>

      <ScreenBody>
        {tab === 'upcoming' && !loading && (
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <Stat label="This week" value={compactInr(4820)} tone="success" />
            <Stat label="Seats sold" value="7" tone="accent" />
            <Stat label="Parcels" value="14" tone="brand" />
          </div>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : list.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              art={<EmptyRoadArt />}
              title={tab === 'upcoming' ? 'No trips planned' : 'No past trips yet'}
              body={
                tab === 'upcoming'
                  ? 'Publish your next drive and start earning from the boot space and seats you already have.'
                  : 'Completed trips and their earnings will show up here.'
              }
              actionLabel={tab === 'upcoming' ? 'Publish a trip' : undefined}
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
                  <Badge tone={t.status === 'published' ? 'success' : 'neutral'} size="sm" dot>
                    {t.status === 'published' ? 'Live' : t.status}
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
              </div>
            ))}
          </div>
        )}
      </ScreenBody>
    </Screen>
  )
}

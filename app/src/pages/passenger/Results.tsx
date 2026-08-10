import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Users } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  Card,
  ChipRow,
  Counter,
  EmptyState,
  IconButton,
  Note,
  Sheet,
  SkeletonList,
  Switch,
} from '@/components/ui'
import { TripCard } from '@/components/domain/Cards'
import { EmptyRoadArt } from '@/components/viz/Illustrations'
import { TRIPS, cityName, travelerById } from '@/lib/data'
import { dayDate, inr } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'

type SortKey = 'earliest' | 'cheapest' | 'rating'

export default function RideResults() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const from = params.get('from') ?? 'blr'
  const to = params.get('to') ?? 'mys'
  const date = params.get('date') ?? new Date().toISOString().slice(0, 10)
  const seatsWanted = Number(params.get('seats') ?? 1)

  const [sort, setSort] = useState<SortKey>('earliest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [maxFare, setMaxFare] = useState(1000)
  const [minRating, setMinRating] = useState(4)
  const [instantOnly, setInstantOnly] = useState(false)

  const matches = useMemo(
    () => TRIPS.filter((t) => t.fromCityId === from && t.toCityId === to),
    [from, to],
  )
  const { loading } = useLoaded(matches, 1150)

  const visible = useMemo(() => {
    const list = matches.filter((t) => {
      const driver = travelerById(t.travelerId)
      if (t.seatsLeft < seatsWanted) return false
      if (t.farePerSeat > maxFare) return false
      if ((driver?.rating ?? 0) < minRating) return false
      if (instantOnly && t.seatsLeft < 2) return false
      return true
    })

    return [...list].sort((a, b) => {
      if (sort === 'cheapest') return a.farePerSeat - b.farePerSeat
      if (sort === 'rating')
        return (travelerById(b.travelerId)?.rating ?? 0) - (travelerById(a.travelerId)?.rating ?? 0)
      return new Date(a.departAt).getTime() - new Date(b.departAt).getTime()
    })
  }, [matches, seatsWanted, maxFare, minRating, instantOnly, sort])

  const cheapest = visible.length ? Math.min(...visible.map((t) => t.farePerSeat)) : 0

  return (
    <Screen>
      <TopBar
        back
        title={`${cityName(from)} → ${cityName(to)}`}
        subtitle={`${dayDate(date)} · ${seatsWanted} seat${seatsWanted > 1 ? 's' : ''}`}
        action={
          <IconButton
            icon={<SlidersHorizontal size={17} />}
            label="Filters"
            onClick={() => setFiltersOpen(true)}
          />
        }
      />

      <div className="shrink-0 px-5 pb-3">
        <ChipRow
          value={sort}
          onChange={setSort}
          options={[
            { value: 'earliest', label: 'Earliest' },
            { value: 'cheapest', label: 'Lowest cost' },
            { value: 'rating', label: 'Top rated' },
          ]}
        />
      </div>

      <ScreenBody>
        {!loading && visible.length > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-(--radius-md) bg-white px-4 py-3 ring-1 ring-ink-100">
            <p className="text-[12.5px] font-semibold text-ink-600">
              {visible.length} ride{visible.length === 1 ? '' : 's'} available
            </p>
            <p className="tabular text-[12.5px] font-bold text-brand-700">from {inr(cheapest)}</p>
          </div>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : visible.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              art={<EmptyRoadArt />}
              title="No rides match"
              body={`Nobody is driving ${cityName(from)} → ${cityName(to)} with ${seatsWanted} free seat${seatsWanted > 1 ? 's' : ''} under your filters. Try another date or widen the range.`}
              actionLabel="Adjust filters"
              onAction={() => setFiltersOpen(true)}
              secondaryLabel="Change search"
              onSecondary={() => navigate('/passenger')}
            />
          </Card>
        ) : (
          <div className="stagger flex flex-col gap-3">
            {visible.map((t) => (
              <TripCard key={t.id} trip={t} to={`/passenger/ride/${t.id}`} />
            ))}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <Note tone="brand" icon={<Users size={15} />} className="mt-5" title="Contact after booking">
            Driver phone number and the exact pickup point are shared only once your seat is
            confirmed — a safety default we do not turn off.
          </Note>
        )}
      </ScreenBody>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter rides"
        footer={
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setMaxFare(1000)
                setMinRating(4)
                setInstantOnly(false)
              }}
              className="pressable h-12 flex-1 rounded-(--radius-md) bg-ink-100 text-[14.5px] font-semibold text-ink-700"
            >
              Reset
            </button>
            <button
              onClick={() => setFiltersOpen(false)}
              className="pressable h-12 flex-[1.6] rounded-(--radius-md) bg-action text-[14.5px] font-bold text-white hover:bg-action-hover"
            >
              Show {visible.length} ride{visible.length === 1 ? '' : 's'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 py-1">
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-ink-700">Maximum cost share</p>
            <Counter value={maxFare} onChange={setMaxFare} min={100} max={2000} step={50} suffix="₹" />
          </div>
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-ink-700">Minimum driver rating</p>
            <Counter value={minRating} onChange={setMinRating} min={1} max={5} step={0.5} decimals={1} suffix="★" />
          </div>
          <div className="h-px bg-ink-100" />
          <Switch
            checked={instantOnly}
            onChange={setInstantOnly}
            label="Instant booking only"
            description="Skip driver approval — confirmed the moment you pay"
          />
        </div>
      </Sheet>
    </Screen>
  )
}

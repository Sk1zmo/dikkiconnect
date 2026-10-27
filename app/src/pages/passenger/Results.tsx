import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Users } from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  Card,
  ChipRow,
  Counter,
  EmptyState,
  IconButton,
  Note,
  Sheet,
  MarkLoader,
  SkeletonList,
  Switch,
} from '@/components/ui'
import { TripCard } from '@/components/domain/Cards'
import { cityName } from '@/lib/data'
import { dayDate, inr } from '@/lib/format'
import { rides } from '@/lib/api'
import { LOADING } from '@/lib/copy'
import type { Trip } from '@/lib/types'

type SortKey = 'earliest' | 'cheapest'

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
  const [instantOnly, setInstantOnly] = useState(false)

  // The server's own board for this corridor — a ride a driver posted in
  // advance shows up here the moment they publish it, from any device.
  const [matches, setMatches] = useState<Trip[] | null>(null)
  const loading = matches === null

  useEffect(() => {
    let cancelled = false
    setMatches(null)
    rides
      .search(from, to)
      .then(({ trips }) => {
        if (!cancelled) setMatches(trips)
      })
      .catch(() => {
        if (!cancelled) setMatches([])
      })
    return () => {
      cancelled = true
    }
  }, [from, to])

  const visible = useMemo(() => {
    const list = (matches ?? []).filter((t) => {
      if (t.seatsLeft < seatsWanted) return false
      if (t.farePerSeat > maxFare) return false
      if (instantOnly && t.seatsLeft < 2) return false
      return true
    })

    return [...list].sort((a, b) =>
      sort === 'cheapest'
        ? a.farePerSeat - b.farePerSeat
        : new Date(a.departAt).getTime() - new Date(b.departAt).getTime(),
    )
  }, [matches, seatsWanted, maxFare, instantOnly, sort])

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
          ]}
        />
      </div>

      <ScreenBody>
        {/* ═══════════════════════════════════════════════════════════════════
            Two facts set in the same 12.5px semibold before, which made the
            strip read as a sentence and cost it its job: you had to actually
            read it to learn the count and the floor price. Both numbers now
            carry the weight and their words shrink under them, so a glance
            lands on "4" and "₹399" and the strip answers before it is read.
            ═══════════════════════════════════════════════════════════════ */}
        {!loading && visible.length > 0 && (
          <div className="mb-4 flex min-h-12 items-center justify-between gap-3 rounded-(--radius-md) border border-ink-200 bg-white px-4 py-2.5">
            <p className="flex items-baseline gap-1.5">
              <span className="tabular text-[18px] font-extrabold tracking-title text-ink-900">
                {visible.length}
              </span>
              <span className="text-[11.5px] font-semibold text-ink-500">
                ride{visible.length === 1 ? '' : 's'} available
              </span>
            </p>
            <p className="flex shrink-0 items-baseline gap-1.5">
              <span className="text-[11.5px] font-semibold text-ink-500">from</span>
              <span className="tabular text-[18px] font-extrabold tracking-title text-brand-700">
                {inr(cheapest)}
              </span>
            </p>
          </div>
        )}

        {loading ? (
          <>
            <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink-600" role="status">
              <MarkLoader size={18} />
              {LOADING.rides.line}…
            </p>
            <SkeletonList count={3} />
          </>
        ) : visible.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              kind="search-results"
              title="Nobody is driving that yet"
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

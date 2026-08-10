import { useMemo, useState } from 'react'
import { Filter, Plus, Search } from 'lucide-react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  Card,
  EmptyState,
  IconButton,
  SearchField,
  Segmented,
  Sheet,
  SkeletonList,
  Switch,
} from '@/components/ui'
import { ParcelCard } from '@/components/domain/Cards'
import { EmptyBoxArt } from '@/components/viz/Illustrations'
import { useApp } from '@/lib/store'
import { useDebounced, useLoaded } from '@/lib/hooks'
import { categoryById, cityName } from '@/lib/data'

type Tab = 'active' | 'completed' | 'all'

export default function SenderBookings() {
  const { parcels } = useApp()
  const [tab, setTab] = useState<Tab>('active')
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [fragileOnly, setFragileOnly] = useState(false)
  const [protectedOnly, setProtectedOnly] = useState(false)

  const debounced = useDebounced(query, 220)
  const { loading } = useLoaded(parcels, 950)

  const counts = useMemo(
    () => ({
      active: parcels.filter((p) => !['delivered', 'cancelled'].includes(p.status)).length,
      completed: parcels.filter((p) => ['delivered', 'cancelled'].includes(p.status)).length,
      all: parcels.length,
    }),
    [parcels],
  )

  const visible = useMemo(() => {
    let list = parcels
    if (tab === 'active') list = list.filter((p) => !['delivered', 'cancelled'].includes(p.status))
    if (tab === 'completed') list = list.filter((p) => ['delivered', 'cancelled'].includes(p.status))
    if (fragileOnly) list = list.filter((p) => p.fragile)
    if (protectedOnly) list = list.filter((p) => p.declaredValue > 1000)

    const q = debounced.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.receiverName.toLowerCase().includes(q) ||
          cityName(p.fromCityId).toLowerCase().includes(q) ||
          cityName(p.toCityId).toLowerCase().includes(q) ||
          categoryById(p.category).label.toLowerCase().includes(q),
      )
    }
    return list
  }, [parcels, tab, debounced, fragileOnly, protectedOnly])

  const activeFilters = Number(fragileOnly) + Number(protectedOnly)

  return (
    <Screen>
      <LargeTitle
        title="Bookings"
        subtitle={`${counts.all} parcels sent with DikkiConnect`}
        className="pt-safe"
        action={
          <>
            <IconButton
              icon={<Filter size={17} />}
              label="Filters"
              onClick={() => setFiltersOpen(true)}
              className={activeFilters ? 'ring-2 ring-brand-500' : undefined}
            />
            <IconButton icon={<Plus size={18} />} label="New booking" tone="solid" onClick={() => {}} />
          </>
        }
      />

      <div className="shrink-0 px-5 pb-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search ID, city or receiver"
          className="mb-3"
        />
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: 'Active', badge: counts.active },
            { value: 'completed', label: 'Completed' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      <ScreenBody>
        {loading ? (
          <SkeletonList count={4} />
        ) : visible.length === 0 ? (
          debounced ? (
            <EmptyState
              icon={<Search size={26} />}
              title={`No results for “${debounced}”`}
              body="Try a tracking ID, a city name, or the receiver's name."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          ) : (
            <Card padded={false}>
              <EmptyState
                art={<EmptyBoxArt />}
                title={tab === 'active' ? 'Nothing in flight' : 'No completed bookings yet'}
                body={
                  tab === 'active'
                    ? 'Parcels you book will appear here while they move between hubs.'
                    : 'Once a parcel is delivered it moves here with its full receipt.'
                }
                actionLabel="Book a parcel"
                actionTo="/sender/book"
              />
            </Card>
          )
        ) : (
          <div className="stagger flex flex-col gap-3">
            {visible.map((p) => (
              <ParcelCard key={p.id} parcel={p} to={`/sender/track/${p.id}`} />
            ))}
          </div>
        )}
      </ScreenBody>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        subtitle="Narrow down your bookings"
        footer={
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setFragileOnly(false)
                setProtectedOnly(false)
              }}
              className="pressable h-12 flex-1 rounded-(--radius-md) bg-ink-100 text-[14.5px] font-semibold text-ink-700"
            >
              Reset
            </button>
            <button
              onClick={() => setFiltersOpen(false)}
              className="pressable h-12 flex-[1.6] rounded-(--radius-md) bg-action text-[14.5px] font-bold text-white hover:bg-action-hover"
            >
              Show {visible.length} result{visible.length === 1 ? '' : 's'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 py-2">
          <Switch
            checked={fragileOnly}
            onChange={setFragileOnly}
            label="Fragile parcels only"
            description="Items flagged for careful handling"
          />
          <div className="h-px bg-ink-100" />
          <Switch
            checked={protectedOnly}
            onChange={setProtectedOnly}
            label="High-value only"
            description="Declared value above ₹1,000"
          />
        </div>
      </Sheet>
    </Screen>
  )
}

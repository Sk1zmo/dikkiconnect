import { useMemo, useState } from 'react'
import { Package, Search } from 'lucide-react'
import { AdminCard, AdminPill, DataTable, Kpi, PageHeader, type Column } from './components'
import {
  EmptyState,
  KeyValue,
  Note,
  SearchField,
  Segmented,
  Sheet,
  PARCEL_STATUS_META,
} from '@/components/ui'
import { Timeline } from '@/components/viz/Timeline'
import { PARCELS, categoryById, cityName, hubShort, travelerById } from '@/lib/data'
import { dateTime, inr, kg } from '@/lib/format'
import { useDebounced, useLoaded } from '@/lib/hooks'
import type { Parcel } from '@/lib/types'

type Filter = 'all' | 'active' | 'delivered' | 'exception'

const TONE_MAP = {
  brand: 'info',
  success: 'good',
  warn: 'warning',
  danger: 'critical',
  neutral: 'neutral',
  accent: 'info',
  dark: 'neutral',
} as const

export default function AdminParcels() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Parcel | null>(null)
  const debounced = useDebounced(query, 200)
  const { loading } = useLoaded(PARCELS, 700)

  const rows = useMemo(() => {
    let list = PARCELS
    if (filter === 'active')
      list = list.filter((p) => !['delivered', 'cancelled'].includes(p.status))
    if (filter === 'delivered') list = list.filter((p) => p.status === 'delivered')
    if (filter === 'exception') list = list.filter((p) => p.status === 'cancelled')

    const q = debounced.trim().toLowerCase()
    if (q)
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.senderName.toLowerCase().includes(q) ||
          p.receiverName.toLowerCase().includes(q),
      )
    return list
  }, [filter, debounced])

  const columns: Array<Column<Parcel>> = [
    {
      key: 'id',
      header: 'Parcel',
      width: '18%',
      render: (p) => {
        const cat = categoryById(p.category)
        return (
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-(--radius-xs) bg-brand-50 text-[15px]">
              {cat.emoji}
            </span>
            <div className="min-w-0">
              <p className="tabular truncate font-bold text-ink-900">{p.id}</p>
              <p className="truncate text-[11.5px] text-ink-500">{cat.label}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'route',
      header: 'Route',
      width: '20%',
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate text-ink-800">
            {cityName(p.fromCityId)} → {cityName(p.toCityId)}
          </p>
          <p className="truncate text-[11.5px] text-ink-500">
            {hubShort(p.originHubId)} → {hubShort(p.destinationHubId)}
          </p>
        </div>
      ),
    },
    {
      key: 'people',
      header: 'Sender → Receiver',
      width: '19%',
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate text-ink-800">{p.senderName}</p>
          <p className="truncate text-[11.5px] text-ink-500">{p.receiverName}</p>
        </div>
      ),
    },
    {
      key: 'traveler',
      header: 'Traveler',
      width: '14%',
      render: (p) => (
        <span className="text-ink-600">{travelerById(p.travelerId)?.name ?? '—'}</span>
      ),
    },
    { key: 'weight', header: 'Weight', width: '9%', align: 'right', render: (p) => kg(p.weightKg) },
    { key: 'value', header: 'Fare', width: '9%', align: 'right', render: (p) => inr(p.price) },
    {
      key: 'status',
      header: 'Status',
      width: '13%',
      render: (p) => {
        const meta = PARCEL_STATUS_META[p.status]
        return <AdminPill tone={TONE_MAP[meta.tone]}>{meta.short}</AdminPill>
      },
    },
  ]

  const active = PARCELS.filter((p) => !['delivered', 'cancelled'].includes(p.status)).length

  return (
    <>
      <PageHeader title="Parcels" subtitle="Every parcel in the network with its full custody trail" />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi label="In network" value={String(active)} icon={<Package size={15} />} />
        <Kpi label="Delivered this month" value="1,124" delta={{ value: '12.4%', up: true }} />
        <Kpi label="Avg transit time" value="6h 20m" delta={{ value: '8%', up: false }} upIsGood={false} />
        <Kpi label="Exception rate" value="0.6%" delta={{ value: '0.2%', up: false }} upIsGood={false} />
      </div>

      <AdminCard padded={false}>
        <div className="flex items-center gap-4 border-b border-ink-200 p-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search parcel ID, sender or receiver"
            className="max-w-[320px]"
          />
          <div className="w-[380px]">
            <Segmented
              value={filter}
              onChange={setFilter}
              size="sm"
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'In transit' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'exception', label: 'Exceptions' },
              ]}
            />
          </div>
          <p className="ml-auto text-[12.5px] text-ink-500">
            Showing <span className="font-bold text-ink-800">{rows.length}</span> of {PARCELS.length}
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          onRowClick={setSelected}
          empty={
            <EmptyState
              icon={<Search size={26} />}
              compact
              title="No parcels match"
              body="Try a different parcel ID, name or status."
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('')
                setFilter('all')
              }}
            />
          }
        />
      </AdminCard>

      {/* Timeline drawer */}
      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.id}
        subtitle={
          selected ? `${cityName(selected.fromCityId)} → ${cityName(selected.toCityId)}` : undefined
        }
        fullHeight
      >
        {selected && (
          <>
            <div className="mb-5 rounded-(--radius-sm) border border-ink-100 p-4">
              <KeyValue label="Category" value={categoryById(selected.category).label} />
              <KeyValue label="Size / weight" value={`${selected.size} · ${kg(selected.weightKg)}`} />
              <KeyValue label="Declared value" value={inr(selected.declaredValue)} />
              <KeyValue label="Handling" value={selected.fragile ? 'Fragile' : 'Standard'} />
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue label="Sender" value={selected.senderName} />
              <KeyValue label="Receiver" value={selected.receiverName} />
              <KeyValue label="Traveler" value={travelerById(selected.travelerId)?.name ?? 'Unassigned'} />
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue label="Booked" value={dateTime(selected.bookedAt)} />
              <KeyValue label="Fare collected" value={inr(selected.price)} strong />
            </div>

            <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              Custody trail
            </p>
            <Timeline events={selected.timeline} />

            <Note tone="neutral" className="mt-5" title="Audit note">
              Every OTP-verified node is timestamped and immutable. Photo evidence is retained for 90
              days and attached to any dispute raised on this parcel.
            </Note>
          </>
        )}
      </Sheet>
    </>
  )
}

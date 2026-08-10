import { useMemo, useState } from 'react'
import { Car, Package, Search, Users } from 'lucide-react'
import { AdminCard, AdminPill, DataTable, Kpi, PageHeader, type Column } from './components'
import {
  Avatar,
  EmptyState,
  KeyValue,
  Note,
  SearchField,
  Segmented,
  Sheet,
  Stars,
} from '@/components/ui'
import { RouteMap } from '@/components/viz/Map'
import { TRIPS, cityName, travelerById } from '@/lib/data'
import { dayDate, inr, time } from '@/lib/format'
import { useDebounced, useLoaded } from '@/lib/hooks'
import type { Trip } from '@/lib/types'

type Filter = 'all' | 'published' | 'running' | 'completed'

export default function AdminTrips() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Trip | null>(null)
  const debounced = useDebounced(query, 200)
  const { loading } = useLoaded(TRIPS, 700)

  const rows = useMemo(() => {
    let list = TRIPS
    if (filter !== 'all') list = list.filter((t) => t.status === filter)
    const q = debounced.trim().toLowerCase()
    if (q)
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          (travelerById(t.travelerId)?.name.toLowerCase().includes(q) ?? false) ||
          cityName(t.toCityId).toLowerCase().includes(q),
      )
    return list
  }, [filter, debounced])

  const columns: Array<Column<Trip>> = [
    {
      key: 'id',
      header: 'Trip',
      width: '14%',
      render: (t) => (
        <div className="min-w-0">
          <p className="tabular truncate font-bold text-ink-900">{t.id}</p>
          <p className="truncate text-[11.5px] text-ink-500">{dayDate(t.departAt)}</p>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      width: '22%',
      render: (t) => {
        const d = travelerById(t.travelerId)
        if (!d) return <span className="text-ink-400">—</span>
        return (
          <div className="flex items-center gap-3">
            <Avatar name={d.name} size={30} tone={d.avatarTone} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{d.name}</p>
              <p className="tabular truncate text-[11.5px] text-ink-500">{d.vehicle.plate}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'route',
      header: 'Route',
      width: '20%',
      render: (t) => (
        <div className="min-w-0">
          <p className="truncate text-ink-800">
            {cityName(t.fromCityId)} → {cityName(t.toCityId)}
          </p>
          <p className="tabular truncate text-[11.5px] text-ink-500">
            {time(t.departAt)} – {time(t.arriveAt)}
          </p>
        </div>
      ),
    },
    {
      key: 'seats',
      header: 'Seats',
      width: '11%',
      align: 'right',
      render: (t) => `${t.seatsTotal - t.seatsLeft}/${t.seatsTotal}`,
    },
    {
      key: 'parcels',
      header: 'Parcels',
      width: '11%',
      align: 'right',
      render: (t) => `${t.parcelIds.length}/${t.bootSlots.length}`,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      width: '11%',
      align: 'right',
      render: (t) => inr((t.seatsTotal - t.seatsLeft) * t.farePerSeat + t.parcelIds.length * 132),
    },
    {
      key: 'status',
      header: 'Status',
      width: '11%',
      render: (t) => (
        <AdminPill tone={t.status === 'published' ? 'good' : t.status === 'running' ? 'info' : 'neutral'}>
          {t.status}
        </AdminPill>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Trips" subtitle="Published routes, seat fill and parcel load" />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi label="Trips this month" value="416" delta={{ value: '9.1%', up: true }} icon={<Car size={15} />} />
        <Kpi label="Avg seat fill" value="62%" delta={{ value: '4%', up: true }} icon={<Users size={15} />} />
        <Kpi label="Avg boot fill" value="71%" delta={{ value: '6%', up: true }} icon={<Package size={15} />} />
        <Kpi label="Cancelled trips" value="11" delta={{ value: '1.4%', up: false }} upIsGood={false} />
      </div>

      <AdminCard padded={false}>
        <div className="flex items-center gap-4 border-b border-ink-200 p-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search trip ID, driver or city"
            className="max-w-[320px]"
          />
          <div className="w-[360px]">
            <Segmented
              value={filter}
              onChange={setFilter}
              size="sm"
              options={[
                { value: 'all', label: 'All' },
                { value: 'published', label: 'Published' },
                { value: 'running', label: 'Running' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </div>
          <p className="ml-auto text-[12.5px] text-ink-500">
            Showing <span className="font-bold text-ink-800">{rows.length}</span> of {TRIPS.length}
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
              title="No trips match"
              body="Try a different trip ID, driver name or destination."
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('')
                setFilter('all')
              }}
            />
          }
        />
      </AdminCard>

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
            <div className="mb-5 overflow-hidden rounded-(--radius-md)">
              <RouteMap
                height={150}
                fromLabel={cityName(selected.fromCityId)}
                toLabel={cityName(selected.toCityId)}
              />
            </div>

            {(() => {
              const d = travelerById(selected.travelerId)
              if (!d) return null
              return (
                <div className="mb-5 flex items-center gap-3.5 rounded-(--radius-sm) border border-ink-100 p-4">
                  <Avatar name={d.name} size={44} tone={d.avatarTone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold text-ink-900">{d.name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
                      <Stars value={d.rating} size={11} />
                      <span className="tabular">{d.vehicle.plate}</span>
                    </div>
                  </div>
                  <AdminPill tone={d.kycTier === 'passenger_ready' ? 'good' : 'info'}>
                    {d.kycTier === 'passenger_ready' ? 'Full KYC' : 'Parcels only'}
                  </AdminPill>
                </div>
              )
            })()}

            <div className="rounded-(--radius-sm) border border-ink-100 p-4">
              <KeyValue label="Departs" value={`${dayDate(selected.departAt)} · ${time(selected.departAt)}`} />
              <KeyValue label="Arrives" value={time(selected.arriveAt)} />
              <KeyValue label="Via" value={selected.viaStops.join(' · ')} />
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue
                label="Seats"
                value={`${selected.seatsTotal - selected.seatsLeft} of ${selected.seatsTotal} booked`}
              />
              <KeyValue label="Fare per seat" value={inr(selected.farePerSeat)} />
              <KeyValue
                label="Boot slots"
                value={`${selected.parcelIds.length} of ${selected.bootSlots.length} used`}
              />
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue
                label="Trip revenue"
                value={inr(
                  (selected.seatsTotal - selected.seatsLeft) * selected.farePerSeat +
                    selected.parcelIds.length * 132,
                )}
                strong
              />
            </div>

            <Note tone="warn" className="mt-5" title="Cost-sharing compliance">
              Suggested fuel + toll share for this corridor is {inr(268)} per seat. This trip is
              priced at {inr(selected.farePerSeat)}. Anything materially above the cost share risks
              being read as commercial transport under the Motor Vehicles Act.
            </Note>
          </>
        )}
      </Sheet>
    </>
  )
}

import { useMemo, useState } from 'react'
import { Ban, Car, Check, FileWarning, Search, ShieldCheck, X } from 'lucide-react'
import { AdminCard, AdminPill, DataTable, Kpi, PageHeader, type Column } from './components'
import {
  Avatar,
  Button,
  EmptyState,
  KeyValue,
  Note,
  SearchField,
  Segmented,
  Sheet,
  Stars,
  useToast,
} from '@/components/ui'
import { KYC_STEPS, TRAVELERS } from '@/lib/data'
import { compactInr, inr, shortDate } from '@/lib/format'
import { useDebounced, useLoaded } from '@/lib/hooks'
import type { Traveler } from '@/lib/types'

interface DriverRow extends Traveler {
  earnings: number
  parcels: number
  kycState: 'verified' | 'pending' | 'rejected'
}

const DRIVERS: DriverRow[] = TRAVELERS.map((t, i) => ({
  ...t,
  earnings: [48200, 31400, 18900, 9600][i] ?? 12000,
  parcels: [214, 132, 88, 41][i] ?? 30,
  kycState: (['verified', 'verified', 'pending', 'verified'] as const)[i] ?? 'pending',
}))

type Filter = 'all' | 'verified' | 'pending' | 'rejected'

export default function AdminDrivers() {
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<DriverRow | null>(null)
  const debounced = useDebounced(query, 200)
  const { loading } = useLoaded(DRIVERS, 700)

  const rows = useMemo(() => {
    let list = DRIVERS
    if (filter !== 'all') list = list.filter((d) => d.kycState === filter)
    const q = debounced.trim().toLowerCase()
    if (q)
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.vehicle.plate.toLowerCase().includes(q) ||
          d.vehicle.model.toLowerCase().includes(q),
      )
    return list
  }, [filter, debounced])

  const columns: Array<Column<DriverRow>> = [
    {
      key: 'name',
      header: 'Driver',
      width: '24%',
      render: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.name} size={32} tone={d.avatarTone} />
          <div className="min-w-0">
            <p className="truncate font-bold text-ink-900">{d.name}</p>
            <p className="tabular truncate text-[11.5px] text-ink-500">+91 {d.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      width: '19%',
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate text-ink-800">{d.vehicle.model}</p>
          <p className="tabular truncate text-[11.5px] text-ink-500">{d.vehicle.plate}</p>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      width: '13%',
      render: (d) => (
        <AdminPill tone={d.kycTier === 'passenger_ready' ? 'good' : 'info'}>
          {d.kycTier === 'passenger_ready' ? 'Passengers' : 'Parcels only'}
        </AdminPill>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      width: '12%',
      render: (d) => (
        <span className="inline-flex items-center gap-1.5">
          <Stars value={d.rating} size={11} />
          <span className="tabular font-semibold text-ink-700">{d.rating.toFixed(1)}</span>
        </span>
      ),
    },
    { key: 'trips', header: 'Trips', width: '8%', align: 'right', render: (d) => d.trips },
    {
      key: 'earnings',
      header: 'Earnings',
      width: '12%',
      align: 'right',
      render: (d) => compactInr(d.earnings),
    },
    {
      key: 'kyc',
      header: 'KYC',
      width: '12%',
      render: (d) => (
        <AdminPill
          tone={d.kycState === 'verified' ? 'good' : d.kycState === 'pending' ? 'warning' : 'critical'}
        >
          {d.kycState === 'verified' ? 'Verified' : d.kycState === 'pending' ? 'In review' : 'Rejected'}
        </AdminPill>
      ),
    },
  ]

  const pending = DRIVERS.filter((d) => d.kycState === 'pending').length

  return (
    <>
      <PageHeader
        title="Drivers & KYC"
        subtitle="Verification queue and driver performance"
        actions={
          <button
            onClick={() => setFilter('pending')}
            className="pressable-sm rounded-(--radius-sm) bg-action px-3.5 py-2 text-[13px] font-bold text-white shadow-(--shadow-action) hover:bg-action-hover"
          >
            Review {pending} pending
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi label="Active drivers" value={String(DRIVERS.length)} delta={{ value: '14%', up: true }} icon={<Car size={15} />} />
        <Kpi label="Passenger-ready" value={String(DRIVERS.filter((d) => d.kycTier === 'passenger_ready').length)} icon={<ShieldCheck size={15} />} />
        <Kpi label="Pending review" value={String(pending)} upIsGood={false} delta={{ value: '2', up: true }} icon={<FileWarning size={15} />} />
        <Kpi label="Avg driver rating" value="4.85" delta={{ value: '0.06', up: true }} />
      </div>

      <AdminCard padded={false}>
        <div className="flex items-center gap-4 border-b border-ink-200 p-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search name, plate or model"
            className="max-w-[300px]"
          />
          <div className="w-[360px]">
            <Segmented
              value={filter}
              onChange={setFilter}
              size="sm"
              options={[
                { value: 'all', label: 'All' },
                { value: 'verified', label: 'Verified' },
                { value: 'pending', label: 'In review' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>
          <p className="ml-auto text-[12.5px] text-ink-500">
            Showing <span className="font-bold text-ink-800">{rows.length}</span> of {DRIVERS.length}
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
              title="No drivers match"
              body="Try a different name, plate number or KYC status."
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('')
                setFilter('all')
              }}
            />
          }
        />
      </AdminCard>

      {/* Driver detail + KYC review */}
      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected ? `${selected.vehicle.model} · ${selected.vehicle.plate}` : undefined}
        fullHeight
      >
        {selected && (
          <>
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={selected.name} size={56} tone={selected.avatarTone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Stars value={selected.rating} size={13} />
                  <span className="text-[13px] font-bold text-ink-800">
                    {selected.rating.toFixed(1)}
                  </span>
                  <span className="text-[12px] text-ink-400">· {selected.trips} trips</span>
                </div>
                <p className="mt-1 text-[12px] text-ink-500">
                  Verified since {shortDate(selected.verifiedSince)}
                </p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-(--radius-sm) border border-ink-100 p-3.5">
                <p className="text-[11px] font-semibold text-ink-500">Lifetime earnings</p>
                <p className="tabular mt-1 text-[19px] font-extrabold text-ink-900">
                  {inr(selected.earnings)}
                </p>
              </div>
              <div className="rounded-(--radius-sm) border border-ink-100 p-3.5">
                <p className="text-[11px] font-semibold text-ink-500">Parcels carried</p>
                <p className="tabular mt-1 text-[19px] font-extrabold text-ink-900">
                  {selected.parcels}
                </p>
              </div>
            </div>

            {/* Vehicle */}
            <p className="mb-2.5 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              Vehicle
            </p>
            <div className="mb-5 rounded-(--radius-sm) border border-ink-100 p-4">
              <KeyValue label="Model" value={selected.vehicle.model} />
              <KeyValue label="Registration" value={selected.vehicle.plate} />
              <KeyValue label="Colour" value={selected.vehicle.colour} />
              <KeyValue label="Boot capacity" value={`${selected.vehicle.bootCapacityKg} kg`} />
              <KeyValue label="Seats" value={String(selected.vehicle.seats)} />
            </div>

            {/* KYC checklist */}
            <p className="mb-2.5 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              KYC documents
            </p>
            <ul className="mb-5 flex flex-col gap-2">
              {KYC_STEPS.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-(--radius-sm) border border-ink-100 p-3"
                >
                  <span
                    className={
                      s.status === 'verified'
                        ? 'grid size-7 shrink-0 place-items-center rounded-full bg-success-50 text-success-600'
                        : s.status === 'action_required'
                          ? 'grid size-7 shrink-0 place-items-center rounded-full bg-danger-50 text-danger-600'
                          : 'grid size-7 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-400'
                    }
                  >
                    {s.status === 'verified' ? <Check size={14} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink-900">{s.label}</p>
                    <p className="truncate text-[11.5px] text-ink-500">{s.detail}</p>
                  </div>
                  <AdminPill
                    tone={
                      s.status === 'verified'
                        ? 'good'
                        : s.status === 'pending'
                          ? 'warning'
                          : s.status === 'action_required'
                            ? 'critical'
                            : 'neutral'
                    }
                  >
                    {s.status.replace('_', ' ')}
                  </AdminPill>
                </li>
              ))}
            </ul>

            <Note tone="neutral" className="mb-5">
              Aadhaar and licence checks are returned by our licensed KYC vendor. DikkiConnect stores only
              the vendor token and a masked reference — raw numbers are never persisted here.
            </Note>

            <div className="flex flex-col gap-2.5">
              <Button
                block
                icon={<ShieldCheck size={17} />}
                onClick={() => {
                  toast.success('KYC approved', `${selected.name} can now carry passengers`)
                  setSelected(null)
                }}
              >
                Approve passenger tier
              </Button>
              <Button
                variant="outline"
                block
                onClick={() => toast.warn('Re-upload requested', 'Driver has been notified by SMS.')}
              >
                Request document re-upload
              </Button>
              <Button
                variant="danger"
                block
                icon={<Ban size={17} />}
                onClick={() => {
                  toast.error('Driver suspended', selected.name)
                  setSelected(null)
                }}
              >
                Suspend driver
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </>
  )
}

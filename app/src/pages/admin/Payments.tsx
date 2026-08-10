import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownLeft, ArrowUpRight, Banknote, IndianRupee, Search, Wallet } from 'lucide-react'
import {
  AdminCard,
  AdminPill,
  ChartFrame,
  DataTable,
  Kpi,
  PageHeader,
  VIZ,
  VizTooltip,
  type Column,
} from './components'
import { EmptyState, KeyValue, Note, SearchField, Segmented, Sheet, useToast, Button } from '@/components/ui'
import { compactInr, inr, relative } from '@/lib/format'
import { useDebounced, useLoaded } from '@/lib/hooks'

interface Settlement {
  id: string
  party: string
  kind: 'Driver' | 'Hub' | 'Refund'
  period: string
  items: number
  gross: number
  commission: number
  net: number
  status: 'paid' | 'pending' | 'failed'
  at: number
}

const SETTLEMENTS: Settlement[] = [
  { id: 'ST-2041', party: 'Arjun Menon', kind: 'Driver', period: '27 Jul – 2 Aug', items: 34, gross: 6820, commission: 1023, net: 5797, status: 'pending', at: -2 },
  { id: 'ST-2040', party: 'Koramangala Hub', kind: 'Hub', period: '27 Jul – 2 Aug', items: 123, gross: 1845, commission: 0, net: 1845, status: 'pending', at: -2 },
  { id: 'ST-2039', party: 'Divya Nair', kind: 'Driver', period: '20 – 26 Jul', items: 28, gross: 5240, commission: 786, net: 4454, status: 'paid', at: -170 },
  { id: 'ST-2038', party: 'Saraswathipuram Hub', kind: 'Hub', period: '20 – 26 Jul', items: 96, gross: 1440, commission: 0, net: 1440, status: 'paid', at: -170 },
  { id: 'ST-2037', party: 'Aditi Sharma', kind: 'Refund', period: 'DKC-4610', items: 1, gross: 89, commission: 0, net: 89, status: 'paid', at: -238 },
  { id: 'ST-2036', party: 'Karthik Reddy', kind: 'Driver', period: '13 – 19 Jul', items: 19, gross: 3180, commission: 477, net: 2703, status: 'failed', at: -340 },
  { id: 'ST-2035', party: 'Jayanagar Hub', kind: 'Hub', period: '13 – 19 Jul', items: 74, gross: 1110, commission: 0, net: 1110, status: 'paid', at: -340 },
]

const REVENUE_SPLIT = [
  { month: 'Mar', parcels: 42000, rides: 18000 },
  { month: 'Apr', parcels: 58000, rides: 26000 },
  { month: 'May', parcels: 71000, rides: 34000 },
  { month: 'Jun', parcels: 96000, rides: 41000 },
  { month: 'Jul', parcels: 132000, rides: 58000 },
  { month: 'Aug', parcels: 168000, rides: 80600 },
]

type Filter = 'all' | 'pending' | 'paid' | 'failed'

export default function AdminPayments() {
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Settlement | null>(null)
  const debounced = useDebounced(query, 200)
  const { loading } = useLoaded(SETTLEMENTS, 700)

  const rows = useMemo(() => {
    let list = SETTLEMENTS
    if (filter !== 'all') list = list.filter((s) => s.status === filter)
    const q = debounced.trim().toLowerCase()
    if (q)
      list = list.filter(
        (s) => s.party.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
      )
    return list
  }, [filter, debounced])

  const columns: Array<Column<Settlement>> = [
    {
      key: 'id',
      header: 'Settlement',
      width: '15%',
      render: (s) => (
        <div className="min-w-0">
          <p className="tabular truncate font-bold text-ink-900">{s.id}</p>
          <p className="truncate text-[11.5px] text-ink-500">{relative(new Date(Date.now() + s.at * 3_600_000))}</p>
        </div>
      ),
    },
    {
      key: 'party',
      header: 'Payee',
      width: '22%',
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{s.party}</p>
          <p className="truncate text-[11.5px] text-ink-500">{s.kind} · {s.period}</p>
        </div>
      ),
    },
    { key: 'items', header: 'Items', width: '9%', align: 'right', render: (s) => s.items },
    { key: 'gross', header: 'Gross', width: '13%', align: 'right', render: (s) => inr(s.gross) },
    {
      key: 'commission',
      header: 'Commission',
      width: '14%',
      align: 'right',
      render: (s) => (s.commission ? `− ${inr(s.commission)}` : '—'),
    },
    {
      key: 'net',
      header: 'Net payable',
      width: '14%',
      align: 'right',
      render: (s) => <span className="font-bold text-ink-900">{inr(s.net)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '13%',
      render: (s) => (
        <AdminPill tone={s.status === 'paid' ? 'good' : s.status === 'pending' ? 'warning' : 'critical'}>
          {s.status}
        </AdminPill>
      ),
    },
  ]

  const pendingTotal = SETTLEMENTS.filter((s) => s.status === 'pending').reduce((n, s) => n + s.net, 0)

  return (
    <>
      <PageHeader
        title="Payments & settlement"
        subtitle="Driver payouts, hub fees and refunds"
        actions={
          <button
            onClick={() => toast.success('Payout batch queued', `${inr(pendingTotal)} across 2 payees`)}
            className="pressable-sm rounded-(--radius-sm) bg-action px-3.5 py-2 text-[13px] font-bold text-white shadow-(--shadow-action) hover:bg-action-hover"
          >
            Run payout batch
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi label="Gross revenue" value={compactInr(248600)} delta={{ value: '18.2%', up: true }} icon={<IndianRupee size={15} />} />
        <Kpi label="Platform commission" value={compactInr(37290)} delta={{ value: '17.4%', up: true }} icon={<Wallet size={15} />} />
        <Kpi label="Pending payouts" value={compactInr(pendingTotal)} upIsGood={false} icon={<Banknote size={15} />} />
        <Kpi label="Refunds issued" value={compactInr(4180)} delta={{ value: '3.1%', up: false }} icon={<ArrowDownLeft size={15} />} />
      </div>

      <ChartFrame
        title="Revenue by line"
        subtitle="Parcel fees against ride cost-share commission"
        className="mb-6"
        legend={[
          { label: 'Parcels', color: VIZ.series1 },
          { label: 'Rides', color: VIZ.series2 },
        ]}
        table={{
          columns: ['Month', 'Parcels', 'Rides'],
          rows: REVENUE_SPLIT.map((r) => [r.month, inr(r.parcels), inr(r.rides)]),
        }}
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={REVENUE_SPLIT} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke={VIZ.grid} strokeWidth={1} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: VIZ.axis }}
              tick={{ fill: VIZ.muted, fontSize: 11 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: VIZ.muted, fontSize: 11 }}
              tickFormatter={(v: number) => `₹${v / 1000}K`}
              width={52}
            />
            <Tooltip
              content={<VizTooltip formatter={(v) => inr(Number(v))} />}
              cursor={{ fill: 'rgba(22,80,224,0.05)' }}
            />
            <Bar dataKey="parcels" name="Parcels" fill={VIZ.series1} barSize={20} radius={[4, 4, 0, 0]} />
            <Bar dataKey="rides" name="Rides" fill={VIZ.series2} barSize={20} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <AdminCard padded={false}>
        <div className="flex items-center gap-4 border-b border-ink-200 p-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search payee or settlement ID"
            className="max-w-[300px]"
          />
          <div className="w-[340px]">
            <Segmented
              value={filter}
              onChange={setFilter}
              size="sm"
              options={[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
          </div>
          <p className="ml-auto text-[12.5px] text-ink-500">
            Showing <span className="font-bold text-ink-800">{rows.length}</span> of{' '}
            {SETTLEMENTS.length}
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
              title="No settlements match"
              body="Try a different payee, ID or status."
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
        subtitle={selected ? `${selected.party} · ${selected.kind}` : undefined}
      >
        {selected && (
          <>
            <div className="mb-5 rounded-(--radius-sm) border border-ink-100 p-4">
              <KeyValue label="Period" value={selected.period} />
              <KeyValue label="Items settled" value={String(selected.items)} />
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue label="Gross" value={inr(selected.gross)} />
              {selected.commission > 0 && (
                <KeyValue label="Platform commission (15%)" value={`− ${inr(selected.commission)}`} />
              )}
              <KeyValue label="TDS" value="—" tone="muted" />
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue label="Net payable" value={inr(selected.net)} strong />
            </div>

            <AdminPill tone={selected.status === 'paid' ? 'good' : selected.status === 'pending' ? 'warning' : 'critical'}>
              {selected.status === 'paid'
                ? 'Transferred'
                : selected.status === 'pending'
                  ? 'Queued for Monday batch'
                  : 'Bank transfer failed — retry needed'}
            </AdminPill>

            {selected.status === 'failed' && (
              <Note tone="danger" className="mt-4" title="Why it failed">
                The payee&apos;s bank returned an invalid-account error. Ask them to re-verify their
                UPI or account number before retrying.
              </Note>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              {selected.status !== 'paid' && (
                <Button
                  block
                  icon={<ArrowUpRight size={17} />}
                  onClick={() => {
                    toast.success('Payout initiated', `${inr(selected.net)} to ${selected.party}`)
                    setSelected(null)
                  }}
                >
                  Release payout now
                </Button>
              )}
              <Button variant="outline" block onClick={() => toast.info('Invoice', 'PDF emailed to the payee.')}>
                Download invoice
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </>
  )
}

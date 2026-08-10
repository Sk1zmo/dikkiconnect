import { useMemo, useState } from 'react'
import { Camera, Check, LifeBuoy, Search, ShieldCheck, X } from 'lucide-react'
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
  TextArea,
  useToast,
} from '@/components/ui'
import { inr, relative } from '@/lib/format'
import { useDebounced, useLoaded } from '@/lib/hooks'

interface Dispute {
  id: string
  parcelId: string
  raisedBy: string
  against: string
  reason: string
  detail: string
  claim: number
  status: 'open' | 'investigating' | 'resolved' | 'rejected'
  at: number
  photos: number
  otpTrail: boolean
}

const DISPUTES: Dispute[] = [
  {
    id: 'DSP-118',
    parcelId: 'DKC-4712',
    raisedBy: 'Meera Iyer',
    against: 'Koramangala Hub',
    reason: 'Parcel lost in hub',
    detail: 'Marked as received at intake but never dispatched. 74 hours in hub with no traveler assignment. Shelf D-03 reported empty on physical audit.',
    claim: 2400,
    status: 'investigating',
    at: -6,
    photos: 3,
    otpTrail: true,
  },
  {
    id: 'DSP-117',
    parcelId: 'DKC-4655',
    raisedBy: 'Aditi Sharma',
    against: 'Karthik Reddy',
    reason: 'Damaged on arrival',
    detail: 'Box crushed on one side. Intake photos show it intact; destination hub photos show damage. Contents (clothing) undamaged but sender is claiming for packaging.',
    claim: 800,
    status: 'open',
    at: -20,
    photos: 5,
    otpTrail: true,
  },
  {
    id: 'DSP-116',
    parcelId: 'DKC-4598',
    raisedBy: 'Sanjay Pillai',
    against: 'DikkiConnect',
    reason: 'Delivered to wrong person',
    detail: 'Receiver claims they never collected. Hub has OTP verification and a signature on file. Likely a family member collected without telling them.',
    claim: 1600,
    status: 'resolved',
    at: -96,
    photos: 2,
    otpTrail: true,
  },
  {
    id: 'DSP-115',
    parcelId: 'DKC-4571',
    raisedBy: 'Rhea Menon',
    against: 'Divya Nair',
    reason: 'Driver no-show',
    detail: 'Driver did not arrive at the pickup point. Passenger waited 40 minutes and booked a bus instead.',
    claim: 470,
    status: 'resolved',
    at: -140,
    photos: 0,
    otpTrail: false,
  },
  {
    id: 'DSP-114',
    parcelId: 'DKC-4520',
    raisedBy: 'Nikhil Verma',
    against: 'DikkiConnect',
    reason: 'Overcharged',
    detail: 'Sender declared 2 kg, hub weighed 4.6 kg and the fare adjusted upward. Sender disputes the scale reading.',
    claim: 120,
    status: 'rejected',
    at: -210,
    photos: 2,
    otpTrail: true,
  },
]

type Filter = 'all' | 'open' | 'investigating' | 'resolved'

export default function AdminDisputes() {
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [note, setNote] = useState('')
  const debounced = useDebounced(query, 200)
  const { loading } = useLoaded(DISPUTES, 700)

  const rows = useMemo(() => {
    let list = DISPUTES
    if (filter !== 'all') list = list.filter((d) => d.status === filter)
    const q = debounced.trim().toLowerCase()
    if (q)
      list = list.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.parcelId.toLowerCase().includes(q) ||
          d.raisedBy.toLowerCase().includes(q) ||
          d.reason.toLowerCase().includes(q),
      )
    return list
  }, [filter, debounced])

  const columns: Array<Column<Dispute>> = [
    {
      key: 'id',
      header: 'Case',
      width: '14%',
      render: (d) => (
        <div className="min-w-0">
          <p className="tabular truncate font-bold text-ink-900">{d.id}</p>
          <p className="tabular truncate text-[11.5px] text-ink-500">{d.parcelId}</p>
        </div>
      ),
    },
    {
      key: 'raisedBy',
      header: 'Raised by',
      width: '20%',
      render: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.raisedBy} size={30} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{d.raisedBy}</p>
            <p className="truncate text-[11.5px] text-ink-500">
              {relative(new Date(Date.now() + d.at * 3_600_000))}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', width: '22%', render: (d) => <span className="text-ink-800">{d.reason}</span> },
    { key: 'against', header: 'Against', width: '17%', render: (d) => <span className="text-ink-600">{d.against}</span> },
    { key: 'claim', header: 'Claim', width: '11%', align: 'right', render: (d) => inr(d.claim) },
    {
      key: 'evidence',
      header: 'Evidence',
      width: '9%',
      align: 'right',
      render: (d) => (
        <span className="inline-flex items-center gap-1 text-ink-600">
          <Camera size={12} />
          {d.photos}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '13%',
      render: (d) => (
        <AdminPill
          tone={
            d.status === 'open'
              ? 'critical'
              : d.status === 'investigating'
                ? 'warning'
                : d.status === 'resolved'
                  ? 'good'
                  : 'neutral'
          }
        >
          {d.status}
        </AdminPill>
      ),
    },
  ]

  const open = DISPUTES.filter((d) => d.status === 'open' || d.status === 'investigating').length
  const exposure = DISPUTES.filter((d) => d.status !== 'resolved' && d.status !== 'rejected').reduce(
    (n, d) => n + d.claim,
    0,
  )

  return (
    <>
      <PageHeader title="Disputes" subtitle="Claims, evidence review and resolutions" />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi label="Open cases" value={String(open)} upIsGood={false} delta={{ value: '1', up: true }} icon={<LifeBuoy size={15} />} />
        <Kpi label="Open exposure" value={inr(exposure)} upIsGood={false} />
        <Kpi label="Avg resolution time" value="19h" delta={{ value: '12%', up: false }} />
        <Kpi label="Upheld rate" value="68%" />
      </div>

      <AdminCard padded={false}>
        <div className="flex items-center gap-4 border-b border-ink-200 p-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search case, parcel or claimant"
            className="max-w-[320px]"
          />
          <div className="w-[380px]">
            <Segmented
              value={filter}
              onChange={setFilter}
              size="sm"
              options={[
                { value: 'all', label: 'All' },
                { value: 'open', label: 'Open' },
                { value: 'investigating', label: 'Investigating' },
                { value: 'resolved', label: 'Resolved' },
              ]}
            />
          </div>
          <p className="ml-auto text-[12.5px] text-ink-500">
            Showing <span className="font-bold text-ink-800">{rows.length}</span> of {DISPUTES.length}
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
              title="No disputes match"
              body="Nothing outstanding under these filters — a good sign."
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
        title={selected?.reason}
        subtitle={selected ? `${selected.id} · ${selected.parcelId}` : undefined}
        fullHeight
      >
        {selected && (
          <>
            <div className="mb-5 rounded-(--radius-sm) border border-ink-100 p-4">
              <KeyValue label="Raised by" value={selected.raisedBy} />
              <KeyValue label="Against" value={selected.against} />
              <KeyValue label="Raised" value={relative(new Date(Date.now() + selected.at * 3_600_000))} />
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue label="Claim amount" value={inr(selected.claim)} strong />
            </div>

            <p className="mb-2 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              What happened
            </p>
            <p className="mb-5 text-[13.5px] leading-[1.6] text-ink-600">{selected.detail}</p>

            <p className="mb-2.5 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              Evidence on file
            </p>
            <div className="mb-5 flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-(--radius-sm) border border-ink-100 p-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-xs) bg-ink-100 text-ink-600">
                  <Camera size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink-900">{selected.photos} handoff photos</p>
                  <p className="text-[11.5px] text-ink-500">Captured at each custody checkpoint</p>
                </div>
                <button className="pressable-sm text-[12px] font-bold text-brand-600">View</button>
              </div>
              <div className="flex items-center gap-3 rounded-(--radius-sm) border border-ink-100 p-3.5">
                <span
                  className={
                    selected.otpTrail
                      ? 'grid size-9 shrink-0 place-items-center rounded-(--radius-xs) bg-success-50 text-success-600'
                      : 'grid size-9 shrink-0 place-items-center rounded-(--radius-xs) bg-danger-50 text-danger-600'
                  }
                >
                  <ShieldCheck size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink-900">
                    {selected.otpTrail ? 'Complete OTP trail' : 'Incomplete OTP trail'}
                  </p>
                  <p className="text-[11.5px] text-ink-500">
                    {selected.otpTrail
                      ? 'Every custody transfer verified and timestamped'
                      : 'One or more checkpoints missing a verification'}
                  </p>
                </div>
              </div>
            </div>

            {selected.otpTrail && (
              <Note tone="success" className="mb-5" title="What the trail shows">
                Each handoff has a matching OTP and photo pair, so responsibility can be assigned to
                an exact party and timestamp rather than guessed at.
              </Note>
            )}

            <TextArea
              label="Resolution note"
              placeholder="Record your decision and the reasoning…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />

            <div className="mt-4 flex flex-col gap-2.5">
              <Button
                block
                icon={<Check size={17} />}
                onClick={() => {
                  toast.success('Claim upheld', `${inr(selected.claim)} refunded to ${selected.raisedBy}`)
                  setSelected(null)
                  setNote('')
                }}
              >
                Uphold claim &amp; refund {inr(selected.claim)}
              </Button>
              <Button
                variant="outline"
                block
                onClick={() => toast.info('Escalated', 'Assigned to the senior ops queue.')}
              >
                Escalate to senior ops
              </Button>
              <Button
                variant="danger"
                block
                icon={<X size={17} />}
                onClick={() => {
                  toast.warn('Claim rejected', 'The claimant has been notified with your note.')
                  setSelected(null)
                  setNote('')
                }}
              >
                Reject claim
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </>
  )
}

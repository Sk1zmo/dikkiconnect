import { useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  IndianRupee,
  PackageCheck,
  Wallet,
} from 'lucide-react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  Badge,
  Card,
  Divider,
  IconButton,
  KeyValue,
  Note,
  Segmented,
  SectionHeader,
  SkeletonList,
  Stat,
  useToast,
} from '@/components/ui'
import { HUB_HANDLING_FEE } from '@/lib/data'
import { compactInr, inr, relative } from '@/lib/format'
import { useCountUp, useLoaded } from '@/lib/hooks'
import { cn } from '@/lib/cn'

type Tab = 'activity' | 'settlement'

const LOG = [
  { id: 'l1', kind: 'in' as const, parcelId: 'DKC-4869', actor: 'Aditi S.', at: -0.5 },
  { id: 'l2', kind: 'out' as const, parcelId: 'DKC-4844', actor: 'Arjun Menon', at: -1.2 },
  { id: 'l3', kind: 'collected' as const, parcelId: 'DKC-4703', actor: 'Nikhil Verma', at: -2.4 },
  { id: 'l4', kind: 'in' as const, parcelId: 'DKC-4858', actor: 'Priya D.', at: -3.1 },
  { id: 'l5', kind: 'out' as const, parcelId: 'DKC-4802', actor: 'Sneha Bhat', at: -5.6 },
  { id: 'l6', kind: 'collected' as const, parcelId: 'DKC-4655', actor: 'Sanjay P.', at: -7.2 },
  { id: 'l7', kind: 'in' as const, parcelId: 'DKC-4851', actor: 'Meera I.', at: -11 },
]

const META = {
  in: { icon: ArrowDownToLine, label: 'Received', tone: 'brand' as const },
  out: { icon: ArrowUpFromLine, label: 'Released', tone: 'accent' as const },
  collected: { icon: PackageCheck, label: 'Collected', tone: 'success' as const },
}

const SETTLEMENTS = [
  { id: 's1', week: 'This week (in progress)', parcels: 123, amount: 1845, status: 'pending' },
  { id: 's2', week: '20 – 26 Jul', parcels: 141, amount: 2115, status: 'paid' },
  { id: 's3', week: '13 – 19 Jul', parcels: 118, amount: 1770, status: 'paid' },
  { id: 's4', week: '6 – 12 Jul', parcels: 96, amount: 1440, status: 'paid' },
]

export default function HubHistory() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('activity')
  const { loading } = useLoaded(LOG, 900)
  const total = useCountUp(7170, 1100)

  return (
    <Screen>
      <LargeTitle
        title="History"
        subtitle="Activity log and weekly settlements"
        className="pt-safe"
        action={
          <IconButton
            icon={<Download size={17} />}
            label="Export report"
            onClick={() => toast.success('Report queued', 'CSV will be emailed to you shortly.')}
          />
        }
      />

      <div className="shrink-0 px-5 pb-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'activity', label: 'Activity' },
            { value: 'settlement', label: 'Settlement' },
          ]}
        />
      </div>

      <ScreenBody>
        {tab === 'activity' ? (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2.5">
              <Stat icon={<ArrowDownToLine size={14} />} label="In today" value="23" />
              <Stat icon={<ArrowUpFromLine size={14} />} label="Out today" value="19" tone="accent" />
              <Stat
                icon={<PackageCheck size={14} />}
                label="Collected"
                value="14"
                tone="success"
              />
            </div>

            <SectionHeader title="Recent activity" subtitle="Every custody event at this hub" />

            {loading ? (
              <SkeletonList count={4} />
            ) : (
              <Card padded={false}>
                {LOG.map((entry, i) => {
                  const meta = META[entry.kind]
                  const Icon = meta.icon
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3.5',
                        i > 0 && 'border-t border-ink-100',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-10 shrink-0 place-items-center rounded-(--radius-sm)',
                          meta.tone === 'brand' && 'bg-brand-50 text-brand-600',
                          meta.tone === 'accent' && 'bg-accent-50 text-accent-600',
                          meta.tone === 'success' && 'bg-success-50 text-success-600',
                        )}
                      >
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="tabular truncate text-[13.5px] font-bold text-ink-900">
                          {entry.parcelId}
                        </p>
                        <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
                          {meta.label} · {entry.actor}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge tone={meta.tone} size="sm">
                          {meta.label}
                        </Badge>
                        <p className="mt-1 text-[10.5px] text-ink-400">
                          {relative(new Date(Date.now() + entry.at * 3_600_000))}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </Card>
            )}
          </>
        ) : (
          <>
            <Card className="brand-gradient brand-mesh border-0 text-white">
              <p className="text-[12px] font-semibold text-white/70">Total earned all time</p>
              <p className="tabular text-display mt-1 text-[34px] leading-none font-extrabold">
                {compactInr(total)}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-3.5">
                <Wallet size={15} className="shrink-0 text-white/70" />
                <p className="text-[12px] text-white/75">
                  Settled every Monday to UPI •••• @okhdfcbank
                </p>
              </div>
            </Card>

            <Note tone="brand" icon={<IndianRupee size={15} />} className="mt-3">
              You earn a flat {inr(HUB_HANDLING_FEE)} per parcel handled — no percentage cuts, so
              your income does not depend on what is inside the box.
            </Note>

            <div className="mt-6">
              <SectionHeader title="Weekly settlements" />
              <div className="flex flex-col gap-3">
                {loading ? (
                  <SkeletonList count={3} />
                ) : (
                  SETTLEMENTS.map((s) => (
                    <Card key={s.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-ink-900">{s.week}</p>
                          <p className="mt-0.5 text-[12px] text-ink-500">
                            {s.parcels} parcels handled
                          </p>
                        </div>
                        <Badge tone={s.status === 'paid' ? 'success' : 'warn'} size="sm" dot>
                          {s.status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                      <Divider className="my-3" />
                      <KeyValue
                        label={`${s.parcels} × ${inr(HUB_HANDLING_FEE)}`}
                        value={inr(s.amount)}
                        strong
                      />
                    </Card>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}

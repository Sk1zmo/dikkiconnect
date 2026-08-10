import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Box,
  ChevronRight,
  IndianRupee,
  PackageCheck,
  QrCode,
  Timer,
  UserCheck,
} from 'lucide-react'
import { Screen, ScreenBody, BrandHeader } from '@/components/layout/Screen'
import { PortalSwitcher } from '@/components/layout/PortalSwitcher'
import {
  Badge,
  Card,
  Note,
  ProgressBar,
  SectionHeader,
  SkeletonList,
  SkeletonStat,
  Stat,
} from '@/components/ui'
import { InventoryRow } from '@/components/domain/Cards'
import { HUBS } from '@/lib/data'
import { useAwaitingIntake, useHubInventory } from '@/lib/store'
import { compactInr, inr, isStale } from '@/lib/format'
import { useCountUp, useLoaded } from '@/lib/hooks'

const HUB = HUBS[0]

const ACTIONS = [
  { icon: ArrowDownToLine, label: 'Intake', to: '/hub/scan', tone: 'primary' as const },
  { icon: ArrowUpFromLine, label: 'Handoff', to: '/hub/handoff' },
  { icon: UserCheck, label: 'Receiver', to: '/hub/receiver' },
  { icon: Box, label: 'Inventory', to: '/hub/inventory' },
]

export default function HubHome() {
  const navigate = useNavigate()
  // Live shelves: whatever senders booked and this hub has taken in.
  const shelved = useHubInventory()
  const awaiting = useAwaitingIntake()
  const { loading } = useLoaded(shelved, 800)

  const held = shelved.map((p) => ({
    parcelId: p.id,
    shelf: `A-${String((p.id.charCodeAt(p.id.length - 1) % 12) + 1).padStart(2, '0')}`,
    intakeAt: p.timeline.find((e) => e.status === 'at_origin_hub')?.at ?? p.bookedAt,
    state: (p.travelerId ? 'assigned' : 'waiting') as 'assigned' | 'waiting',
  }))
  const aging = held.filter((i) => isStale(i.intakeAt))
  const revenue = useCountUp(1840, 1100)
  const loadPct = Math.round((HUB.held / HUB.capacity) * 100)

  return (
    <Screen>
      <BrandHeader className="pt-safe">
        <div className="mb-4">
          <PortalSwitcher />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-white/65">Hub manager</p>
            <p className="text-display truncate text-[20px] font-extrabold">
              {HUB.name.split('·').pop()?.trim()}
            </p>
            <p className="mt-1 truncate text-[11.5px] text-white/60">
              {HUB.manager} · open {HUB.openFrom} – {HUB.openTo}
            </p>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
            className="pressable-sm relative grid size-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur-md"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-warn-400 ring-2 ring-brand-700" />
          </button>
        </div>

        {/* Capacity */}
        <div className="mt-5 rounded-(--radius-lg) bg-white/12 p-4 ring-1 ring-white/20 backdrop-blur-md">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[12.5px] font-semibold text-white/75">Shelf capacity</p>
            <p className="tabular text-[13px] font-extrabold">
              {HUB.held} / {HUB.capacity}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-700"
              style={{ width: `${loadPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/60">
            {loadPct > 70 ? 'Running hot — prioritise outbound handoffs' : 'Comfortable load'}
          </p>
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-4 gap-2.5">
          {ACTIONS.map(({ icon: Icon, label, to, tone }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`pressable flex flex-col items-center gap-2 rounded-(--radius-md) py-3 ${
                tone === 'primary'
                  ? 'bg-white text-brand-700 shadow-(--shadow-e3)'
                  : 'bg-white/12 text-white ring-1 ring-white/15 backdrop-blur-md'
              }`}
            >
              <Icon size={19} />
              <span className="text-[10.5px] leading-none font-bold">{label}</span>
            </button>
          ))}
        </div>
      </BrandHeader>

      <ScreenBody className="pt-5">
        {/* Aging alert */}
        {aging.length > 0 && !loading && (
          <Card
            to="/hub/inventory"
            className="mb-5 flex items-center gap-3.5 border-warn-100 bg-warn-50"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-warn-500/15 text-warn-600">
              <AlertTriangle size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-warn-800">
                {aging.length} parcels held over 24 hours
              </p>
              <p className="mt-0.5 text-[12px] text-warn-700/85">
                Flag them for the next traveler or escalate to ops
              </p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-warn-600" />
          </Card>
        )}

        {/* Parcels senders have booked into this hub but not yet dropped */}
        {awaiting.length > 0 && !loading && (
          <Card
            to="/hub/scan"
            className="mb-5 flex items-center gap-3.5 border-brand-100 bg-brand-50"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-500/15 text-brand-600">
              <ArrowDownToLine size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-brand-800">
                {awaiting.length} parcel{awaiting.length > 1 ? 's' : ''} expected today
              </p>
              <p className="mt-0.5 text-[12px] text-brand-700/85">
                Booked by senders · scan to weigh, photograph and take custody
              </p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-brand-600" />
          </Card>
        )}

        {/* Today */}
        <SectionHeader title="Today at a glance" subtitle="Since opening" />
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={<ArrowDownToLine size={15} />}
              label="Parcels received"
              value="23"
              delta={{ value: '18%', up: true }}
            />
            <Stat
              icon={<ArrowUpFromLine size={15} />}
              label="Dispatched"
              value="19"
              tone="success"
              delta={{ value: '9%', up: true }}
            />
            <Stat
              icon={<PackageCheck size={15} />}
              label="Collected by receivers"
              value="14"
              tone="accent"
            />
            <Stat
              icon={<IndianRupee size={15} />}
              label="Handling fees"
              value={compactInr(revenue)}
              tone="warn"
              delta={{ value: '12%', up: true }}
            />
          </div>
        )}

        {/* Dispatch SLA */}
        <Card className="mt-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer size={15} className="text-ink-400" />
              <p className="text-[13px] font-bold text-ink-900">Drop-to-dispatch</p>
            </div>
            <p className="tabular text-[13px] font-extrabold text-success-600">2h 40m avg</p>
          </div>
          <ProgressBar value={67} tone="success" />
          <p className="mt-2 text-[11.5px] text-ink-500">
            Target is under 4 hours. You are comfortably inside it this week.
          </p>
        </Card>

        {/* Incoming queue */}
        <div className="mt-7">
          <SectionHeader
            title="Held inventory"
            subtitle={`${held.length} parcels on your shelves`}
            action="Manage"
            to="/hub/inventory"
          />
          {loading ? (
            <SkeletonList count={3} />
          ) : (
            <Card padded={false}>
              {held.slice(0, 4).map((item, i) => (
                <div key={item.parcelId} className={i > 0 ? 'border-t border-ink-100' : ''}>
                  <InventoryRow
                    {...item}
                    onClick={() => navigate(`/hub/intake/${item.parcelId}`)}
                  />
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Expected travelers */}
        <div className="mt-7">
          <SectionHeader title="Travelers expected" subtitle="Next 3 hours" />
          <Card padded={false}>
            {[
              { name: 'Arjun Menon', at: '2:30 PM', parcels: 3, plate: 'KA 05 MJ 4417' },
              { name: 'Sneha Bhat', at: '4:15 PM', parcels: 2, plate: 'KA 04 ME 7710' },
            ].map((t, i) => (
              <button
                key={t.name}
                onClick={() => navigate('/hub/handoff')}
                className={`pressable flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-ink-50 ${
                  i > 0 ? 'border-t border-ink-100' : ''
                }`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
                  <QrCode size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-ink-900">{t.name}</p>
                  <p className="tabular mt-0.5 truncate text-[11.5px] text-ink-500">
                    {t.plate} · {t.parcels} parcels to release
                  </p>
                </div>
                <Badge tone="brand" size="sm">
                  {t.at}
                </Badge>
              </button>
            ))}
          </Card>
        </div>

        <Note tone="brand" className="mt-6" title="Your earnings">
          You earn {inr(15)} per parcel handled. This week: {inr(1840)} across 123 parcels, settled
          every Monday to your registered UPI.
        </Note>
      </ScreenBody>
    </Screen>
  )
}

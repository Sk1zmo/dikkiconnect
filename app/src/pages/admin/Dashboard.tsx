import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowUpRight,
  Car,
  IndianRupee,
  Package,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { AdminCard, AdminPill, ChartFrame, Kpi, PageHeader, VIZ, VizTooltip } from './components'
import { Avatar, SkeletonStat } from '@/components/ui'
import { compactInr, inr, relative } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'

const REVENUE = [
  { day: '1 Jul', revenue: 18400 },
  { day: '5 Jul', revenue: 21200 },
  { day: '9 Jul', revenue: 19800 },
  { day: '13 Jul', revenue: 26400 },
  { day: '17 Jul', revenue: 24100 },
  { day: '21 Jul', revenue: 31200 },
  { day: '25 Jul', revenue: 29600 },
  { day: '29 Jul', revenue: 36800 },
  { day: '2 Aug', revenue: 41200 },
]

const VOLUME = [
  { day: '1 Jul', parcels: 84, trips: 31 },
  { day: '5 Jul', parcels: 96, trips: 36 },
  { day: '9 Jul', parcels: 89, trips: 34 },
  { day: '13 Jul', parcels: 118, trips: 44 },
  { day: '17 Jul', parcels: 108, trips: 41 },
  { day: '21 Jul', parcels: 141, trips: 52 },
  { day: '25 Jul', parcels: 134, trips: 49 },
  { day: '29 Jul', parcels: 166, trips: 61 },
  { day: '2 Aug', parcels: 184, trips: 68 },
]

const ACTIVITY = [
  { id: 'a1', who: 'Arjun Menon', what: 'picked up 3 parcels at Koramangala Hub', at: -0.3, tone: 'info' as const },
  { id: 'a2', who: 'Ravi Shetty', what: 'flagged DKC-4712 as lost after 74h in hub', at: -1.1, tone: 'critical' as const },
  { id: 'a3', who: 'Sneha Bhat', what: 'completed KYC tier 2 — passenger carrying unlocked', at: -2.4, tone: 'good' as const },
  { id: 'a4', who: 'Aditi Sharma', what: 'raised a dispute on DKC-4655', at: -3.8, tone: 'warning' as const },
  { id: 'a5', who: 'Suresh Gowda', what: 'released 6 parcels to traveler KA 03 NB 8821', at: -5.2, tone: 'info' as const },
  { id: 'a6', who: 'Karthik Reddy', what: 'RC verification failed — document unreadable', at: -6.6, tone: 'critical' as const },
]

const PENDING_OTP = [
  { id: 'DKC-4796', stage: 'Awaiting traveler pickup', hub: 'Jayanagar', mins: 42 },
  { id: 'DKC-4802', stage: 'Awaiting traveler pickup', hub: 'Koramangala', mins: 186 },
  { id: 'DKC-4779', stage: 'Awaiting receiver collection', hub: 'Vijayanagar', mins: 312 },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { loading } = useLoaded(REVENUE, 850)

  return (
    <>
      <PageHeader
        title="Operations dashboard"
        subtitle="Bangalore ↔ Mysore corridor · last 30 days"
        actions={
          <>
            <button className="pressable-sm rounded-(--radius-sm) border border-ink-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-50">
              Last 30 days
            </button>
            <button className="pressable-sm rounded-(--radius-sm) bg-action px-3.5 py-2 text-[13px] font-bold text-white shadow-(--shadow-action) hover:bg-action-hover">
              Export report
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <Kpi
              label="Gross revenue"
              value={compactInr(248600)}
              delta={{ value: '18.2%', up: true }}
              icon={<IndianRupee size={15} />}
            />
            <Kpi
              label="Parcels delivered"
              value="1,124"
              delta={{ value: '12.4%', up: true }}
              icon={<Package size={15} />}
            />
            <Kpi
              label="Trips published"
              value="416"
              delta={{ value: '9.1%', up: true }}
              icon={<Car size={15} />}
            />
            <Kpi
              label="Failed handoffs"
              value="7"
              delta={{ value: '2.3%', up: true }}
              upIsGood={false}
              icon={<AlertTriangle size={15} />}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <ChartFrame
          title="Gross revenue"
          subtitle="Daily, both revenue lines combined"
          className="col-span-2"
          table={{
            columns: ['Date', 'Revenue'],
            rows: REVENUE.map((r) => [r.day, inr(r.revenue)]),
          }}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={REVENUE} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VIZ.series1} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={VIZ.series1} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={VIZ.grid} strokeWidth={1} />
              <XAxis
                dataKey="day"
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
                cursor={{ stroke: VIZ.axis, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={VIZ.series1}
                strokeWidth={2}
                fill="url(#revFill)"
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: VIZ.surface }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        {/* Pending OTP queue */}
        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-ink-900">Pending OTP handoffs</h2>
              <p className="mt-0.5 text-[12px] text-ink-500">Custody stuck at a checkpoint</p>
            </div>
            <ShieldCheck size={17} className="text-ink-400" />
          </div>
          <ul className="flex flex-col gap-2.5">
            {PENDING_OTP.map((p) => {
              const stale = p.mins > 120
              return (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-(--radius-sm) border border-ink-100 p-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="tabular block truncate text-[13px] font-bold text-ink-900">
                      {p.id}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">
                      {p.stage} · {p.hub}
                    </span>
                  </span>
                  <AdminPill tone={stale ? 'critical' : 'warning'}>
                    {p.mins < 60 ? `${p.mins}m` : `${Math.floor(p.mins / 60)}h`}
                  </AdminPill>
                </li>
              )
            })}
          </ul>
          <button
            onClick={() => navigate('/admin/parcels')}
            className="pressable-sm mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600"
          >
            View all parcels
            <ArrowUpRight size={14} />
          </button>
        </AdminCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ChartFrame
          title="Network volume"
          subtitle="Parcels moved against trips published"
          className="col-span-2"
          legend={[
            { label: 'Parcels', color: VIZ.series1 },
            { label: 'Trips', color: VIZ.series2 },
          ]}
          table={{
            columns: ['Date', 'Parcels', 'Trips'],
            rows: VOLUME.map((v) => [v.day, v.parcels, v.trips]),
          }}
        >
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={VOLUME} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={VIZ.grid} strokeWidth={1} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: VIZ.axis }}
                tick={{ fill: VIZ.muted, fontSize: 11 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: VIZ.muted, fontSize: 11 }}
                width={44}
              />
              <Tooltip content={<VizTooltip />} cursor={{ stroke: VIZ.axis, strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="parcels"
                name="Parcels"
                stroke={VIZ.series1}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: VIZ.surface }}
              />
              <Line
                type="monotone"
                dataKey="trips"
                name="Trips"
                stroke={VIZ.series2}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: VIZ.surface }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>

        {/* Activity feed */}
        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-ink-900">Recent activity</h2>
              <p className="mt-0.5 text-[12px] text-ink-500">Across all hubs</p>
            </div>
            <Users size={17} className="text-ink-400" />
          </div>
          <ul className="flex flex-col gap-3.5">
            {ACTIVITY.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <Avatar name={a.who} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-snug text-ink-700">
                    <span className="font-bold text-ink-900">{a.who}</span> {a.what}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-400">
                    {relative(new Date(Date.now() + a.at * 3_600_000))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
    </>
  )
}

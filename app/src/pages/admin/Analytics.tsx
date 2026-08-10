import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminCard, ChartFrame, Kpi, PageHeader, VIZ, VizTooltip } from './components'
import { ProgressBar } from '@/components/ui'
import { compactInr, inr, num } from '@/lib/format'

const CITY_VOLUME = [
  { city: 'Bangalore', parcels: 684 },
  { city: 'Mysore', parcels: 512 },
  { city: 'Chennai', parcels: 218 },
  { city: 'Mangalore', parcels: 141 },
  { city: 'Coimbatore', parcels: 96 },
  { city: 'Hyderabad', parcels: 74 },
]

const DRIVER_GROWTH = [
  { month: 'Mar', drivers: 12 },
  { month: 'Apr', drivers: 24 },
  { month: 'May', drivers: 41 },
  { month: 'Jun', drivers: 68 },
  { month: 'Jul', drivers: 104 },
  { month: 'Aug', drivers: 148 },
]

const CORRIDOR_DENSITY = [
  { corridor: 'BLR → MYS', trips: 186 },
  { corridor: 'MYS → BLR', trips: 171 },
  { corridor: 'BLR → CHE', trips: 42 },
  { corridor: 'CHE → BLR', trips: 38 },
  { corridor: 'BLR → MNG', trips: 21 },
  { corridor: 'MNG → BLR', trips: 18 },
]

const HUB_PERFORMANCE = [
  { hub: 'Koramangala', parcels: 412, sla: 94, avgHours: 2.7 },
  { hub: 'Saraswathipuram', parcels: 368, sla: 91, avgHours: 3.1 },
  { hub: 'Jayanagar', parcels: 244, sla: 97, avgHours: 2.1 },
  { hub: 'Vijayanagar', parcels: 226, sla: 82, avgHours: 4.6 },
  { hub: 'Electronic City', parcels: 198, sla: 88, avgHours: 3.4 },
  { hub: 'T. Nagar', parcels: 132, sla: 76, avgHours: 5.2 },
]

/** Max value drives the sequential blue step — magnitude, one hue. */
function seqColor(value: number, max: number) {
  const idx = Math.min(VIZ.seq.length - 1, Math.floor((value / max) * VIZ.seq.length))
  return VIZ.seq[Math.max(2, idx)]
}

export default function AdminAnalytics() {
  const maxCity = Math.max(...CITY_VOLUME.map((c) => c.parcels))
  const maxCorridor = Math.max(...CORRIDOR_DENSITY.map((c) => c.trips))

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Growth, density and hub performance · last 6 months"
        actions={
          <button className="pressable-sm rounded-(--radius-sm) border border-ink-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-50">
            Last 6 months
          </button>
        }
      />

      {/* Hero + KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi label="Total parcels moved" value={num(1725)} delta={{ value: '22.4%', up: true }} hero />
        <Kpi label="Gross revenue" value={compactInr(661600)} delta={{ value: '18.2%', up: true }} />
        <Kpi label="Active drivers" value="148" delta={{ value: '42.3%', up: true }} />
        <Kpi label="Hub SLA compliance" value="89%" delta={{ value: '3.1%', up: true }} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <ChartFrame
          title="Parcel volume by city"
          subtitle="Darker means higher volume — one hue, magnitude only"
          table={{
            columns: ['City', 'Parcels'],
            rows: CITY_VOLUME.map((c) => [c.city, num(c.parcels)]),
          }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={CITY_VOLUME}
              layout="vertical"
              margin={{ top: 4, right: 44, left: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke={VIZ.grid} strokeWidth={1} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={{ stroke: VIZ.axis }}
                tick={{ fill: VIZ.muted, fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="city"
                tickLine={false}
                axisLine={false}
                tick={{ fill: VIZ.muted, fontSize: 11.5 }}
                width={96}
              />
              <Tooltip
                content={<VizTooltip formatter={(v) => `${num(Number(v))} parcels`} />}
                cursor={{ fill: 'rgba(22,80,224,0.05)' }}
              />
              <Bar dataKey="parcels" name="Parcels" barSize={20} radius={[0, 4, 4, 0]} label={{ position: 'right', fill: VIZ.muted, fontSize: 11 }}>
                {CITY_VOLUME.map((c) => (
                  <Cell key={c.city} fill={seqColor(c.parcels, maxCity)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Driver growth"
          subtitle="Verified drivers with at least one completed trip"
          table={{
            columns: ['Month', 'Drivers'],
            rows: DRIVER_GROWTH.map((d) => [d.month, d.drivers]),
          }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={DRIVER_GROWTH} margin={{ top: 12, right: 24, left: -14, bottom: 0 }}>
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
                width={44}
              />
              <Tooltip content={<VizTooltip />} cursor={{ stroke: VIZ.axis, strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="drivers"
                name="Drivers"
                stroke={VIZ.series1}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: VIZ.surface }}
                label={({ index, x, y, value }) =>
                  index === DRIVER_GROWTH.length - 1 ? (
                    <text
                      x={Number(x) - 4}
                      y={Number(y) - 12}
                      fill={VIZ.muted}
                      fontSize={12}
                      fontWeight={700}
                      textAnchor="end"
                    >
                      {value}
                    </text>
                  ) : (
                    <g />
                  )
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartFrame
          title="Corridor density"
          subtitle="Trips published per direction"
          table={{
            columns: ['Corridor', 'Trips'],
            rows: CORRIDOR_DENSITY.map((c) => [c.corridor, c.trips]),
          }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={CORRIDOR_DENSITY} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={VIZ.grid} strokeWidth={1} />
              <XAxis
                dataKey="corridor"
                tickLine={false}
                axisLine={{ stroke: VIZ.axis }}
                tick={{ fill: VIZ.muted, fontSize: 10.5 }}
                dy={6}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: VIZ.muted, fontSize: 11 }}
                width={44}
              />
              <Tooltip
                content={<VizTooltip formatter={(v) => `${v} trips`} />}
                cursor={{ fill: 'rgba(22,80,224,0.05)' }}
              />
              <Bar dataKey="trips" name="Trips" barSize={22} radius={[4, 4, 0, 0]}>
                {CORRIDOR_DENSITY.map((c) => (
                  <Cell key={c.corridor} fill={seqColor(c.trips, maxCorridor)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        {/* Hub performance — a meter table reads better than a chart here */}
        <AdminCard>
          <div className="mb-5">
            <h2 className="text-[15px] font-bold text-ink-900">Hub performance</h2>
            <p className="mt-0.5 text-[12px] text-ink-500">
              Drop-to-dispatch SLA is under 4 hours
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {HUB_PERFORMANCE.map((h) => (
              <li key={h.hub}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13px] font-bold text-ink-900">{h.hub}</span>
                  <span className="tabular shrink-0 text-[12px] text-ink-500">
                    {num(h.parcels)} parcels · {h.avgHours}h avg
                  </span>
                  <span
                    className="tabular w-9 shrink-0 text-right text-[13px] font-extrabold"
                    style={{
                      color: h.sla >= 90 ? '#006300' : h.sla >= 80 ? '#b45309' : '#d03b3b',
                    }}
                  >
                    {h.sla}%
                  </span>
                </div>
                <ProgressBar
                  value={h.sla}
                  tone={h.sla >= 90 ? 'success' : h.sla >= 80 ? 'warn' : 'danger'}
                  height={7}
                />
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-ink-100 pt-4 text-[12px] leading-relaxed text-ink-500">
            T. Nagar is the only hub materially below target. Its held inventory is aging past 24
            hours because Chennai corridor trip supply is thin — the fix is driver acquisition, not
            hub staffing.
          </p>
        </AdminCard>
      </div>

      {/* Unit economics */}
      <AdminCard className="mt-6">
        <h2 className="mb-1 text-[15px] font-bold text-ink-900">Unit economics per parcel</h2>
        <p className="mb-5 text-[12px] text-ink-500">Averaged across the Bangalore ↔ Mysore corridor</p>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Average fare', value: inr(189), tone: 'text-ink-900' },
            { label: 'Driver payout', value: `− ${inr(118)}`, tone: 'text-ink-600' },
            { label: 'Hub fees (×2)', value: `− ${inr(30)}`, tone: 'text-ink-600' },
            { label: 'Payment + GST', value: `− ${inr(12)}`, tone: 'text-ink-600' },
            { label: 'Contribution', value: inr(29), tone: 'text-[#006300]' },
          ].map((m) => (
            <div key={m.label} className="rounded-(--radius-sm) border border-ink-100 p-4">
              <p className="text-[11.5px] font-semibold text-ink-500">{m.label}</p>
              <p className={`tabular mt-1.5 text-[20px] font-extrabold ${m.tone}`}>{m.value}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </>
  )
}

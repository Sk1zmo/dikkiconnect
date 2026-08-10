import { useState, type ReactNode } from 'react'
import { Table2, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   Admin console primitives — desktop density, same blue system.

   Chart palette follows the validated data-viz slots:
     series 1  #2a78d6 (blue)     series 2  #eb6834 (orange)
   Sequential magnitude uses the blue ramp. Status colors are reserved and
   never reused as a series.
   ═══════════════════════════════════════════════════════════════════════════ */

export const VIZ = {
  series1: '#2a78d6',
  series2: '#eb6834',
  series3: '#1baf7a',
  grid: '#e2e7f2',
  axis: '#cbd3e4',
  muted: '#6b7896',
  surface: '#ffffff',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  seq: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#2a78d6', '#256abf', '#184f95'],
} as const

export function AdminCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section
      className={cn(
        'rounded-(--radius-lg) border border-ink-200 bg-white shadow-(--shadow-e1)',
        padded && 'p-5',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-6">
      <div className="min-w-0">
        <h1 className="text-display text-[26px] font-extrabold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </header>
  )
}

/** KPI tile. Delta color is direction × whether up is good. */
export function Kpi({
  label,
  value,
  delta,
  upIsGood = true,
  icon,
  hero,
}: {
  label: string
  value: string
  delta?: { value: string; up: boolean }
  upIsGood?: boolean
  icon?: ReactNode
  hero?: boolean
}) {
  const good = delta ? delta.up === upIsGood : true
  return (
    <AdminCard>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-semibold text-ink-500">{label}</p>
        {icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-(--radius-xs) bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          'text-display mt-2.5 leading-none font-extrabold text-ink-900',
          hero ? 'text-[42px]' : 'text-[27px]',
        )}
      >
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            'mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-bold',
            good ? 'text-[#006300]' : 'text-[#d03b3b]',
          )}
        >
          {delta.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta.value}
          <span className="font-medium text-ink-400">vs last month</span>
        </p>
      )}
    </AdminCard>
  )
}

/** Chart frame with an accessible table fallback — the relief rule, built in. */
export function ChartFrame({
  title,
  subtitle,
  legend,
  children,
  table,
  className,
}: {
  title: string
  subtitle?: string
  legend?: Array<{ label: string; color: string }>
  children: ReactNode
  table?: { columns: string[]; rows: Array<Array<string | number>> }
  className?: string
}) {
  const [showTable, setShowTable] = useState(false)

  return (
    <AdminCard className={className}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12px] text-ink-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {legend && legend.length > 1 && (
            <ul className="flex items-center gap-4">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-1.5">
                  <span
                    className="block size-2.5 rounded-full"
                    style={{ background: l.color }}
                    aria-hidden
                  />
                  <span className="text-[12px] font-medium text-ink-600">{l.label}</span>
                </li>
              ))}
            </ul>
          )}
          {table && (
            <button
              onClick={() => setShowTable((v) => !v)}
              aria-pressed={showTable}
              className={cn(
                'pressable-sm inline-flex items-center gap-1.5 rounded-(--radius-xs) border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors',
                showTable
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-ink-200 text-ink-500 hover:bg-ink-50',
              )}
            >
              <Table2 size={13} />
              {showTable ? 'Chart' : 'Table'}
            </button>
          )}
        </div>
      </div>

      {showTable && table ? (
        <div className="scroll-slim max-h-[280px] overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-ink-200">
                {table.columns.map((c, i) => (
                  <th
                    key={c}
                    className={cn(
                      'pb-2 text-[11px] font-bold tracking-wide text-ink-500 uppercase',
                      i > 0 && 'text-right',
                    )}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-ink-100 last:border-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        'py-2 text-[13px] text-ink-800',
                        j === 0 ? 'font-semibold' : 'tabular text-right',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </AdminCard>
  )
}

/** Recharts tooltip styled to match the console. */
export function VizTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string }>
  label?: string | number
  formatter?: (v: number | string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-(--radius-sm) border border-ink-200 bg-white px-3 py-2.5 shadow-(--shadow-e3)">
      <p className="mb-1.5 text-[11.5px] font-bold text-ink-900">{label}</p>
      <ul className="flex flex-col gap-1">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-[12px]">
            <span
              className="block size-2 shrink-0 rounded-full"
              style={{ background: p.color }}
              aria-hidden
            />
            <span className="text-ink-500 capitalize">{p.name}</span>
            <span className="tabular ml-auto pl-3 font-bold text-ink-900">
              {formatter && p.value != null ? formatter(p.value) : p.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Data table ───────────────────────────────────────────────────────────── */

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  loading,
  empty,
}: {
  columns: Array<Column<T>>
  rows: T[]
  onRowClick?: (row: T) => void
  loading?: boolean
  empty?: ReactNode
}) {
  if (loading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-ink-100 px-5 py-4">
            {columns.map((c) => (
              <span
                key={c.key}
                className="skeleton block h-3.5 rounded"
                style={{ width: c.width ?? '14%' }}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) return <div className="px-5 py-16 text-center">{empty}</div>

  return (
    <div className="scroll-slim overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50/60">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-5 py-3 text-[11px] font-bold tracking-wide whitespace-nowrap text-ink-500 uppercase',
                  c.align === 'right' && 'text-right',
                )}
                style={{ width: c.width }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-ink-100 transition-colors last:border-0',
                onRowClick && 'cursor-pointer hover:bg-brand-50/40',
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-5 py-3.5 align-middle text-[13px] text-ink-800',
                    c.align === 'right' && 'tabular text-right',
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Status pill for admin tables — reserved status colors, always with a label. */
export function AdminPill({
  tone,
  children,
}: {
  tone: 'good' | 'warning' | 'critical' | 'neutral' | 'info'
  children: ReactNode
}) {
  const tones = {
    good: 'bg-success-50 text-success-700 ring-success-100',
    warning: 'bg-warn-50 text-warn-700 ring-warn-100',
    critical: 'bg-danger-50 text-danger-700 ring-danger-100',
    neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
    info: 'bg-brand-50 text-brand-700 ring-brand-100',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ring-1 ring-inset',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

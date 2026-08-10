import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ═══ Divider ══════════════════════════════════════════════════════════════ */

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) return <div className={cn('h-px w-full bg-ink-200', className)} />
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="text-[12px] font-medium text-ink-400">{label}</span>
      <span className="h-px flex-1 bg-ink-200" />
    </div>
  )
}

/* ═══ List row ═════════════════════════════════════════════════════════════ */

export function ListRow({
  icon,
  iconTone = 'brand',
  title,
  subtitle,
  value,
  valueTone,
  chevron,
  onClick,
  to,
  trailing,
  className,
}: {
  icon?: ReactNode
  iconTone?: 'brand' | 'neutral' | 'success' | 'warn' | 'danger'
  title: ReactNode
  subtitle?: ReactNode
  value?: ReactNode
  valueTone?: 'default' | 'success' | 'danger'
  chevron?: boolean
  onClick?: () => void
  to?: string
  trailing?: ReactNode
  className?: string
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    neutral: 'bg-ink-100 text-ink-600',
    success: 'bg-success-50 text-success-600',
    warn: 'bg-warn-50 text-warn-600',
    danger: 'bg-danger-50 text-danger-600',
  }

  const inner = (
    <>
      {icon && (
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-(--radius-sm)', tones[iconTone])}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-ink-800">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-[12px] text-ink-500">{subtitle}</span>
        )}
      </span>
      {value != null && (
        <span
          className={cn(
            'tabular shrink-0 text-[14px] font-bold',
            valueTone === 'success'
              ? 'text-success-600'
              : valueTone === 'danger'
                ? 'text-danger-600'
                : 'text-ink-800',
          )}
        >
          {value}
        </span>
      )}
      {trailing}
      {chevron && <ChevronRight size={17} className="shrink-0 text-ink-300" />}
    </>
  )

  const classes = cn(
    'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
    (onClick || to) && 'pressable cursor-pointer hover:bg-ink-50',
    className,
  )

  if (to) return <Link to={to} className={classes}>{inner}</Link>
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={classes}>
        {inner}
      </button>
    )
  return <div className={classes}>{inner}</div>
}

/* ═══ Stat tile ════════════════════════════════════════════════════════════ */

export function Stat({
  icon,
  label,
  value,
  delta,
  tone = 'brand',
  className,
  onClick,
}: {
  icon?: ReactNode
  label: string
  value: ReactNode
  delta?: { value: string; up: boolean }
  tone?: 'brand' | 'success' | 'warn' | 'danger' | 'accent'
  className?: string
  onClick?: () => void
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    warn: 'bg-warn-50 text-warn-600',
    danger: 'bg-danger-50 text-danger-600',
    accent: 'bg-accent-50 text-accent-600',
  }
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'rounded-(--radius-lg) border border-ink-100 bg-white p-3.5 text-left shadow-(--shadow-e1)',
        onClick && 'pressable hover:border-brand-200',
        className,
      )}
    >
      {icon && (
        <span className={cn('mb-2.5 grid size-8 place-items-center rounded-(--radius-xs)', tones[tone])}>
          {icon}
        </span>
      )}
      <p className="tabular text-display text-[21px] leading-none font-extrabold text-ink-900">
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <p className="truncate text-[11.5px] font-medium text-ink-500">{label}</p>
        {delta && (
          <span
            className={cn(
              'shrink-0 text-[11px] font-bold',
              delta.up ? 'text-success-600' : 'text-danger-600',
            )}
          >
            {delta.up ? '▲' : '▼'} {delta.value}
          </span>
        )}
      </div>
    </Comp>
  )
}

/* ═══ Progress ═════════════════════════════════════════════════════════════ */

export function ProgressBar({
  value,
  tone = 'brand',
  height = 6,
  className,
}: {
  value: number
  tone?: 'brand' | 'success' | 'warn' | 'danger'
  height?: number
  className?: string
}) {
  const tones = {
    brand: 'bg-brand-600',
    success: 'bg-success-500',
    warn: 'bg-warn-500',
    danger: 'bg-danger-500',
  }
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-ink-200', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-(--ease-out-expo)', tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

/** Numbered step indicator for multi-step flows. */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: string[]
  current: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                'h-1 rounded-full transition-colors duration-400',
                done || active ? 'bg-brand-600' : 'bg-ink-200',
              )}
            />
            <span
              className={cn(
                'truncate text-[10.5px] font-semibold transition-colors',
                active ? 'text-brand-700' : done ? 'text-ink-500' : 'text-ink-400',
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ═══ Floating action button ═══════════════════════════════════════════════ */

export function Fab({
  icon,
  label,
  onClick,
  to,
  className,
}: {
  icon: ReactNode
  label?: string
  onClick?: () => void
  to?: string
  className?: string
}) {
  const classes = cn(
    'pressable focus-ring absolute right-5 z-40 inline-flex items-center gap-2 rounded-full bg-action text-white shadow-(--shadow-action) hover:bg-action-hover',
    label ? 'h-13 px-5' : 'size-14 justify-center',
    className,
  )
  const inner = (
    <>
      {icon}
      {label && <span className="text-[14px] font-bold">{label}</span>}
    </>
  )
  if (to)
    return (
      <Link to={to} className={classes} aria-label={label}>
        {inner}
      </Link>
    )
  return (
    <button onClick={onClick} className={classes} aria-label={label}>
      {inner}
    </button>
  )
}

/* ═══ Key/value row for receipts & breakdowns ══════════════════════════════ */

export function KeyValue({
  label,
  value,
  strong,
  tone,
  className,
}: {
  label: ReactNode
  value: ReactNode
  strong?: boolean
  tone?: 'default' | 'success' | 'danger' | 'muted'
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-1.5', className)}>
      <span
        className={cn(
          'text-[13px]',
          strong ? 'font-bold text-ink-900' : 'text-ink-500',
          tone === 'muted' && 'text-ink-400',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular shrink-0 text-[13.5px]',
          strong ? 'text-[16px] font-extrabold text-ink-900' : 'font-semibold text-ink-800',
          tone === 'success' && 'text-success-600',
          tone === 'danger' && 'text-danger-600',
          tone === 'muted' && 'font-medium text-ink-400',
        )}
      >
        {value}
      </span>
    </div>
  )
}

/* ═══ Route pill: "Bangalore → Mysore" ═════════════════════════════════════ */

export function RoutePill({
  from,
  to,
  className,
  tone = 'light',
}: {
  from: string
  to: string
  className?: string
  tone?: 'light' | 'dark'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[13px] font-semibold',
        tone === 'dark' ? 'text-white/90' : 'text-ink-700',
        className,
      )}
    >
      <span className="truncate">{from}</span>
      <svg viewBox="0 0 20 8" className="h-2 w-5 shrink-0" fill="none">
        <path
          d="M0 4h17M14 1l3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
      </svg>
      <span className="truncate">{to}</span>
    </span>
  )
}

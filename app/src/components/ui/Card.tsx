import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Elevation = 0 | 1 | 2 | 3

const ELEVATION: Record<Elevation, string> = {
  0: '',
  1: '',
  2: '',
  3: 'shadow-(--shadow-e3)',
}

export interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  to?: string
  elevation?: Elevation
  bordered?: boolean
  padded?: boolean
  interactive?: boolean
}

export function Card({
  children,
  className,
  onClick,
  to,
  elevation = 1,
  bordered = true,
  padded = true,
  interactive,
}: CardProps) {
  const clickable = Boolean(onClick || to || interactive)
  const classes = cn(
    'block rounded-(--radius-lg) bg-white text-left',
    bordered && 'border border-ink-200',
    ELEVATION[elevation],
    padded && 'p-4',
    clickable && 'springy focus-ring cursor-pointer hover:bg-ink-50',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, 'w-full')}>
        {children}
      </button>
    )
  }
  return <div className={classes}>{children}</div>
}

/** Section header with an optional trailing action. */
export function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
  to,
  className,
}: {
  title: string
  subtitle?: string
  action?: string
  onAction?: () => void
  to?: string
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-display text-[17px] font-bold tracking-title text-ink-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-500">{subtitle}</p>}
      </div>
      {action &&
        (to ? (
          <Link
            to={to}
            className="pressable-sm shrink-0 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            {action}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="pressable-sm shrink-0 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            {action}
          </button>
        ))}
    </div>
  )
}

/** Content block with a soft brand wash — used for tips, notes, disclosures. */
export function Note({
  icon,
  title,
  children,
  tone = 'brand',
  className,
}: {
  icon?: ReactNode
  title?: string
  children: ReactNode
  tone?: 'brand' | 'warn' | 'danger' | 'success' | 'neutral'
  className?: string
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-800 border-brand-100',
    warn: 'bg-warn-50 text-warn-700 border-warn-100',
    danger: 'bg-danger-50 text-danger-700 border-danger-100',
    success: 'bg-success-50 text-success-700 border-success-100',
    neutral: 'bg-ink-50 text-ink-700 border-ink-200',
  }
  return (
    <div
      className={cn(
        'flex gap-2.5 rounded-(--radius-md) border p-3.5 text-[12.5px] leading-[1.55]',
        tones[tone],
        className,
      )}
    >
      {icon && <span className="mt-px shrink-0">{icon}</span>}
      <div className="min-w-0">
        {title && <p className="mb-0.5 font-bold">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  )
}

/** Rounded container that groups list rows with dividers. */
export function Group({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-(--radius-lg) border border-ink-200 bg-white',
        '[&>*+*]:border-t [&>*+*]:border-ink-100',
        className,
      )}
    >
      {children}
    </div>
  )
}

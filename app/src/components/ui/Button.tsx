import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

type Variant =
  | 'primary'
  | 'brand'
  | 'secondary'
  | 'tonal'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'onBrand'
type Size = 'sm' | 'md' | 'lg'

/**
 * `primary` is near-black — the committed action on any screen.
 * `brand` is the blue one, kept for the rare place where the action *is* the
 * brand (upgrade prompts, on-colour surfaces). Everything else is quiet.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-action text-white shadow-(--shadow-action) hover:bg-action-hover active:bg-action-hover disabled:shadow-none',
  brand:
    'bg-brand-600 text-white shadow-(--shadow-brand) hover:bg-brand-700 active:bg-brand-700 disabled:shadow-none',
  secondary: 'bg-ink-100 text-ink-800 hover:bg-ink-200',
  tonal: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100',
  outline: 'bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 shadow-(--shadow-e1)',
  danger: 'bg-danger-50 text-danger-600 hover:bg-danger-100',
  onBrand: 'bg-white text-action shadow-(--shadow-e3) hover:bg-ink-50',
}

/** Variants that paint a dark field, so the spinner has to invert. */
const DARK_VARIANTS = new Set<Variant>(['primary', 'brand'])

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-(--radius-sm)',
  md: 'h-12 px-5 text-[15px] gap-2 rounded-(--radius-md)',
  lg: 'h-[56px] px-6 text-[16px] gap-2.5 rounded-(--radius-lg)',
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  to?: string
  pill?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  icon,
  iconRight,
  to,
  pill,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cn(
    'springy focus-ring relative inline-flex select-none items-center justify-center font-semibold tracking-[-0.01em]',
    'disabled:pointer-events-none disabled:opacity-45',
    // Dark fields get a light sweep on hover — reads as a physical surface.
    DARK_VARIANTS.has(variant) && 'sheen',
    SIZES[size],
    VARIANTS[variant],
    pill && 'rounded-full',
    block && 'w-full',
    className,
  )

  const inner = (
    <>
      {loading ? (
        <Spinner size={size === 'lg' ? 20 : 17} tone={DARK_VARIANTS.has(variant) ? 'light' : 'ink'} />
      ) : (
        icon
      )}
      {children}
      {iconRight && !loading && <span className="ml-auto pl-1">{iconRight}</span>}
    </>
  )

  if (to && !disabled && !loading) {
    return (
      <Link to={to} className={classes}>
        {inner}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  )
}

/** Circular icon-only button used in top bars and map overlays. */
export function IconButton({
  icon,
  label,
  tone = 'default',
  size = 40,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode
  label: string
  tone?: 'default' | 'onBrand' | 'solid' | 'glass'
  size?: number
}) {
  const tones = {
    default: 'bg-white text-ink-700 shadow-(--shadow-e1) border border-ink-100 hover:bg-ink-50',
    onBrand: 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-md',
    solid: 'bg-brand-600 text-white shadow-(--shadow-brand-sm) hover:bg-brand-700',
    glass: 'glass text-ink-800 shadow-(--shadow-e2) hover:bg-white/85',
  }
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'springy-sm focus-ring inline-flex shrink-0 items-center justify-center rounded-full transition-colors',
        tones[tone],
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      {icon}
    </button>
  )
}

/** Sticky action bar pinned above the bottom nav / safe area. */
export function ActionBar({
  children,
  helper,
  className,
}: {
  children: ReactNode
  helper?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'glass pb-safe-4 sticky bottom-0 z-30 border-t border-ink-200/70 px-5 pt-3',
        className,
      )}
    >
      {helper && <div className="mb-2.5">{helper}</div>}
      {children}
    </div>
  )
}

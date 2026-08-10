import { forwardRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   Screen chrome: top bars, scroll container, page transition wrapper.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Standard app bar. `floating` overlays it on hero imagery/maps. */
export function TopBar({
  title,
  subtitle,
  back = true,
  backTo,
  action,
  tone = 'light',
  floating,
  bordered,
  className,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  back?: boolean
  backTo?: string
  action?: ReactNode
  tone?: 'light' | 'dark' | 'transparent'
  floating?: boolean
  bordered?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  const onBrand = tone === 'dark'

  return (
    <header
      className={cn(
        'z-40 flex shrink-0 items-center gap-3 px-4 py-3',
        floating ? 'absolute inset-x-0 top-0' : 'relative',
        tone === 'light' && !floating && 'bg-ink-50',
        bordered && 'border-b border-ink-200',
        className,
      )}
    >
      {back ? (
        <button
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          aria-label="Go back"
          className={cn(
            'pressable-sm focus-ring grid size-10 shrink-0 place-items-center rounded-full transition-colors',
            onBrand
              ? 'bg-white/15 text-white backdrop-blur-md hover:bg-white/25'
              : 'bg-white text-ink-800 shadow-(--shadow-e1) ring-1 ring-ink-100 hover:bg-ink-50',
          )}
        >
          <ArrowLeft size={19} strokeWidth={2.2} />
        </button>
      ) : (
        <span className="size-10 shrink-0" />
      )}

      <div className="min-w-0 flex-1 text-center">
        {title && (
          <h1
            className={cn(
              'text-display truncate text-[16.5px] font-bold',
              onBrand ? 'text-white' : 'text-ink-900',
            )}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p className={cn('truncate text-[11.5px]', onBrand ? 'text-white/70' : 'text-ink-500')}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex min-w-10 shrink-0 items-center justify-end gap-2">{action}</div>
    </header>
  )
}

/** Large-title header used on tab roots (Bookings, Wallet, Profile…). */
export function LargeTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        <h1 className="text-display text-[27px] font-extrabold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2 pt-1.5">{action}</div>}
    </div>
  )
}

/** Scrollable body. Every screen uses exactly one. */
export const ScreenBody = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string; padded?: boolean }
>(function ScreenBody({ children, className, padded = true }, ref) {
  return (
    <div ref={ref} className={cn('device-scroll flex-1', padded && 'px-5 pb-6', className)}>
      {children}
    </div>
  )
})

/** Root wrapper — column layout that fills the shell. */
export function Screen({
  children,
  className,
  tone = 'light',
}: {
  children: ReactNode
  className?: string
  tone?: 'light' | 'brand' | 'dark' | 'white'
}) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col',
        tone === 'light' && 'bg-ink-50',
        tone === 'white' && 'bg-white',
        tone === 'brand' && 'brand-gradient brand-mesh',
        tone === 'dark' && 'bg-ink-950',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ── Page transition ──────────────────────────────────────────────────────── */

/**
 * Pages arrive on a spring with a slight scale-up, so a push reads as the new
 * screen coming *toward* you rather than a crossfade. Exit is faster than
 * entry — the outgoing screen should never hold up the incoming one.
 */
const VARIANTS = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.99 },
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="flex h-full min-h-0 flex-col"
      variants={VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.75 }}
    >
      {children}
    </motion.div>
  )
}

/** Blue hero header used on role home screens. */
export function BrandHeader({
  children,
  className,
  rounded = true,
}: {
  children: ReactNode
  className?: string
  rounded?: boolean
}) {
  return (
    <div
      className={cn(
        'dusk-gradient brand-mesh relative shrink-0 px-5 pt-5 pb-6 text-white',
        rounded && 'rounded-b-[28px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

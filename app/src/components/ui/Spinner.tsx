import { cn } from '@/lib/cn'
import { LogoMark } from '@/components/brand/Logo'

const TONES = {
  brand: 'border-brand-600/25 border-t-brand-600',
  light: 'border-white/30 border-t-white',
  ink: 'border-ink-300/50 border-t-ink-600',
} as const

export function Spinner({
  size = 20,
  tone = 'brand',
  className,
}: {
  size?: number
  tone?: keyof typeof TONES
  className?: string
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('anim-spin inline-block shrink-0 rounded-full border-2', TONES[tone], className)}
      style={{ width: size, height: size }}
    />
  )
}

/** Three-dot loader for chat typing indicators. */
export function DotLoader({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label="Typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="anim-breathe block size-1.5 rounded-full bg-ink-400"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  )
}

/** Full-screen branded loader — the route-level Suspense fallback. */
export function ScreenLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="relative grid size-14 place-items-center">
        <span className="anim-ping absolute inset-0 rounded-full bg-brand-500/25" />
        <span className="brand-gradient relative grid size-11 place-items-center rounded-2xl shadow-(--shadow-brand)">
          <LogoMark size={25} tone="white" />
        </span>
      </div>
      <p className="text-[13px] font-medium text-ink-500">{label}…</p>
    </div>
  )
}

/** Indeterminate top progress line — shown during route transitions. */
export function RouteProgress() {
  return (
    <div className="fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden bg-transparent">
      <div className="anim-progress h-full w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
    </div>
  )
}

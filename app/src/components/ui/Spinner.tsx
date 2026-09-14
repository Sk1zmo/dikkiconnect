import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { LOADING, TIPS, type LoadingContext } from '@/lib/copy'
import { MARK_DOT, MARK_PATH } from '@/components/brand/Logo'

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

/**
 * The brand's loader: the mark drawing itself as a road, over and over, the
 * dot landing at its end each time. Pure CSS, so it paints before whatever it
 * is waiting for arrives.
 */
export function MarkLoader({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <path
        d={MARK_PATH}
        pathLength={1}
        fill="none"
        stroke="var(--color-brand-600)"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="anim-draw-loop"
      />
      <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill="var(--color-brand-400)" className="anim-dot-land" />
    </svg>
  )
}

/**
 * Full-screen branded loader — the route-level Suspense fallback, and the
 * loading state of any screen that has nothing to show yet.
 *
 * It says what it is doing. `context` picks the line from lib/copy so
 * "Finding the closest hubs" appears where hubs are being found and
 * "Talking to your bank" where money is moving; a wait you understand is a
 * wait you tolerate. The mark draws itself above it — the same road the
 * opening ends on, so the wait and the app are visibly one product.
 *
 * Pure CSS: it has to paint before the route chunk it is waiting for arrives,
 * so it cannot depend on anything that ships in that chunk.
 */
export function ScreenLoader({
  label,
  context = 'screen',
  compact,
  tips = true,
}: {
  label?: string
  context?: LoadingContext
  compact?: boolean
  /** A small true line under the loader once the wait has lasted a beat. */
  tips?: boolean
}) {
  const copy = LOADING[context]
  const line = label ?? copy.line
  const tip = useTip(tips)
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center gap-4 px-8 text-center',
        compact ? 'min-h-[220px] py-8' : 'min-h-[60vh]',
      )}
      role="status"
      aria-live="polite"
    >
      <MarkLoader size={compact ? 34 : 44} />
      <div>
        <p className="text-[14px] font-bold text-ink-800">{line}…</p>
        {!label && copy.sub && <p className="mt-1 text-[12.5px] text-ink-500">{copy.sub}</p>}
      </div>
      <span className="h-px w-24 overflow-hidden bg-ink-200" aria-hidden>
        <span className="anim-track block h-full w-1/3 bg-brand-600" />
      </span>
      {tip && (
        <p
          key={tip}
          className="anim-fade-up mt-2 max-w-[300px] text-[12px] leading-[1.55] text-ink-400"
          aria-live="off"
        >
          {tip}
        </p>
      )}
    </div>
  )
}

/** A tip after TIP_AFTER_MS, a new one every TIP_EVERY_MS. Starts at a random one so a long session does not always open on the first. */
const TIP_AFTER_MS = 1400
const TIP_EVERY_MS = 4000
function useTip(enabled: boolean) {
  const [tip, setTip] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    let i = Math.floor(Math.random() * TIPS.length)
    const start = setTimeout(() => {
      setTip(TIPS[i])
      const every = setInterval(() => {
        i = (i + 1) % TIPS.length
        setTip(TIPS[i])
      }, TIP_EVERY_MS)
      cleanup = () => clearInterval(every)
    }, TIP_AFTER_MS)
    let cleanup = () => {}
    return () => {
      clearTimeout(start)
      cleanup()
    }
  }, [enabled])
  return tip
}

/** Indeterminate top progress line — shown during route transitions. */
export function RouteProgress() {
  return (
    <div className="fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden bg-transparent">
      <div className="anim-progress h-full w-full bg-brand-600" />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { LOADING, QUOTE_FAMILY, QUOTES, type LoadingContext, type QuoteFamily } from '@/lib/copy'
import { WaitMark } from '@/components/brand/WaitMark'
import { MARK_PATH, MARK_STROKE } from '@/components/brand/Logo'

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
 * The brand's loader: the mark drawing itself as a road, over and over.
 * Pure CSS, so it paints before whatever it is waiting for arrives.
 */
export function MarkLoader({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <path
        d={MARK_PATH}
        pathLength={1}
        fill="none"
        stroke="var(--color-brand-600)"
        strokeWidth={MARK_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="anim-draw-loop"
      />
    </svg>
  )
}

/**
 * Full-screen branded loader — the route-level Suspense fallback, and the
 * loading state of any screen that has nothing to show yet.
 *
 * Two lines and a mark. The first line says what is happening: `context`
 * picks it from lib/copy, so "Finding the closest hubs" appears where hubs
 * are being found and "Talking to your bank" where money is moving. A wait
 * you understand is a wait you tolerate. Under it, a quote — short enough to
 * finish at a glance, rotating so a long wait is not one line staring back.
 *
 * Above both, WaitMark: a parcel riding a road that draws itself. It replaced
 * a blue pixel dissolve that played on every route change; this plays only
 * when there is something to wait for.
 *
 * ── The delay is the feature ──────────────────────────────────────────────
 * Nothing paints for the first `delay` ms. Most waits in this app resolve
 * inside that window, and the user sees the next screen with no loader at
 * all — which is what makes navigation feel instant. The loader is for the
 * waits that are genuinely long, and showing it for the short ones is what
 * would make a fast app look slow.
 *
 * Pure CSS below the gate: it has to paint before the route chunk it is
 * waiting for arrives, so it cannot depend on anything inside that chunk.
 */
export function ScreenLoader({
  label,
  context = 'screen',
  compact,
  quote = true,
  delay = 350,
}: {
  label?: string
  context?: LoadingContext
  compact?: boolean
  /** The rotating line under the mark. Off where the wait is its own screen. */
  quote?: boolean
  /** Hold before anything paints. 0 where the loader IS the screen. */
  delay?: number
}) {
  const copy = LOADING[context]
  const line = label ?? copy.line
  const shown = useAfter(delay)
  const quoteLine = useQuote(QUOTE_FAMILY[context], quote && shown)

  /* The gate. An empty box of the right height, so nothing jumps when the
     loader does arrive and nothing flashes when it does not. */
  if (!shown) return <div className={compact ? 'min-h-[220px]' : 'min-h-[60vh]'} aria-hidden />

  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center gap-5 px-8 text-center',
        compact ? 'min-h-[220px] py-8' : 'min-h-[60vh]',
      )}
      role="status"
      aria-live="polite"
    >
      <WaitMark size={compact ? 72 : 96} />
      <div>
        <p className="text-[15px] font-bold tracking-title text-ink-800">{line}…</p>
        {!label && copy.sub && <p className="mt-1 text-[12.5px] text-ink-500">{copy.sub}</p>}
      </div>
      {quoteLine && (
        /* Keyed on the line so each new quote replays the entrance rather
           than swapping in place. */
        <p
          key={quoteLine}
          className="anim-quote-in max-w-[280px] text-[13px] leading-[1.5] font-medium text-ink-600"
          aria-live="off"
        >
          {quoteLine}
        </p>
      )}
    </div>
  )
}

/** True once `ms` has passed since mount. `0` is true on the first paint. */
function useAfter(ms: number) {
  const [past, setPast] = useState(ms <= 0)
  useEffect(() => {
    if (ms <= 0) return
    setPast(false)
    const t = setTimeout(() => setPast(true), ms)
    return () => clearTimeout(t)
  }, [ms])
  return past
}

/* A quote straight away — the loader has already waited out its own gate by
   the time this runs, so there is no second delay to sit through — and a new
   one every QUOTE_EVERY_MS after that. It starts at a random index so a long
   session does not open on the same line every time. */
const QUOTE_EVERY_MS = 3600
function useQuote(family: QuoteFamily, enabled: boolean) {
  const [quote, setQuote] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) {
      setQuote(null)
      return
    }
    const lines = QUOTES[family]
    let i = Math.floor(Math.random() * lines.length)
    setQuote(lines[i])
    const every = setInterval(() => {
      i = (i + 1) % lines.length
      setQuote(lines[i])
    }, QUOTE_EVERY_MS)
    return () => clearInterval(every)
  }, [family, enabled])
  return quote
}

/** Indeterminate top progress line — shown during route transitions. */
export function RouteProgress() {
  return (
    <div className="fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden bg-transparent">
      <div className="anim-progress h-full w-full bg-brand-600" />
    </div>
  )
}

import { cn } from '@/lib/cn'

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
 * Full-screen branded loader — the route-level Suspense fallback, and so the
 * first thing a cold start puts on screen.
 *
 * It used to be a gradient squircle with a glow under it and a ring pinging
 * outward. Three effects to say "wait a moment". This is the mark itself with
 * its two arms lighting in sequence — the same forward motion the launch
 * animation opens with, so the wait and the app that follows it are visibly
 * the same product — over a track that travels rather than pulses, because a
 * pulse says "busy" and a travelling bar says "progressing".
 *
 * Pure CSS: it has to paint before the route chunk it is waiting for arrives,
 * so it cannot depend on anything that ships in that chunk.
 */
export function ScreenLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-5">
      <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden>
        <path
          d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z"
          fill="var(--color-brand-600)"
          className="anim-chevron"
        />
        <path
          d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z"
          fill="var(--color-brand-600)"
          className="anim-chevron"
          style={{ animationDelay: '0.14s' }}
        />
      </svg>

      <span className="h-px w-24 overflow-hidden bg-ink-200" role="status" aria-label={label}>
        <span className="anim-track block h-full w-1/3 bg-brand-600" />
      </span>
    </div>
  )
}

/** Indeterminate top progress line — shown during route transitions. */
export function RouteProgress() {
  return (
    <div className="fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden bg-transparent">
      <div className="anim-progress h-full w-full bg-brand-600" />
    </div>
  )
}

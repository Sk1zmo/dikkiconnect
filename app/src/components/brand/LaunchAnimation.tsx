import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MARK_PATH, MARK_STROKE } from '@/components/brand/Logo'
import { BRAND, LAUNCH_BG } from '@/lib/brand'

/* ═══════════════════════════════════════════════════════════════════════════
   The opening — the mark building itself, then the name.

     0.00  a dark field, nothing on it
     0.12  the road starts drawing from the left, in one movement: down into
           the first pool, around it, up to the peak, down into the second,
           around, and out to the right
     0.55  as the line passes through each basin, that pool lights beneath it
           and settles — the two moments the drawing pauses to gather
     1.05  the line is whole; a brighter sweep runs along it once, left to
           right, the way a headlight runs down a road
     1.15  the name rises under the mark, letter spacing closing as it comes
     1.55  the tagline settles
     2.20  done

   ── Why this replaced what was here ──────────────────────────────────────
   What this file held before was a 6.6-second film: a carton falling, dust,
   a hatchback pulling up, a boot opening, a boost, a camera swing, a pixel
   dissolve into the landing. It was beautiful and it was 900 lines, and it
   was the first thing anyone saw every single time they opened the app.

   A launch screen is not a title sequence. It is the cover charge on getting
   to work, paid again on every cold start, and the second viewing of a film
   is already too long. This is 2.2 seconds, it says the one thing a launch
   screen has to say — this is WayPool, here is its mark — and it is gone.

   It is also now honest about the mark it draws. The old opening drew an S.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Every time in seconds, in one place, so the sequence can be read at a
   glance and changed without hunting through the markup. */
export const T = {
  drawStart: 0.12,
  drawEnd: 1.05,
  /* When each basin lights. These are where the line is at that moment —
     move them with the path, not by eye. */
  pool1: 0.42,
  pool2: 0.74,
  sweep: 1.05,
  word: 1.15,
  tagline: 1.55,
  done: 2.2,
} as const

export const LAUNCH_ANIMATION_MS = T.done * 1000

const EASE = [0.33, 0, 0.12, 1] as const
const EASE_OUT = [0.16, 1, 0.3, 1] as const

/** Where the two pools sit on the 48×48 grid, for the glow under each. */
const POOLS = [
  { cx: 17.25, cy: 29.5, at: T.pool1 },
  { cx: 30.75, cy: 29.5, at: T.pool2 },
] as const

/* ═══════════════════════════════════════════════════════════════════════════
   The mark, drawing itself.
   ═══════════════════════════════════════════════════════════════════════════ */
function BuildingMark({ size = 132, still = false }: { size?: number; still?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className="overflow-visible">
      <defs>
        <linearGradient id="wp-stroke" x1="6" y1="12" x2="42" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7ba5ff" />
          <stop offset="55%" stopColor="#2f6bff" />
          <stop offset="100%" stopColor="#1650e0" />
        </linearGradient>

        {/* The headlight sweep: a short bright band that travels the gradient
            once. It is a gradient animation rather than a moving shape so it
            follows the path's own curve for free. */}
        <linearGradient id="wp-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          {!still && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-1 0"
              to="1 0"
              begin={`${T.sweep}s`}
              dur="0.55s"
              fill="freeze"
            />
          )}
        </linearGradient>

        <filter id="wp-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>

      {/* The pools light under the line as it passes through them.

          Opacity only, no scale: with a blur filter on the element, a
          `fill-box` transform resolves against the filter region rather than
          the circle, and the glows ended up at the top of the mark instead of
          in its basins. A bloom reads from brightness anyway. */}
      {POOLS.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={7}
          fill="#2f6bff"
          filter="url(#wp-glow)"
          initial={{ opacity: still ? 0.3 : 0 }}
          animate={still ? { opacity: 0.3 } : { opacity: [0, 0.75, 0.3] }}
          transition={still ? { duration: 0 } : { delay: p.at, duration: 0.55, ease: EASE_OUT }}
        />
      ))}

      {/* The road itself, drawn by uncovering it from one end. */}
      <motion.path
        d={MARK_PATH}
        pathLength={1}
        fill="none"
        stroke="url(#wp-stroke)"
        strokeWidth={MARK_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={still ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={
          still
            ? { duration: 0 }
            : { delay: T.drawStart, duration: T.drawEnd - T.drawStart, ease: EASE }
        }
      />

      {/* The sweep rides on top of the finished stroke.

          It is held at zero opacity until its moment. Before that the
          gradient sits centred on the mark, and a half-transparent white band
          across the middle of the stroke made the whole logo look washed out
          from the first frame — which is what it did. */}
      {!still && (
        <motion.path
          d={MARK_PATH}
          fill="none"
          stroke="url(#wp-sweep)"
          strokeWidth={MARK_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: T.sweep, duration: 0.6, times: [0, 0.12, 0.8, 1] }}
        />
      )}
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mark, name, tagline — the lockup the screen settles on.

   `still` renders the final frame with no motion at all, which is what plays
   under a reduced-motion preference and what the launch screen holds while
   it waits for the first route.
   ═══════════════════════════════════════════════════════════════════════════ */
export function LaunchLockup({ still = false, delay = 0 }: { still?: boolean; delay?: number }) {
  return (
    <div className="flex flex-col items-center">
      <BuildingMark still={still} />

      <motion.h1
        className="text-display mt-5 text-[40px] leading-none font-extrabold text-white"
        initial={still ? { opacity: 1, y: 0, letterSpacing: '-0.045em' } : { opacity: 0, y: 14, letterSpacing: '0.12em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '-0.045em' }}
        transition={still ? { duration: 0 } : { delay: delay + T.word, duration: 0.55, ease: EASE_OUT }}
      >
        {BRAND.name}
      </motion.h1>

      <motion.p
        className="mt-3 text-[10px] font-bold tracking-[0.32em] text-brand-300 uppercase"
        initial={still ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={still ? { duration: 0 } : { delay: delay + T.tagline, duration: 0.45 }}
      >
        {BRAND.tagline}
      </motion.p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   The whole opening. Calls `onDone` when it has played out — the screen above
   it decides what to do with that, because the app may not be ready yet.
   ═══════════════════════════════════════════════════════════════════════════ */
export function LaunchAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    /* Under reduced motion the still frame is already on screen, so there is
       nothing to wait for beyond letting it be read. */
    const ms = reduced ? 700 : LAUNCH_ANIMATION_MS
    const t = setTimeout(onDone, ms)
    return () => clearTimeout(t)
  }, [onDone, reduced])

  return (
    /* The exact navy the native splash is painted in, so the hand-over from
       the OS to this is a continuation rather than a cut. */
    <div
      className="relative flex size-full flex-col items-center justify-center overflow-hidden"
      style={{ background: LAUNCH_BG }}
    >
      {/* A low wash behind the mark so the glow has something to sit in. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 44%, rgba(47,107,255,0.26), rgba(7,18,49,0) 70%)',
        }}
        initial={reduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : T.pool1, duration: 0.8 }}
      />

      <div className="relative">
        <LaunchLockup still={Boolean(reduced)} />
      </div>
    </div>
  )
}

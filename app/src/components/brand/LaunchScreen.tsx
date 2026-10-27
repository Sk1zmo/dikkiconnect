import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LaunchAnimation, LaunchLockup, LAUNCH_ANIMATION_MS } from '@/components/brand/LaunchAnimation'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch screen — the opening, held up until the app is there.

   What plays is `LaunchAnimation`: a parcel packed, a car arriving for it,
   the name drawn at the end. This component owns everything around that —
   when it may leave, how it leaves, and the hand-over from the OS.

   It sits over the app rather than in front of it in the route table: the app
   mounts and initialises beneath while this is showing, so the screen never
   costs anything it was not already paying for. It lifts when BOTH the first
   route has committed (see lib/boot.tsx) AND the animation has played out —
   the animation is the brand moment, and cutting it off at the car's arrival
   reads as a glitch, not a splash. A tap waives the animation.

   There is a ceiling too. If the first route has still not committed after
   MAX_VISIBLE_MS the screen lifts regardless and hands over to whatever the
   app is showing — its own loader, or its own error — rather than sit on top
   of the problem.

   Under reduced motion the animation is replaced by its final frame, held
   for MIN_VISIBLE_REDUCED_MS.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const

/** The still frame, under reduced motion: long enough to be read, no more. */
const MIN_VISIBLE_REDUCED_MS = 900
/** Ceiling — past this, lift no matter what and let the app show its own state. */
const MAX_VISIBLE_MS = LAUNCH_ANIMATION_MS + 3000
/** The typeface is bundled and preloaded; if it is somehow slower than this, go without. */
const FONT_WAIT_MS = 600

export function LaunchScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const reduced = useReducedMotion()
  const mountedAt = useRef(performance.now())
  const [fontReady, setFontReady] = useState(false)
  const [plateGone, setPlateGone] = useState(false)
  const [played, setPlayed] = useState(false)
  const play = useCallback(() => setPlayed(true), [])

  /* The native plate stays up until this has painted, so the OS hands over to
     a frame that is already the same colour. The animation does not start
     until the plate has actually gone — otherwise its first second plays
     underneath it and the parcel is already sealed by the time anyone sees
     the screen. On the web the hide is a no-op and resolves at once; if the
     plugin is somehow missing, a short cap starts the show regardless. */
  useEffect(() => {
    let alive = true
    const cap = setTimeout(() => alive && setPlateGone(true), 1200)
    const raf = requestAnimationFrame(() => {
      import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 180 }))
        .catch(() => {})
        .finally(() => alive && setPlateGone(true))
    })
    return () => {
      alive = false
      clearTimeout(cap)
      cancelAnimationFrame(raf)
    }
  }, [])

  /* `font-display: swap` would paint the wordmark in a fallback face and then
     swap it — the one reflow this screen must not show. Hold the animation
     until Inter is on hand, with a cap in case it is not. */
  useEffect(() => {
    let alive = true
    const cap = setTimeout(() => alive && setFontReady(true), FONT_WAIT_MS)
    const fonts = document.fonts
    if (fonts?.load) {
      fonts.load('800 30px Inter').then(() => alive && setFontReady(true), () => {})
    } else {
      setFontReady(true)
    }
    return () => {
      alive = false
      clearTimeout(cap)
    }
  }, [])

  /* Reduced motion: the still frame, for a beat. */
  useEffect(() => {
    if (!reduced) return
    const t = setTimeout(() => setPlayed(true), MIN_VISIBLE_REDUCED_MS)
    return () => clearTimeout(t)
  }, [reduced])

  /* When to leave: once the app is there and the opening has played — or at
     the ceiling, whichever is first. */
  useEffect(() => {
    if (ready && played) {
      onDone()
      return
    }
    const left = MAX_VISIBLE_MS - (performance.now() - mountedAt.current)
    const t = setTimeout(onDone, Math.max(0, left))
    return () => clearTimeout(t)
  }, [ready, played, onDone])

  return (
    <motion.div
      role="presentation"
      onPointerDown={play}
      className="absolute inset-0 z-200 grid place-items-center overflow-hidden bg-dusk-900 select-none"
      initial={false}
      /* This used to unmount under the cover of the pixel wipe, so its exit
         was nothing. With the wipe gone it has to carry its own departure:
         a slow dissolve that lets the first screen come up through it, which
         is the one moment in the app worth spending half a second on. */
      exit={{
        opacity: 0,
        pointerEvents: 'none',
        transition: { duration: reduced ? 0.25 : 0.42, ease: EASE },
      }}
    >
      {/* ── Atmosphere ────────────────────────────────────────────────────
          Stacked radial gradients rather than a blurred sprite: the same
          falloff, none of the per-frame rasterisation. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 42% at 50% 46%, rgba(58,104,245,0.28), transparent 70%),' +
            'radial-gradient(90% 60% at 50% 100%, rgba(24,58,160,0.45), transparent 72%)',
        }}
      />
      {/* Vignette, so the eye stays in the middle third where the work is. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(78% 64% at 50% 50%, transparent 42%, rgba(2,6,22,0.72))' }}
      />

      {fontReady &&
        plateGone &&
        (reduced ? (
          <div className="relative">
            <LaunchLockup still />
          </div>
        ) : (
          <LaunchAnimation onDone={play} />
        ))}
    </motion.div>
  )
}

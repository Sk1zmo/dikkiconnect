import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch animation.

   The previous opening was a three-second isometric scene: a parcel falling
   into an open boot, parallax traffic drifting behind it, Gaussian blur on two
   planes. It was carefully made and it was the wrong thing. Three seconds is
   an eternity in front of an app you open twice a day, blur filters are the
   most expensive thing you can ask a mid-range Android to composite, and an
   illustration that has to be *read* is the opposite of a splash.

   This is the same idea told as motion graphics: the mark is already moving
   before you see it, and it hands off to the app before you can get bored.

     0.00  the two chevrons arrive from the left at speed and brake hard
     0.20  the wordmark wipes in behind them, riding the same momentum
     0.30  a rule sweeps under the lockup, then wipes off the other side
     0.52  the tagline settles
     0.95  the whole lockup lifts away

   1.18s end to end, and it can be tapped away at any point in it.

   Three rules hold the whole thing together:

     · Transform and opacity only. Nothing here triggers layout or paint, so
       it runs at frame rate on hardware that could not composite the old one.
     · One easing curve — expo-out — on everything that arrives. Fast start,
       long tail. That single curve is most of what reads as "fluid"; mixing
       eases is what makes a sequence feel assembled from parts.
     · Overlapping, never sequential. Every element starts before the one
       before it has finished. A strictly sequential timeline always reads as
       slow, whatever the individual durations say.

   The field is the same near-black as the native splash screen
   (`SplashScreen.backgroundColor` in capacitor.config.ts). It used to be
   white, which meant the APK flashed black → white → dark hero on every cold
   start. Matching it makes the native splash and this one read as one screen.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Fast in, long settle. The whole personality of the sequence is in this one
   curve, so it is defined once and never varied. */
const EASE = [0.16, 1, 0.3, 1] as const

const T = {
  trail: 0,
  lead: 0.07,
  word: 0.2,
  rule: 0.3,
  ruleOut: 0.62,
  tag: 0.52,
  out: 0.95,
  done: 1.18,
}

export function LaunchAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }
    const t = setTimeout(onDone, T.done * 1000)
    return () => clearTimeout(t)
  }, [reduced, onDone])

  if (reduced) return null

  /* The chevrons share one arrival, staggered. The trailing arm leads by a
     frame or two and settles first, so the pair reads as one object with
     weight rather than two shapes landing together. */
  const fly = (delay: number) => ({
    initial: { x: -64, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.52, delay, ease: EASE },
  })

  return (
    <motion.div
      onClick={onDone}
      className="fixed inset-0 z-200 grid place-items-center overflow-hidden bg-[#0B0E15]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.26, ease: 'easeOut' }}
    >
      {/* The lockup lifts and fades as one, so the hand-off to the app is a
          single move rather than four elements leaving separately. */}
      <motion.div
        className="flex flex-col items-center px-8"
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.23, delay: T.out, ease: 'easeIn' }}
      >
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden className="overflow-visible">
            <motion.path
              d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z"
              fill="#3a68f5"
              {...fly(T.trail)}
            />
            <motion.path
              d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z"
              fill="#96b8ff"
              {...fly(T.lead)}
            />
          </svg>

          {/* A wipe, not a fade. The mask travels left-to-right in the same
              direction the chevrons came from, so the wordmark reads as
              something they uncovered on the way past. */}
          <motion.span
            className="text-display text-[30px] leading-none font-extrabold tracking-[-0.04em] text-white"
            initial={{ clipPath: 'inset(0 100% -20% 0)', opacity: 0 }}
            animate={{ clipPath: 'inset(0 0% -20% 0)', opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: T.word,
              ease: EASE,
              opacity: { duration: 0.16, delay: T.word },
            }}
          >
            DikkiConnect
          </motion.span>
        </div>

        {/* One rule, two moves: in from the left, out to the right. A line that
            passes through is motion; a line that just appears is a divider. */}
        <div className="mt-4 h-px w-[190px] overflow-hidden">
          <motion.div
            className="h-full w-full bg-brand-500"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] }}
            transition={{
              duration: T.ruleOut - T.rule + 0.3,
              delay: T.rule,
              times: [0, 0.45, 0.55, 1],
              ease: EASE,
            }}
          />
        </div>

        <motion.p
          className="mt-3.5 text-[10px] font-semibold tracking-[0.3em] text-white/45 uppercase"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: T.tag, ease: EASE }}
        >
          Move more. Together.
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

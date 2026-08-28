import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch animation.

   Before this there was a three-second isometric scene — a parcel falling into
   an open boot, parallax traffic behind it, Gaussian blur on two planes. It
   was carefully made and it was the wrong thing: three seconds is an eternity
   in front of an app you open twice a day, blur is the most expensive thing
   you can ask a mid-range Android to composite, and an illustration that has
   to be *read* is the opposite of a splash.

   This is the same idea told as motion graphics, in a third of the time:

     0.00  the two chevrons arrive from the left and brake hard
     0.18  a single ring expands out of the mark and dissolves
     0.26  the wordmark rises letter by letter, 24ms apart
     0.42  a rule sweeps under the lockup, then off the other side
     0.72  the tagline settles
     1.12  the whole lockup lifts away

   1.42s end to end, tappable away at any point in it.

   What makes it read as one movement rather than six:

     · Transform and opacity only. Nothing here triggers layout or paint, so
       it holds frame rate on hardware that could not composite the old one.
     · One easing curve — expo-out — on everything that arrives. Fast start,
       long tail. Mixing eases is what makes a sequence feel assembled out of
       parts, and that single curve is most of what reads as "fluid".
     · Overlapping, never sequential. Every element begins before the one
       before it has finished; a strictly sequential timeline reads as slow
       whatever the individual durations say.
     · The letters rise in sequence rather than the word fading in. Twelve
       transforms cost nothing and it is the difference between a logo that
       appears and a logo that arrives.

   The field is a deep brand navy rather than the near-black it used to be —
   the same colour as `SplashScreen.backgroundColor` in capacitor.config.ts,
   so the native splash and this one are a single screen rather than two, and
   the app no longer flashes between them on a cold start.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Fast in, long settle. Defined once, never varied. */
const EASE = [0.16, 1, 0.3, 1] as const

const T = {
  trail: 0,
  lead: 0.07,
  ring: 0.18,
  word: 0.26,
  rule: 0.42,
  tag: 0.72,
  out: 1.12,
  done: 1.42,
}

const WORD = 'DikkiConnect'.split('')

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

  /* Both chevrons share one arrival, staggered by a frame or two, so the pair
     reads as a single object with weight rather than two shapes landing at
     once. They come in slightly small and settle to full size. */
  const fly = (delay: number) => ({
    initial: { x: -58, scale: 0.86, opacity: 0 },
    animate: { x: 0, scale: 1, opacity: 1 },
    transition: { duration: 0.56, delay, ease: EASE },
  })

  return (
    <motion.div
      onClick={onDone}
      className="fixed inset-0 z-200 grid place-items-center overflow-hidden bg-[#091a4a]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* One soft pool of light behind the lockup. Static, so it costs a single
          composited layer and nothing per frame. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 40% at 50% 47%, rgba(58,104,245,0.30), transparent 70%)',
        }}
      />

      {/* The lockup lifts and fades as one, so handing over to the app is a
          single move rather than four elements leaving separately. */}
      <motion.div
        className="relative flex flex-col items-center px-8"
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.26, delay: T.out, ease: 'easeIn' }}
      >
        <div className="flex items-center gap-3">
          <span className="relative grid place-items-center">
            {/* A ring thrown off by the mark landing. One expansion, no loop —
                a splash that pulses is a splash that nags. */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute size-11 rounded-full border-2 border-brand-400"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 2.6, opacity: [0, 0.55, 0] }}
              transition={{ duration: 0.9, delay: T.ring, ease: EASE, times: [0, 0.25, 1] }}
            />
            <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden className="relative">
              <motion.path
                d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z"
                fill="#3a68f5"
                {...fly(T.trail)}
              />
              <motion.path
                d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z"
                fill="#ffffff"
                {...fly(T.lead)}
              />
            </svg>
          </span>

          {/* Letter by letter, 24ms apart. The word arrives rather than appears. */}
          <span className="text-display flex text-[31px] leading-none font-extrabold tracking-[-0.04em] text-white">
            {WORD.map((ch, i) => (
              <motion.span
                key={i}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: T.word + i * 0.024, ease: EASE }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        </div>

        {/* One rule, two moves: in from the left, out to the right. A line that
            passes through is motion; a line that just appears is a divider. */}
        <div className="mt-4 h-px w-[200px] overflow-hidden">
          <motion.div
            className="h-full w-full bg-brand-300"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] }}
            transition={{ duration: 0.62, delay: T.rule, times: [0, 0.42, 0.58, 1], ease: EASE }}
          />
        </div>

        <motion.p
          className="mt-3.5 text-[10px] font-semibold tracking-[0.3em] text-white/55 uppercase"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44, delay: T.tag, ease: EASE }}
        >
          Move more. Together.
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

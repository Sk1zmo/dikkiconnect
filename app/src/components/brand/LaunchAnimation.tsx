import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch animation — delivery-app register.

   The kind of opening Porter, Dunzo and Swiggy use: bright, quick, literal
   about what the app does, and over before you resent it. A mini-truck pulls
   up, a parcel drops into its bed, the tailgate shuts and it drives off; the
   wordmark lands on the road it leaves behind.

   What keeps it from feeling cheap:

     · The truck arrives with weight — a slight nose-dip on braking and a
       settle on its suspension, because a vehicle that stops dead reads as a
       sticker rather than a thing with mass.
     · The road moves, not the truck. Dashes scroll underneath and the wheels
       spin at a rate that matches, so the vehicle is planted rather than
       sliding.
     · The parcel arcs rather than dropping straight, and squashes a frame on
       landing.
     · Everything is on a 4px rhythm and the palette is the app's own, so it
       reads as the same product rather than a title card bolted on the front.

   2.9s, skippable by tapping, skipped entirely for reduced motion.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const
const BRAKE = [0.16, 0.84, 0.28, 1] as const

const T = {
  arrive: 0.12,
  parcel: 0.86,
  shut: 1.42,
  leave: 1.78,
  brand: 2.02,
  done: 3.2,
}

export function LaunchAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<'arrive' | 'loaded' | 'gone'>('arrive')

  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }
    const timers = [
      setTimeout(() => setPhase('loaded'), T.shut * 1000),
      setTimeout(() => setPhase('gone'), T.leave * 1000),
      setTimeout(onDone, T.done * 1000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [reduced, onDone])

  if (reduced) return null

  const loaded = phase !== 'arrive'
  const gone = phase === 'gone'

  return (
    <motion.div
      onClick={onDone}
      className="fixed inset-0 z-200 grid place-items-center overflow-hidden bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {/* A wash of brand colour behind everything, so white never reads bald */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(78% 46% at 50% 46%, rgba(22,80,224,0.10), transparent 72%)',
        }}
      />

      <div className="relative w-full max-w-[460px] px-6">
        <svg viewBox="0 0 360 190" className="w-full" aria-hidden>
          <defs>
            <linearGradient id="dkc-cab" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4b83ff" />
              <stop offset="100%" stopColor="#1650e0" />
            </linearGradient>
            <linearGradient id="dkc-bed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dbe6fb" />
              <stop offset="100%" stopColor="#b9cdf3" />
            </linearGradient>
            <linearGradient id="dkc-box" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd9a3" />
              <stop offset="100%" stopColor="#f6b76a" />
            </linearGradient>
          </defs>

          {/* ── Road ─────────────────────────────────────────────────────── */}
          <line x1="0" y1="150" x2="360" y2="150" stroke="#dfe5f1" strokeWidth="3" />

          {/* Dashes scroll leftwards, which is what makes the truck look
              planted instead of gliding across a static floor. */}
          <motion.g
            animate={{ x: [0, -60] }}
            transition={{ duration: gone ? 0.28 : 0.75, repeat: Infinity, ease: 'linear' }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <rect
                key={i}
                x={i * 60}
                y="148.5"
                width="28"
                height="3"
                rx="1.5"
                fill="#c3d2ea"
              />
            ))}
          </motion.g>

          {/* ── Truck ────────────────────────────────────────────────────── */}
          <motion.g
            initial={{ x: -260 }}
            animate={gone ? { x: 420 } : { x: 0 }}
            transition={
              gone
                ? { duration: 0.62, ease: [0.5, 0, 0.85, 0.4] }
                : { duration: 0.92, delay: T.arrive, ease: BRAKE }
            }
          >
            {/* Nose-dip: the body pitches forward as it brakes, then settles */}
            <motion.g
              initial={{ rotate: 0 }}
              animate={gone ? { rotate: [-1.6, 0] } : { rotate: [0, 2.4, -0.8, 0] }}
              transition={{
                duration: gone ? 0.3 : 0.7,
                delay: gone ? 0 : T.arrive + 0.55,
                ease: 'easeOut',
              }}
              style={{ transformOrigin: '150px 132px' }}
            >
              {/* Bed */}
              <rect x="96" y="96" width="106" height="38" rx="6" fill="url(#dkc-bed)" />
              {/* Tailgate — down while loading, up once the parcel is in */}
              <motion.rect
                x="92"
                y="96"
                width="7"
                height="38"
                rx="3"
                fill="#93b0e4"
                style={{ transformOrigin: '95px 134px' }}
                initial={{ rotate: -78 }}
                animate={{ rotate: loaded ? 0 : -78 }}
                transition={{ duration: 0.34, ease: BRAKE }}
              />
              {/* Cab */}
              <path
                d="M202 134V92c0-4 3-7 7-7h28c3 0 6 2 8 5l17 27c1 2 2 4 2 6v11z"
                fill="url(#dkc-cab)"
              />
              {/* Window */}
              <path d="M212 96h24l13 21h-37z" fill="#bcd4ff" opacity="0.92" />
              {/* Headlight */}
              <rect x="256" y="120" width="8" height="6" rx="2" fill="#ffe08a" />

              {/* Parcel — arcs in, squashes, then rides along */}
              <motion.g
                initial={{ x: 40, y: -120, rotate: 16, opacity: 0 }}
                animate={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  opacity: 1,
                  transition: { duration: 0.5, delay: T.parcel, ease: [0.4, 0, 0.2, 1] },
                }}
              >
                <motion.g
                  initial={{ scaleY: 1 }}
                  animate={{ scaleY: [1, 0.82, 1] }}
                  transition={{
                    duration: 0.26,
                    delay: T.parcel + 0.42,
                    times: [0, 0.4, 1],
                    ease: 'easeOut',
                  }}
                  style={{ transformOrigin: '133px 96px' }}
                >
                  <rect x="114" y="64" width="40" height="32" rx="5" fill="url(#dkc-box)" />
                  <path d="M134 64v32" stroke="#d1954e" strokeWidth="3" />
                  <path d="M114 80h40" stroke="#d1954e" strokeWidth="3" />
                </motion.g>
              </motion.g>
            </motion.g>

            {/* Wheels — outside the pitching group so they stay on the road */}
            {[124, 232].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="140" r="15" fill="#1a2440" />
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: gone ? 0.3 : 0.75, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: `${cx}px 140px` }}
                >
                  <circle cx={cx} cy="140" r="6.5" fill="#eef3fb" />
                  <rect x={cx - 1.4} y="129" width="2.8" height="22" rx="1.4" fill="#c3d2ea" />
                </motion.g>
              </g>
            ))}
          </motion.g>

          {/* Speed lines as it pulls away */}
          {gone &&
            [0, 1, 2].map((i) => (
              <motion.rect
                key={i}
                x="20"
                y={104 + i * 13}
                height="4"
                rx="2"
                fill="#9db8ec"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: [0, 120, 0], opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.46, delay: i * 0.05, ease: 'easeOut' }}
              />
            ))}
        </svg>

        {/* ── Wordmark, landing on the road the truck left ───────────────── */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex flex-col items-center">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: gone ? 1 : 0, y: gone ? 0 : 14 }}
            /* Waits out the truck's 0.62s exit. Landing the wordmark on top of
               a vehicle still leaving the frame reads as a collision, not a
               hand-off. */
            transition={{ duration: 0.46, delay: gone ? 0.58 : 0, ease: EASE }}
          >
            <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden>
              <path d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z" fill="#7ba5ff" />
              <path d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z" fill="#1650e0" />
            </svg>
            <span className="text-display text-[27px] leading-none font-extrabold tracking-[-0.035em] text-ink-900">
              DikkiConnect
            </span>
          </motion.div>

          <motion.p
            className="mt-3 text-[11.5px] font-bold tracking-[0.26em] text-ink-400 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: gone ? 1 : 0 }}
            transition={{ duration: 0.4, delay: gone ? 0.78 : 0 }}
          >
            Move more. Together.
          </motion.p>
        </div>
      </div>

      {/* ── Progress hairline ──────────────────────────────────────────── */}
      <motion.span
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-brand-600"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: T.done, ease: 'linear' }}
      />
    </motion.div>
  )
}

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Logo } from './Logo'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch animation.

   The whole product in three seconds: a car is already going somewhere, a
   parcel goes in the boot it was wasting, the car drives on. The motion streaks
   it leaves behind do not fade — they settle into the two arms of the mark,
   because the mark *is* that idea.

   Timing is the thing that makes this read as considered rather than cute. The
   car arrives on a spring so it has weight. The parcel falls fast and lands
   slow, which is what a real drop looks like. The boot shuts with a beat of
   stillness after it, and the car does not leave until that beat has landed.
   Nothing here is decorative — every phase is a step in the sentence.

   Total 3.05s, skippable by tapping, and skipped entirely for anyone who has
   asked for reduced motion.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const
const T = {
  carIn: 0.15,
  lidOpen: 0.85,
  parcelDrop: 1.05,
  lidShut: 1.62,
  driveOff: 2.0,
  mark: 2.3,
  /* The car's exit runs 0.46s. The mark waits it out rather than springing in
     over the top of it — two things occupying the same space is what makes a
     transition look like an accident instead of a hand-off. */
  markLand: 0.42,
  word: 0.78,
  done: 3.55,
}

export function LaunchAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<'scene' | 'logo'>('scene')

  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }
    const toLogo = setTimeout(() => setPhase('logo'), T.mark * 1000)
    const finish = setTimeout(onDone, T.done * 1000)
    return () => {
      clearTimeout(toLogo)
      clearTimeout(finish)
    }
  }, [reduced, onDone])

  if (reduced) return null

  return (
    <motion.div
      onClick={onDone}
      className="fixed inset-0 z-200 grid place-items-center bg-dusk-950"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {/* Ambient glow — gives the dark field some depth to sit in */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 42% at 50% 52%, rgba(22,80,224,0.30), transparent 70%)',
        }}
      />

      <svg viewBox="0 0 320 210" className="relative w-[88%] max-w-[430px]" aria-hidden>
        <defs>
          <linearGradient id="dkc-launch-body" x1="70" y1="108" x2="230" y2="152">
            <stop offset="0%" stopColor="#7ba5ff" />
            <stop offset="100%" stopColor="#1650e0" />
          </linearGradient>
          <linearGradient id="dkc-launch-streak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7ba5ff" stopOpacity="0" />
            <stop offset="100%" stopColor="#7ba5ff" stopOpacity="0.95" />
          </linearGradient>
          {/* Anything below the deck line is inside the car. The parcel is
              drawn through this, so it is progressively swallowed as it drops
              rather than resting on the roof. */}
          <clipPath id="dkc-boot-clip">
            <rect x="0" y="0" width="320" height="112" />
          </clipPath>
        </defs>

        {/* ── Road ───────────────────────────────────────────────────────── */}
        <motion.line
          x1="24"
          y1="166"
          x2="296"
          y2="166"
          stroke="#22315a"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: EASE }}
        />

        {/* ── The car ────────────────────────────────────────────────────── */}
        <motion.g
          initial={{ x: -250, opacity: 0 }}
          animate={phase === 'logo' ? { x: 340, opacity: 0 } : { x: 0, opacity: 1 }}
          transition={
            phase === 'logo'
              ? { duration: 0.46, ease: [0.55, 0, 0.9, 0.35] }
              : {
                  x: { type: 'spring', stiffness: 95, damping: 15, mass: 1, delay: T.carIn },
                  opacity: { duration: 0.28, delay: T.carIn },
                }
          }
        >
          {/* Wheels sit behind the body so the arches read as arches */}
          {[104, 196].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="150" r="16" fill="#0a1020" />
              <motion.g
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ originX: `${cx}px`, originY: '150px' }}
              >
                <circle cx={cx} cy="150" r="7.5" fill="none" stroke="#3f63b8" strokeWidth="3" />
                <line
                  x1={cx - 7.5}
                  y1="150"
                  x2={cx + 7.5}
                  y2="150"
                  stroke="#3f63b8"
                  strokeWidth="2.5"
                />
              </motion.g>
            </g>
          ))}

          {/* Cabin */}
          <path
            d="M128 112 L138 86 Q141 79 149 79 L188 79 Q196 79 200 86 L212 112 Z"
            fill="#3f6fdd"
          />

          {/* Body */}
          <motion.rect
            x="70"
            y="110"
            width="160"
            height="38"
            rx="16"
            fill="url(#dkc-launch-body)"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: [1, 0.93, 1] }}
            transition={{
              duration: 0.36,
              delay: T.parcelDrop + 0.42,
              times: [0, 0.42, 1],
              ease: 'easeOut',
            }}
            style={{ originY: '148px' }}
          />

          {/* The boot itself — a dark recess cut into the rear deck */}
          <rect x="78" y="104" width="44" height="12" rx="4" fill="#08122b" />

          {/* Parcel, clipped so it disappears into that recess */}
          <g clipPath="url(#dkc-boot-clip)">
            <motion.g
              initial={{ y: -150, opacity: 0, rotate: -12 }}
              animate={
                phase === 'logo'
                  ? { opacity: 0 }
                  : { y: [-150, -2, -2, 26], opacity: [0, 1, 1, 1], rotate: [-12, 0, 0, 0] }
              }
              transition={{
                duration: T.lidShut - T.parcelDrop + 0.1,
                delay: T.parcelDrop,
                times: [0, 0.46, 0.62, 1],
                ease: [0.4, 0, 0.25, 1],
              }}
              style={{ originX: '100px', originY: '92px' }}
            >
              <rect x="84" y="74" width="32" height="30" rx="6" fill="#ffd9a3" />
              <path d="M100 74 L100 104" stroke="#cf9147" strokeWidth="3" />
              <path d="M84 88 L116 88" stroke="#cf9147" strokeWidth="3" />
            </motion.g>
          </g>

          {/* Boot lid — hinged at the cabin edge, swings up and shuts over it */}
          <motion.path
            d="M122 112 L122 96 Q122 90 128 90 L126 90 L132 112 Z"
            fill="#2a55b8"
            style={{ originX: '122px', originY: '112px' }}
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -74, -74, 0] }}
            transition={{
              duration: T.lidShut - T.lidOpen + 0.3,
              delay: T.lidOpen,
              times: [0, 0.2, 0.74, 1],
              ease: EASE,
            }}
          />
          {/* The deck panel that closes flush over the recess */}
          <motion.rect
            x="76"
            y="104"
            width="48"
            height="9"
            rx="4"
            fill="#2a55b8"
            initial={{ scaleX: 0, originX: '124px' }}
            animate={{ scaleX: [0, 0, 1] }}
            transition={{
              duration: 0.4,
              delay: T.lidShut - 0.1,
              times: [0, 0.25, 1],
              ease: EASE,
            }}
            style={{ originX: '124px' }}
          />
        </motion.g>

        {/* ── Motion streaks left behind, which become the mark ──────────── */}
        {phase === 'logo' &&
          [0, 1].map((i) => (
            <motion.rect
              key={i}
              x={30}
              y={116 + i * 18}
              height="6"
              rx="3"
              fill="url(#dkc-launch-streak)"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: [0, 170, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
            />
          ))}
      </svg>

      {/* ── The mark, arriving where the car left ─────────────────────────── */}
      {phase === 'logo' && (
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            initial={{ scale: 0.62, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 18,
              mass: 0.7,
              delay: T.markLand,
            }}
          >
            <Logo size="xl" tone="white" markTone="gradient" />
          </motion.div>

          <motion.p
            className="absolute top-1/2 mt-14 text-[12px] font-bold tracking-[0.22em] text-white/55 uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: T.word, ease: EASE }}
          >
            Move more. Together.
          </motion.p>
        </div>
      )}
    </motion.div>
  )
}

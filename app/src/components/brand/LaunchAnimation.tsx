import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch sequence — 1980s Japanese hi-fi.

   The reference is a Sony campaign of the Walkman era: a machine presented as
   a machine. Registration marks, a model number, a part sliding into a chassis
   on rails and seating with a click, LEDs arming in sequence, a VU needle
   thrown to its stop before it settles back.

   Three rules keep it in that period rather than in pastiche:

     · Motion is mechanical, never elastic. Springs and overshoot read as
       "app"; a hard cubic-bezier that arrives and stops reads as "assembly".
       The only bounce here is the chassis absorbing the module's impact.
     · Type is instrumentation. Wide-tracked mono in small caps, labelling
       parts and states, carries the technical register on its own.
     · The screen is a CRT. It powers on as a line that opens vertically and
       keeps its scanlines and vignette throughout.

   The cargo module is the product idea, stated as hardware: a container
   sliding into a bay that was about to travel empty. It resolves into the two
   arms of the mark.

   3.4s, skippable by tapping, skipped entirely for reduced motion.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Hard mechanical ease — fast away, dead stop. */
const SNAP = [0.85, 0, 0.15, 1] as const
const GLIDE = [0.22, 1, 0.36, 1] as const

const T = {
  grid: 0.42,
  readout: 0.62,
  module: 1.0,
  seated: 1.62,
  leds: 1.78,
  brand: 2.34,
  done: 3.4,
}

const INK = '#05070d'
const CHROME = '#e7ecf6'
const BLUE = '#2f6bff'
const EMBER = '#ff9d3d'

export function LaunchAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()
  /* Three discrete flips rather than a per-frame clock. A rAF loop calling
     setState sixty times a second re-renders the whole sequence on every
     frame, and on a slow device that starves the very timer meant to end it —
     the sequence then plays forever. Nothing here needs sub-frame resolution:
     the phases are the animation's structure, and framer-motion interpolates
     everything between them. */
  const [seated, setSeated] = useState(false)
  const [branding, setBranding] = useState(false)

  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }
    const timers = [
      setTimeout(() => setSeated(true), T.seated * 1000),
      setTimeout(() => setBranding(true), T.brand * 1000),
      setTimeout(onDone, T.done * 1000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [reduced, onDone])

  if (reduced) return null

  return (
    <motion.div
      onClick={onDone}
      className="fixed inset-0 z-200 overflow-hidden"
      style={{ background: INK }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: GLIDE }}
    >
      {/* ── CRT power-on: a line that opens vertically ──────────────────── */}
      <motion.div
        className="absolute inset-0"
        initial={{ scaleY: 0.004, opacity: 0 }}
        animate={{ scaleY: [0.004, 0.004, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.46, times: [0, 0.32, 1], ease: SNAP }}
      >
        <svg viewBox="0 0 390 500" className="size-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="dkc-chrome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="42%" stopColor="#c8d3e6" />
              <stop offset="53%" stopColor="#8fa0bd" />
              <stop offset="100%" stopColor="#eef2fa" />
            </linearGradient>
            <linearGradient id="dkc-shine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="dkc-bay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d1424" />
              <stop offset="100%" stopColor="#060a13" />
            </linearGradient>
            <clipPath id="dkc-shine-clip">
              <rect x="96" y="228" width="198" height="46" />
            </clipPath>
          </defs>

          {/* ── Blueprint grid ─────────────────────────────────────────── */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: branding ? 0.08 : 0.22 }}
            transition={{ duration: 0.5, delay: T.grid, ease: GLIDE }}
          >
            {Array.from({ length: 15 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={12 + i * 27}
                y1="0"
                x2={12 + i * 27}
                y2="500"
                stroke="#4d6699"
                strokeWidth="0.6"
              />
            ))}
            {Array.from({ length: 19 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1="0"
                y1={12 + i * 27}
                x2="390"
                y2={12 + i * 27}
                stroke="#4d6699"
                strokeWidth="0.6"
              />
            ))}
          </motion.g>

          {/* ── Registration marks, stamped corner by corner ────────────── */}
          {([
            [26, 44, 1, 1],
            [364, 44, -1, 1],
            [26, 456, 1, -1],
            [364, 456, -1, -1],
          ] as const).map(([x, y, sx, sy], i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: branding ? 0.3 : 1, scale: 1 }}
              transition={{ duration: 0.18, delay: T.grid + i * 0.05, ease: SNAP }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <line x1={x} y1={y} x2={x + 17 * sx} y2={y} stroke={CHROME} strokeWidth="1.4" />
              <line x1={x} y1={y} x2={x} y2={y + 17 * sy} stroke={CHROME} strokeWidth="1.4" />
            </motion.g>
          ))}

          {/* ── The bay: the boot that was going to travel empty ────────── */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: branding ? 0 : 1 }}
            transition={{ duration: branding ? 0.22 : 0.4, delay: branding ? 0 : T.grid + 0.1 }}
          >
            <rect
              x="90"
              y="220"
              width="210"
              height="62"
              rx="4"
              fill="url(#dkc-bay)"
              stroke="#1d2942"
              strokeWidth="1.2"
            />
            <line x1="96" y1="228" x2="294" y2="228" stroke="#243354" strokeWidth="1" />
            <line x1="96" y1="274" x2="294" y2="274" stroke="#243354" strokeWidth="1" />
          </motion.g>

          {/* ── The cargo module, arriving on the rails ─────────────────── */}
          <motion.g
            initial={{ x: 320, opacity: 0 }}
            animate={
              branding
                ? { x: 0, opacity: 0, scale: 0.72 }
                : { x: [320, 320, 0], opacity: [0, 1, 1] }
            }
            transition={
              branding
                ? { duration: 0.24, ease: SNAP }
                : {
                    duration: T.seated - T.module,
                    delay: T.module,
                    times: [0, 0.05, 1],
                    ease: SNAP,
                  }
            }
            style={{ transformOrigin: '195px 251px' }}
          >
            {/* The chassis absorbing the impact — the one bounce in the piece */}
            <motion.g
              animate={seated ? { x: [0, -4, 1.5, 0] } : { x: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <rect
                x="96"
                y="228"
                width="198"
                height="46"
                rx="3"
                fill="url(#dkc-chrome)"
                stroke="#94a5c4"
                strokeWidth="0.8"
              />

              {/* Reels — turning only once the module is home */}
              {[140, 250].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy="251" r="15" fill="#0d1424" />
                  <motion.g
                    animate={{ rotate: seated ? 360 : 0 }}
                    transition={
                      seated ? { duration: 1.1, repeat: Infinity, ease: 'linear' } : { duration: 0 }
                    }
                    style={{ transformOrigin: `${cx}px 251px` }}
                  >
                    {[0, 60, 120].map((a) => (
                      <line
                        key={a}
                        x1={cx - 11 * Math.cos((a * Math.PI) / 180)}
                        y1={251 - 11 * Math.sin((a * Math.PI) / 180)}
                        x2={cx + 11 * Math.cos((a * Math.PI) / 180)}
                        y2={251 + 11 * Math.sin((a * Math.PI) / 180)}
                        stroke="#6d7f9e"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    ))}
                    <circle cx={cx} cy="251" r="4" fill={BLUE} />
                  </motion.g>
                </g>
              ))}

              {/* Window and level bar between the reels */}
              <rect x="166" y="240" width="58" height="22" rx="2" fill="#0d1424" opacity="0.92" />
              <motion.rect
                x="169"
                y="248"
                height="6"
                rx="3"
                fill={EMBER}
                initial={{ width: 0 }}
                animate={{ width: seated ? 52 : 0 }}
                transition={{ duration: 0.85, delay: 0.1, ease: GLIDE }}
              />

              {/* Chrome shine sweeping the face as it seats */}
              {seated && (
                <g clipPath="url(#dkc-shine-clip)">
                  <motion.rect
                    y="228"
                    width="72"
                    height="46"
                    fill="url(#dkc-shine)"
                    initial={{ x: 50 }}
                    animate={{ x: 300 }}
                    transition={{ duration: 0.58, ease: GLIDE }}
                  />
                </g>
              )}
            </motion.g>
          </motion.g>

          {/* ── LED bank, arming left to right ─────────────────────────── */}
          {!branding &&
            Array.from({ length: 7 }).map((_, i) => (
              <motion.rect
                key={i}
                x={147 + i * 14}
                y="300"
                width="8"
                height="8"
                rx="1"
                fill={i < 5 ? BLUE : EMBER}
                initial={{ opacity: 0.1 }}
                animate={{ opacity: [0.1, 1, 0.6] }}
                transition={{
                  duration: 0.3,
                  delay: T.leds + i * 0.055,
                  times: [0, 0.35, 1],
                  ease: 'easeOut',
                }}
              />
            ))}

          {/* ── VU meter: thrown to the stop, then settled ─────────────── */}
          {!branding && (
            <g>
              <rect x="96" y="322" width="198" height="3" rx="1.5" fill="#1d2942" />
              <motion.rect
                x="96"
                y="322"
                height="3"
                rx="1.5"
                fill={BLUE}
                initial={{ width: 0 }}
                animate={{ width: [0, 198, 134] }}
                transition={{ duration: 0.72, delay: T.leds, times: [0, 0.5, 1], ease: SNAP }}
              />
            </g>
          )}
        </svg>

        {/* ── Instrumentation type ─────────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 pt-safe">
          <TechLine
            at={T.readout}
            hide={branding}
            className="absolute top-[14%] left-7"
            lines={['DKC — 01', 'INTERCITY TRANSIT MODULE']}
          />
          <TechLine
            at={T.readout + 0.1}
            hide={branding}
            className="absolute top-[14%] right-7 text-right"
            lines={['CARGO BAY', '20 KG MAX · SEALED']}
          />
          <TechLine
            at={T.seated}
            hide={branding}
            accent
            className="absolute bottom-[17%] left-7"
            lines={['STATUS', 'MODULE SEATED · OK']}
          />
          <TechLine
            at={T.leds + 0.2}
            hide={branding}
            className="absolute right-7 bottom-[17%] text-right"
            lines={['LOAD', 'NOMINAL']}
          />
        </div>

        {/* ── Brand resolve ─────────────────────────────────────────────── */}
        {branding && <BrandStamp />}
      </motion.div>

      {/* ── CRT overlays ───────────────────────────────────────────────── */}
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)',
        }}
      />
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(122% 78% at 50% 50%, transparent 40%, rgba(0,0,0,0.74) 100%)',
        }}
      />
      <motion.span
        className="pointer-events-none absolute inset-x-0 h-24"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(120,170,255,0.09), transparent)',
        }}
        initial={{ top: '-12%' }}
        animate={{ top: '112%' }}
        transition={{ duration: 2.0, delay: T.grid, ease: 'linear', repeat: 1 }}
      />
    </motion.div>
  )
}

/** A block of instrumentation type: faint label over a bright value. */
function TechLine({
  lines,
  at,
  className,
  accent,
  hide,
}: {
  lines: readonly [string, string]
  at: number
  className?: string
  accent?: boolean
  hide?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: hide ? 0 : 1, y: 0 }}
      transition={{ duration: 0.24, delay: hide ? 0 : at, ease: SNAP }}
    >
      <p className="font-mono text-[8.5px] leading-none tracking-[0.34em] text-white/35 uppercase">
        {lines[0]}
      </p>
      <p
        className="mt-1.5 font-mono text-[10px] leading-none tracking-[0.2em] uppercase"
        style={{ color: accent ? EMBER : 'rgba(231,236,246,0.92)' }}
      >
        {lines[1]}
      </p>
    </motion.div>
  )
}

/** The mark closing from both sides, then the wordmark tightening into place. */
function BrandStamp() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3.5">
          <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden>
            <motion.path
              d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z"
              fill="#7ba5ff"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.32, ease: SNAP }}
            />
            <motion.path
              d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z"
              fill="#ffffff"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.32, delay: 0.05, ease: SNAP }}
            />
          </svg>

          {/* Tracking collapses from wide to tight — the type equivalent of a
              mechanism closing, and the era used exactly this move. */}
          <motion.span
            className="text-display text-[29px] leading-none font-extrabold text-white"
            initial={{ opacity: 0, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, letterSpacing: '-0.035em' }}
            transition={{ duration: 0.5, delay: 0.14, ease: GLIDE }}
          >
            DikkiConnect
          </motion.span>
        </div>

        <motion.span
          className="mt-5 block h-px bg-white/25"
          initial={{ width: 0 }}
          animate={{ width: 236 }}
          transition={{ duration: 0.42, delay: 0.3, ease: GLIDE }}
        />

        <motion.p
          className="mt-3.5 font-mono text-[9.5px] tracking-[0.42em] text-white/50 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.42 }}
        >
          Move more. Together.
        </motion.p>
      </div>
    </div>
  )
}

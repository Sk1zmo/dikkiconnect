import { useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { MARK_DOT, MARK_PATH } from '@/components/brand/Logo'
import { BRAND } from '@/lib/brand'

/* ═══════════════════════════════════════════════════════════════════════════
   The opening — a parcel packed and sent, at dusk.

     0.00  the scene settles: a low sun on the horizon, hills, a road
     0.10  a cardboard box falls in, squashing as it lands; two rings run out
           from under it and grit is thrown forward
     0.45  its flaps swing open, overshooting slightly before they settle
     0.85  eight things fall in, 85ms apart, each trailing a streak and
           kicking dust off the rim as it goes over
     2.00  the flaps fold back, a tape seam runs across the seal and the
           whole frame flashes on the closing
     2.05  the parcel is set down at the kerb — it shrinks and slides to the
           left of the frame as the camera pulls back from it
     2.10  a white hatchback arrives, headlights first, wheels turning, the
           road dashes streaming under it, a pool of light on the road ahead;
           it stops with its open boot over the parcel
     2.62  the parcel arcs up over the tailgate and drops into the boot; the
           suspension takes it and a highlight sweeps down the flank
     3.05  the tailgate shuts
     3.30  the car pulls away trailing ghosts and the camera pans after it
     3.45  the mark draws itself — a road that spells an S — the dot lands at
           its end, and the name rises a letter at a time with a shine across
           it, then the tagline opens out beneath

   4.6s, tap anywhere to skip, replaced by a still frame under reduced motion.

   Why a car and not a van. The tempting drawing on a delivery app is a van and
   it would be the wrong one: Stowza owns no vehicle and nothing new goes on
   the road because of it. The proposition is that a hatchback is already
   making that journey with an empty boot and the parcel rides in the space
   that was going to travel empty anyway. A van sells a courier company we are
   not. The car is white and the light is going gold because that is the
   picture on the screen after this one — the opening and the landing are the
   same evening.

   What sells the weight, in rough order of how much each one buys:

     · The wheels turn, and they have spokes so the turning is visible. They
       spin while it arrives, hold while it waits, spin again as it goes —
       driven off the same keyframe times as the body, so the two can never
       disagree. The road dashes stream under it on the same clock.
     · The body dips when the parcel lands in the boot and rocks back. Mass
       arriving somewhere ought to cost something.
     · Everything that falls squashes when it lands. Nothing rigid ever stops
       dead.
     · Each item drags a streak and knocks a little dust off the rim on its
       way in, so the fall has a direction and the box has an edge.
     · The flaps overshoot a few degrees and come back. Cardboard has spring.
     · Nothing is a flat fill. Every panel is a gradient lit from the sunset
       side, so the roof reads as the roof and the flank reads as the flank.
     · The camera is never still: it pushes in on the packing, holds through
       the load, and pans after the car as it leaves.

   Three things that silently destroyed the whole effect until they were right:

     · Flap rotation is signed — left positive, right negative. Matching signs
       swing one of them straight through the carton.
     · The items are only visible above the rim, because the front wall is
       painted over them (which is what puts them genuinely inside).
     · The box is painted before the car. Painted after, it read as a carton
       strapped to the outside over the rear wheel.

   Transform, opacity and gradient paint only. Glows are stacked radial
   gradients and the highlight sweep is a clipped rectangle, because an SVG
   blur filter over moving content re-rasterises every frame and a launch
   screen that stutters is worse than one that is plain.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const
const GRAVITY = [0.45, 0, 0.7, 0.35] as const
const CRUISE = [0.45, 0, 0.55, 1] as const

export const T = {
  box: 0.1,
  land: 0.55,
  flap: 0.45,
  item: 0.85,
  gap: 0.085,
  fall: 0.46,
  seal: 2.0,
  tape: 2.14,
  car: 2.1,
  load: 2.62,
  gate: 3.05,
  drive: 3.3,
  word: 3.45,
  done: 4.6,
}

/** How long the whole thing runs, for whoever is holding the screen up. */
export const LAUNCH_ANIMATION_MS = T.done * 1000

const GROUND = 178
const BW = 104
const BH = 76
const BX = 150
const TOP = GROUND - BH
const L = BX - BW / 2
const R = BX + BW / 2
const MOUTH = 15
const FLAP_H = 15

const CARD = { edge: '#9A6C3C', inner: '#4A2F13' }

/** The car's outline, shared by its fill and by the clip the highlight rides in. */
const CAR_BODY = `M46 ${GROUND} V150 Q46 143 55 142 L84 140 Q99 121 121 120 L177 120
                  Q197 121 208 140 L242 145 Q254 147 254 158 V${GROUND} Z`
const CAR_ROOF = 'M84 140 Q99 121 121 120 L177 120 Q197 121 208 140 Z'

/* Car timeline, shared by the body, the wheels and the road so they cannot drift. */
const CAR_SPAN = T.drive + 0.55 - T.car
const CAR_TIMES = [0, 0.45, (T.drive - T.car) / CAR_SPAN, 1]

/* The parcel's own timeline: set down at the kerb as the car arrives, lifted
   in an arc over the tailgate, settled in the boot, gone with the car. Times
   are absolute seconds, normalised for framer below. */
const BOX_KEYS = [T.seal + 0.05, T.car + 0.42, T.load, T.load + 0.2, T.load + 0.4, T.drive, T.drive + 0.55]
const BOX_SPAN = BOX_KEYS[BOX_KEYS.length - 1] - BOX_KEYS[0]
const BOX_TIMES = BOX_KEYS.map((t) => (t - BOX_KEYS[0]) / BOX_SPAN)
/* Where the parcel sits on the road, scaled about its own centre: bottom on
   the ground. The carton's bottom is BH/2 below the origin; at 0.4 it sits
   0.3·BH higher than before, so it drops by that much. */
const KERB_Y = BH * 0.3

/**
 * Background dust, placed off a hash rather than Math.random so the field is
 * the same every launch and nothing can pop differently between two renders.
 */
const frac = (n: number) => {
  const v = Math.sin(n) * 43758.5453
  return v - Math.floor(v)
}
const STARS = Array.from({ length: 18 }, (_, i) => ({
  x: 10 + frac(i * 12.9898) * 280,
  y: 4 + frac(i * 78.233) * 70,
  r: 0.4 + frac(i * 39.425) * 1.1,
  delay: frac(i * 21.7) * 2.6,
}))

/** A skyline, fixed per index: tower widths and heights that never reshuffle. */
const CITY = Array.from({ length: 14 }, (_, i) => ({
  x: 150 + i * 11 + frac(i * 3.1) * 5,
  w: 5 + frac(i * 7.7) * 6,
  h: 6 + frac(i * 5.3) * 16,
}))

const ITEMS: { id: string; node: ReactNode; x: number; spin: number }[] = [
  {
    id: 'laptop',
    x: -18,
    spin: -16,
    node: (
      <>
        <rect x="-15" y="-10" width="30" height="18" rx="1.8" fill="#C9D4E8" />
        <rect x="-12.6" y="-7.6" width="25.2" height="13.4" rx="1" fill="#26314C" />
        <rect x="-12.6" y="-7.6" width="25.2" height="6" rx="1" fill="#3B4E7A" opacity="0.7" />
        <rect x="-17.5" y="7" width="35" height="3" rx="1.5" fill="#9FB0CC" />
      </>
    ),
  },
  {
    id: 'phone',
    x: 14,
    spin: 20,
    node: (
      <>
        <rect x="-7" y="-13" width="14" height="26" rx="2.8" fill="#1B2740" />
        <rect x="-5.2" y="-10.6" width="10.4" height="20" rx="1.3" fill="#6E8BD0" />
        <rect x="-5.2" y="-10.6" width="10.4" height="8" rx="1.3" fill="#9DB6EC" opacity="0.6" />
      </>
    ),
  },
  {
    id: 'keys',
    x: -8,
    spin: 28,
    node: (
      <>
        <circle cx="-6" cy="-5" r="6.2" fill="none" stroke="#EFCE6E" strokeWidth="3" />
        <path d="M-1.5 -0.5 L9 10" stroke="#EFCE6E" strokeWidth="3" strokeLinecap="round" />
        <path d="M5 6 L8.5 2.5 M9 10 L12.5 6.5" stroke="#EFCE6E" strokeWidth="2.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'wallet',
    x: 16,
    spin: -22,
    node: (
      <>
        <rect x="-13" y="-9.5" width="26" height="19" rx="2.6" fill="#B5603E" />
        <rect x="-13" y="-9.5" width="26" height="7" rx="2.6" fill="#CE7550" opacity="0.75" />
        <path d="M-13 -2.5 H13" stroke="#83401F" strokeWidth="1.8" />
        <circle cx="7" cy="3.5" r="2.6" fill="#EFCE6E" />
      </>
    ),
  },
  {
    id: 'headphones',
    x: -15,
    spin: 14,
    node: (
      <>
        <path
          d="M-10.5 4 V-2 A10.5 10.5 0 0 1 10.5 -2 V4"
          fill="none"
          stroke="#E9EDF7"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="-14" y="2.5" width="7" height="11" rx="3.5" fill="#E9EDF7" />
        <rect x="7" y="2.5" width="7" height="11" rx="3.5" fill="#E9EDF7" />
      </>
    ),
  },
  {
    id: 'camera',
    x: 10,
    spin: -12,
    node: (
      <>
        <rect x="-14" y="-8" width="28" height="18.5" rx="2.8" fill="#48546F" />
        <rect x="-14" y="-8" width="28" height="6.5" rx="2.8" fill="#5D6B8A" opacity="0.8" />
        <rect x="-6" y="-11.5" width="9.5" height="4.5" rx="1.4" fill="#48546F" />
        <circle cx="0" cy="1.5" r="6" fill="#9FB3D9" />
        <circle cx="0" cy="1.5" r="2.8" fill="#26314C" />
        <circle cx="-1.8" cy="-0.4" r="1.1" fill="#DDE7FA" opacity="0.9" />
      </>
    ),
  },
  {
    id: 'gift',
    x: -6,
    spin: 24,
    node: (
      <>
        <rect x="-10.5" y="-8.5" width="21" height="17.5" rx="1.8" fill="#E2557B" />
        <rect x="-10.5" y="-8.5" width="21" height="6" rx="1.8" fill="#EE7295" opacity="0.8" />
        <rect x="-1.9" y="-8.5" width="3.8" height="17.5" fill="#F5D06A" />
        <rect x="-10.5" y="-3" width="21" height="3.4" fill="#F5D06A" />
      </>
    ),
  },
  {
    id: 'docs',
    x: 13,
    spin: -26,
    node: (
      <>
        <rect x="-9.5" y="-12" width="19" height="24" rx="1.6" fill="#F2F5FC" />
        <path
          d="M-5.5 -6 H5.5 M-5.5 -1.4 H5.5 M-5.5 3.2 H1.5"
          stroke="#A8B6D4"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
]

const FLAP_SPAN = T.seal + 0.36 - T.flap
const FLAP_OPEN = 0.17
const FLAP_HOLD = (T.item + (ITEMS.length - 1) * T.gap + T.fall - T.flap) / FLAP_SPAN

/** Where each grain of the landing burst is thrown, fixed per index. */
const BURST = Array.from({ length: 11 }, (_, i) => {
  const a = -Math.PI * (0.08 + 0.84 * (i / 10))
  const reach = 26 + frac(i * 5.31) * 34
  return { dx: Math.cos(a) * reach, dy: Math.sin(a) * (reach * 0.5), r: 1.2 + frac(i * 9.7) * 1.9 }
})

/** A wheel with a hubcap and spokes, so that turning is something you can see. */
function Wheel({ cx }: { cx: number }) {
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, 760, 760, 1520] }}
      transition={{ duration: CAR_SPAN, delay: T.car, times: CAR_TIMES, ease: 'linear' }}
    >
      <circle cx={cx} cy={GROUND} r="14.5" fill="#0a1024" />
      <circle cx={cx} cy={GROUND} r="9.5" fill="url(#dc-rim)" />
      <circle cx={cx} cy={GROUND} r="3" fill="#8ea6d6" />
      <path
        d={`M${cx} ${GROUND - 9} V${GROUND - 4} M${cx} ${GROUND + 4} V${GROUND + 9}
            M${cx - 9} ${GROUND} H${cx - 4} M${cx + 4} ${GROUND} H${cx + 9}`}
        stroke="#3d4f7a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </motion.g>
  )
}

/**
 * The finale lockup: the mark draws itself as a road, the dot lands at its
 * end, the name rises a letter at a time. Shared with the reduced-motion
 * still, which renders it with `still` and no delays.
 */
export function LaunchLockup({ still = false, delay = 0 }: { still?: boolean; delay?: number }) {
  const d = (t: number) => (still ? 0 : delay + t)
  const dur = (t: number) => (still ? 0 : t)
  return (
    <div className="flex min-h-[92px] flex-col items-center">
      <div className="relative flex items-center gap-3 px-1">
        <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden>
          <defs>
            <linearGradient id="dc-mark" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#96b8ff" />
            </linearGradient>
          </defs>
          <motion.path
            d={MARK_PATH}
            fill="none"
            stroke="url(#dc-mark)"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: still ? 1 : 0, opacity: still ? 1 : 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: dur(0.7), delay: d(0), ease: EASE, opacity: { duration: dur(0.1), delay: d(0) } }}
          />
          <motion.circle
            cx={MARK_DOT.cx}
            cy={MARK_DOT.cy}
            r={MARK_DOT.r}
            fill="#96b8ff"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ scale: still ? 1 : 0, opacity: still ? 1 : 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16, delay: d(0.62) }}
          />
        </svg>

        <span className="text-display flex text-[30px] leading-none font-extrabold tracking-[-0.045em] text-white">
          {BRAND.name.split('').map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              initial={{ opacity: still ? 1 : 0, y: still ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur(0.5), delay: d(0.3 + i * 0.055), ease: EASE }}
            >
              {ch}
            </motion.span>
          ))}
        </span>

        {/* The shine rides in its own clipped layer, so the letters themselves
            are never clipped while they rise. */}
        {!still && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
            <motion.span
              className="absolute inset-y-0 w-16"
              style={{
                background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.85), transparent)',
                mixBlendMode: 'overlay',
              }}
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 260, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.78, delay: d(0.72), ease: 'easeInOut' }}
            />
          </span>
        )}
      </div>

      <motion.p
        className="mt-3 text-[10px] font-bold text-brand-300 uppercase"
        initial={{ opacity: still ? 1 : 0, letterSpacing: still ? '0.32em' : '0.14em' }}
        animate={{ opacity: 1, letterSpacing: '0.32em' }}
        transition={{ duration: dur(0.6), delay: d(0.55), ease: EASE }}
      >
        {BRAND.tagline}
      </motion.p>
    </div>
  )
}

export function LaunchAnimation({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, LAUNCH_ANIMATION_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="relative flex w-full max-w-[440px] flex-col items-center px-4">
      {/* A camera rather than a zoom: pushes in on the packing, holds
          through the load, then pans after the car as it leaves. */}
      <motion.svg
        viewBox="0 0 300 210"
        className="w-full"
        aria-hidden
        initial={{ scale: 1.1, x: 0, y: 5 }}
        animate={{
          scale: [1.1, 1, 1, 1.035, 1.1],
          x: [0, 0, 0, -7, -26],
          y: [5, 0, 0, 0, -3],
        }}
        transition={{ duration: T.done, times: [0, 0.17, 0.72, 0.83, 1], ease: EASE }}
      >
        <defs>
          <linearGradient id="dc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a1a4f" />
            <stop offset="0.55" stopColor="#2b2f8f" />
            <stop offset="0.82" stopColor="#7a4a9a" />
            <stop offset="1" stopColor="#f2955e" />
          </linearGradient>
          <radialGradient id="dc-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffe6a3" />
            <stop offset="0.7" stopColor="#ffb668" />
            <stop offset="1" stopColor="#ff9a5a" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="dc-sunglow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffb070" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffb070" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dc-hills" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2d78" />
            <stop offset="1" stopColor="#141a4e" />
          </linearGradient>
          <linearGradient id="dc-road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a2354" />
            <stop offset="1" stopColor="#0b1233" />
          </linearGradient>
          <linearGradient id="dc-flap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F0C489" />
            <stop offset="1" stopColor="#C9985A" />
          </linearGradient>
          <linearGradient id="dc-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#CE9B5C" />
            <stop offset="0.55" stopColor="#B98548" />
            <stop offset="1" stopColor="#95653A" />
          </linearGradient>
          <linearGradient id="dc-tape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FCEBC6" />
            <stop offset="1" stopColor="#DCBE8C" />
          </linearGradient>
          {/* The car: white, lit from the sunset on the right, cooler and
              darker toward the sill. */}
          <linearGradient id="dc-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#e9eef9" />
            <stop offset="1" stopColor="#c6cfe3" />
          </linearGradient>
          <linearGradient id="dc-roof" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#dfe6f4" />
            <stop offset="1" stopColor="#fff4e6" />
          </linearGradient>
          <linearGradient id="dc-glass" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#b9d0ff" />
            <stop offset="1" stopColor="#4d6fc4" />
          </linearGradient>
          <linearGradient id="dc-sill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a97b5" />
            <stop offset="1" stopColor="#4a556f" />
          </linearGradient>
          <radialGradient id="dc-rim">
            <stop offset="0" stopColor="#e7edf9" />
            <stop offset="1" stopColor="#8fa3cc" />
          </radialGradient>
          <linearGradient id="dc-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dc-streak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7ba5ff" stopOpacity="0" />
            <stop offset="1" stopColor="#a9c6ff" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="dc-ground" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2c4a94" stopOpacity="0" />
            <stop offset="0.5" stopColor="#8ab0ff" stopOpacity="1" />
            <stop offset="1" stopColor="#2c4a94" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dc-reflect" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dfe6f4" stopOpacity="0.35" />
            <stop offset="1" stopColor="#dfe6f4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dc-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="dc-pool">
            <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
          </radialGradient>
          <clipPath id="dc-car-clip">
            <path d={CAR_BODY} />
          </clipPath>
          <clipPath id="dc-frame">
            <rect x="0" y="0" width="300" height="210" rx="14" />
          </clipPath>
        </defs>

        <g clipPath="url(#dc-frame)">
          {/* ══ THE EVENING ══ sky, a sun about to go, hills, a skyline. */}
          <motion.rect
            x="0"
            y="0"
            width="300"
            height={GROUND + 2}
            fill="url(#dc-sky)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
          {STARS.map((s, i) => (
            <motion.circle
              key={`s-${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#c9dbff"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.2, 0.55] }}
              transition={{ duration: 3.4, delay: s.delay, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            />
          ))}
          <motion.circle
            cx="222"
            cy="146"
            r="60"
            fill="url(#dc-sunglow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.1, ease: EASE }}
          />
          <motion.circle
            cx="222"
            cy="150"
            r="19"
            fill="url(#dc-sun)"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.1, ease: EASE }}
          />
          {/* Skyline, then the hills in front of it. */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ duration: 1, delay: 0.25 }}>
            {CITY.map((b, i) => (
              <rect key={`c-${i}`} x={b.x} y={GROUND - 24 - b.h} width={b.w} height={b.h + 24} fill="#1c2166" />
            ))}
          </motion.g>
          <motion.path
            d={`M0 ${GROUND - 26} C30 ${GROUND - 44} 60 ${GROUND - 20} 95 ${GROUND - 30} C130 ${GROUND - 42} 160 ${GROUND - 22} 195 ${GROUND - 34} C230 ${GROUND - 46} 265 ${GROUND - 24} 300 ${GROUND - 30} V${GROUND} H0 Z`}
            fill="url(#dc-hills)"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: EASE }}
          />
          {/* Wet road, and the reflection of the sky in it. */}
          <rect x="0" y={GROUND - 2} width="300" height="34" fill="url(#dc-road)" />
          <motion.ellipse
            cx="222"
            cy={GROUND + 10}
            rx="40"
            ry="7"
            fill="#ffb070"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.16 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />
          <motion.line
            x1="0"
            y1={GROUND - 1}
            x2="300"
            y2={GROUND - 1}
            stroke="url(#dc-ground)"
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: T.box, ease: EASE }}
          />
          {/* Lane dashes. Still while the road is a stage; they stream left
              as the car arrives and again as it leaves — travel, without
              moving the horizon. */}
          <motion.g
            initial={{ x: 0 }}
            animate={{ x: [0, -120, -120, -360] }}
            transition={{ duration: CAR_SPAN, delay: T.car, times: CAR_TIMES, ease: ['easeOut', 'linear', 'easeIn'] }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={`d-${i}`} x={-30 + i * 60} y={GROUND + 12} width="26" height="2.2" rx="1.1" fill="#7f95c9" opacity="0.5" />
            ))}
          </motion.g>
        </g>

        {/* The closing of the box throws light across the whole frame. */}
        <motion.rect
          x="0"
          y="0"
          width="300"
          height="210"
          rx="14"
          fill="#c8d8ff"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0] }}
          transition={{ duration: 0.5, delay: T.tape, ease: 'easeOut' }}
        />

        {/* ══ THE BOX ══ painted before the car, so the car's rear body
            occludes its lower half once it is loaded. The origin is pinned to
            the carton in view-box units, NOT to this group's bounding box —
            the group also holds the items and the burst, and scaling about
            its bbox centre lifted the parcel onto the roof. It has to be
            said as originX/originY and a view-box transformBox: framer-motion
            rebuilds transform-origin for SVG from those two and, left alone,
            measures it against the group's own bbox. */}
        <motion.g
          style={{ originX: `${BX}px`, originY: `${GROUND - BH / 2}px`, transformBox: 'view-box' }}
          initial={{ x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{
            /* kerb → (car covers it) → up over the tailgate → into the boot → away */
            x: [0, -66, -66, -60, -66, -66, 274],
            y: [0, KERB_Y, KERB_Y, -36, 11, 11, 11],
            scale: [1, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
            rotate: [0, 0, 0, -12, 0, 0, 0],
          }}
          transition={{
            duration: BOX_SPAN,
            delay: BOX_KEYS[0],
            times: BOX_TIMES,
            ease: [EASE, 'linear', [0.3, 0, 0.5, 1], GRAVITY, 'linear', CRUISE],
          }}
        >
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
            initial={{ y: -110, scaleY: 1, opacity: 0 }}
            animate={{ y: [-110, 0, 0, 0], scaleY: [1, 1, 0.84, 1], opacity: [0, 1, 1, 1] }}
            transition={{ duration: 0.74, delay: T.box, times: [0, 0.6, 0.76, 1], ease: [GRAVITY, EASE, EASE] }}
          >
            <motion.ellipse
              cx={BX}
              cy={GROUND + 2}
              rx="56"
              ry="6"
              fill="#020818"
              initial={{ opacity: 0, scaleX: 1.5 }}
              animate={{ opacity: [0, 0.6, 0.6, 0], scaleX: [1.5, 1, 1, 0.7] }}
              transition={{
                duration: T.load + 0.2 - T.box,
                delay: T.box,
                times: [0, 0.19, (T.load - T.box) / (T.load + 0.2 - T.box), 1],
                ease: EASE,
              }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />

            {/* Pass 1 — the inside. */}
            <rect x={L} y={TOP} width={BW} height={BH} rx="2" fill={CARD.inner} />

            {/* Pass 2 — the contents, each with a streak behind it. */}
            {ITEMS.map((it, i) => {
              const d = T.item + i * T.gap
              return (
                <motion.g
                  key={it.id}
                  initial={{ x: BX + it.x, y: 4, rotate: it.spin, opacity: 0 }}
                  animate={{ x: BX + it.x, y: GROUND - 20, rotate: 0, opacity: 1 }}
                  transition={{ duration: T.fall, delay: d, ease: GRAVITY, opacity: { duration: 0.1, delay: d } }}
                >
                  <motion.rect
                    x="-1.8"
                    y="-44"
                    width="3.6"
                    height="30"
                    rx="1.8"
                    fill="url(#dc-streak)"
                    initial={{ opacity: 0, scaleY: 0.4 }}
                    animate={{ opacity: [0, 0.75, 0], scaleY: [0.4, 1, 0.5] }}
                    transition={{ duration: T.fall, delay: d, times: [0, 0.45, 1] }}
                    style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
                  />
                  {it.node}
                </motion.g>
              )
            })}

            {/* Dust kicked off the rim as each one drops over the edge. */}
            {ITEMS.map((it, i) => {
              const d = T.item + i * T.gap + T.fall * 0.62
              return (
                <g key={`p-${it.id}`}>
                  {[-1, 1].map((s) => (
                    <motion.circle
                      key={s}
                      cx={BX + it.x + s * 12}
                      cy={TOP + 4}
                      r="2"
                      fill="#e2c79c"
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: [0, 0.55, 0], scale: [0.4, 1.5, 2], y: [0, -7, -11] }}
                      transition={{ duration: 0.42, delay: d, ease: 'easeOut' }}
                      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    />
                  ))}
                </g>
              )
            })}

            {/* Pass 3 — the front wall, starting below the rim. */}
            <rect x={L} y={TOP + MOUTH} width={BW} height={BH - MOUTH} rx="2" fill="url(#dc-front)" />
            <path d={`M${L} ${TOP + MOUTH} H${R} V${GROUND} H${L} Z`} fill="none" stroke={CARD.edge} strokeWidth="1.4" />
            <path d={`M${BX} ${TOP + MOUTH} V${GROUND}`} stroke={CARD.edge} strokeWidth="1.2" opacity="0.5" />
            {/* A shipping label, because a parcel without one is a box. */}
            <rect x={L + 10} y={TOP + MOUTH + 12} width="30" height="18" rx="1.5" fill="#FBF6EA" />
            <path
              d={`M${L + 14} ${TOP + MOUTH + 17} H${L + 32} M${L + 14} ${TOP + MOUTH + 21} H${L + 28} M${L + 14} ${TOP + MOUTH + 25} H${L + 24}`}
              stroke="#B9A88A"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            {/* Flaps — signed, and with a little spring at the top of the swing. */}
            {([
              { k: 'l', d: `M${BX} ${TOP} H${L} L${L + 4} ${TOP - FLAP_H} H${BX} Z`, to: 62, org: '100% 100%' },
              { k: 'r', d: `M${BX} ${TOP} H${R} L${R - 4} ${TOP - FLAP_H} H${BX} Z`, to: -62, org: '0% 100%' },
            ] as const).map((f) => (
              <motion.path
                key={f.k}
                d={f.d}
                fill="url(#dc-flap)"
                stroke={CARD.edge}
                strokeWidth="1.3"
                strokeLinejoin="round"
                style={{ transformBox: 'fill-box', transformOrigin: f.org }}
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, f.to * 1.1, f.to, f.to, 0] }}
                transition={{ duration: FLAP_SPAN, delay: T.flap, times: [0, FLAP_OPEN * 0.78, FLAP_OPEN, FLAP_HOLD, 1], ease: EASE }}
              />
            ))}

            <motion.rect
              x={L + 3}
              y={TOP - 2}
              width={BW - 6}
              height="6"
              rx="1.4"
              fill="url(#dc-tape)"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.34, delay: T.tape, ease: EASE }}
              style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
            />
            <motion.circle
              cy={TOP + 1}
              r="4.5"
              fill="#ffffff"
              initial={{ cx: L + 3, opacity: 0 }}
              animate={{ cx: R - 3, opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.34, delay: T.tape, ease: EASE }}
            />
          </motion.g>
        </motion.g>

        {/* ══ THE LANDING ══ rings out from under the box, and grit with it. */}
        {[0, 0.09].map((off, i) => (
          <motion.ellipse
            key={`ring-${i}`}
            cx={BX}
            cy={GROUND}
            rx="22"
            ry="4.5"
            fill="none"
            stroke="#8ab0ff"
            strokeWidth="2"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 3.6], opacity: [0.75, 0] }}
            transition={{ duration: 0.8, delay: T.land + off, ease: 'easeOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}
        {BURST.map((p, i) => (
          <motion.circle
            key={`b-${i}`}
            cx={BX}
            cy={GROUND - 1}
            r={p.r}
            fill="#dcc49b"
            initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: [0, 0.8, 0], x: p.dx, y: [0, p.dy, p.dy * 0.3], scale: [1, 1, 0.4] }}
            transition={{ duration: 0.62, delay: T.land, ease: 'easeOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}

        {/* ══ THE CAR ══ */}
        <motion.g
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: [-300, 0, 0, 340], opacity: [0, 1, 1, 1] }}
          transition={{ duration: CAR_SPAN, delay: T.car, times: CAR_TIMES, ease: [EASE, EASE, CRUISE] }}
        >
          <ellipse cx="150" cy={GROUND + 3} rx="106" ry="5" fill="#020818" opacity="0.55" />
          {/* Wet-road smear under the flank — the reflection, without a blur. */}
          <rect x="58" y={GROUND + 1} width="192" height="24" fill="url(#dc-reflect)" opacity="0.7" />
          {/* And the pool the headlights throw down the road ahead. */}
          <ellipse cx="292" cy={GROUND - 6} rx="62" ry="14" fill="url(#dc-pool)" />

          {/* Body and glass ride the suspension; the wheels do not. */}
          <motion.g
            initial={{ y: 0 }}
            animate={{ y: [0, 3.2, -1.2, 0] }}
            transition={{ duration: 0.62, delay: T.load + 0.38, times: [0, 0.34, 0.66, 1], ease: 'easeOut' }}
          >
            {/* Tailgate: open on arrival, swings shut after the load. */}
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: '100% 0%' }}
              initial={{ rotate: -74 }}
              animate={{ rotate: [-74, -74, 0] }}
              transition={{ duration: 0.95, delay: T.gate - 0.6, times: [0, 0.62, 1], ease: EASE }}
            >
              <path d="M94 139 L60 144 Q51 146 50 155 L88 152 Z" fill="url(#dc-roof)" />
              <path d="M92 141 L64 145.5" stroke="#b7c2da" strokeWidth="1" opacity="0.8" />
            </motion.g>

            <path d={CAR_BODY} fill="url(#dc-body)" />
            {/* Wheel arches painted over the body so they cut into it. */}
            <circle cx="92" cy={GROUND - 2} r="17.5" fill="#0a1024" />
            <circle cx="206" cy={GROUND - 2} r="17.5" fill="#0a1024" />
            <path d={CAR_ROOF} fill="url(#dc-roof)" />
            {/* Sill: the darker band along the bottom that gives the flank a floor. */}
            <path d={`M46 ${GROUND - 9} H254 V${GROUND} H46 Z`} fill="url(#dc-sill)" opacity="0.9" />
            {/* Glass. */}
            <path d="M97 138 Q108 126 122 125 L142 125 V138 Z" fill="url(#dc-glass)" />
            <path d="M150 125 L172 125 Q191 126 200 138 L150 138 Z" fill="url(#dc-glass)" />
            {/* Pillar and door seam. */}
            <path d="M146 125 V139" stroke="#c6cfe3" strokeWidth="2.2" />
            <path d="M146 140 V163" stroke="#b7c2da" strokeWidth="1" opacity="0.9" />
            <rect x="150" y="147" width="11" height="2.4" rx="1.2" fill="#a9b6cf" />
            {/* A crease along the flank, which is what stops a car reading as
                a coloured blob. */}
            <path d="M52 156 H250" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />

            {/* Lights: warm at the front, red at the back, both glowing. */}
            <ellipse cx="249" cy="152" rx="5.5" ry="3.6" fill="#fff1c9" />
            <path d="M254 148 L300 138 L300 166 L254 156 Z" fill="url(#dc-beam)" />
            <rect x="44" y="147" width="7" height="11" rx="3" fill="#ff5a5a" opacity="0.28" />
            <rect x="45.5" y="149" width="4.5" height="7" rx="2" fill="#ff5a5a" />

            {/* Highlight sweeping down the flank — a clipped bar, not a
                filter, so it costs one more rect and nothing else. */}
            <g clipPath="url(#dc-car-clip)">
              <g transform="skewX(-20)">
                <motion.rect
                  y="108"
                  width="30"
                  height="96"
                  fill="url(#dc-sheen)"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: [-20, 330], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.85, delay: T.load + 0.4, ease: EASE }}
                />
                <motion.rect
                  y="108"
                  width="24"
                  height="96"
                  fill="url(#dc-sheen)"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: [-20, 330], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6, delay: T.drive, ease: 'easeIn' }}
                />
              </g>
            </g>
          </motion.g>

          <Wheel cx={92} />
          <Wheel cx={206} />
        </motion.g>

        {/* Ghosts of the body, one frame behind — the cheapest honest motion
            blur there is, and the only one that does not re-rasterise. */}
        {[
          { o: 0.22, lag: 0.045 },
          { o: 0.12, lag: 0.09 },
        ].map((g, i) => (
          <motion.path
            key={`ghost-${i}`}
            d={CAR_BODY}
            fill="#e9eef9"
            opacity={g.o}
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: [0, 340], opacity: [0, g.o, 0] }}
            transition={{ duration: 0.55 - g.lag, delay: T.drive, ease: CRUISE }}
          />
        ))}

        {/* Speed lines — behind it on the way in, and again on the way out. */}
        {[0, 1, 2].map((i) => (
          <motion.rect
            key={`in-${i}`}
            x="16"
            y={132 + i * 13}
            height="2.4"
            rx="1.2"
            fill="#9db8ff"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: [0, 46, 0], opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.46, delay: T.car + 0.1 + i * 0.05, ease: 'easeOut' }}
          />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.rect
            key={`out-${i}`}
            x="22"
            y={124 + i * 12}
            height="2.6"
            rx="1.3"
            fill="#c9dbff"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: [0, 96, 0], opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.55, delay: T.drive + i * 0.045, ease: 'easeOut' }}
          />
        ))}

        {/* A puff off the back as it pulls away. */}
        {[0, 1, 2, 3].map((i) => (
          <motion.circle
            key={`ex-${i}`}
            cx={92 - i * 9}
            cy={GROUND - 4}
            r="4"
            fill="#9db8ff"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.34, 0], scale: [0.4, 1.7, 2.6], x: [0, -18, -34] }}
            transition={{ duration: 0.62, delay: T.drive + i * 0.06, ease: 'easeOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}
      </motion.svg>

      <LaunchLockup delay={T.word} />
    </div>
  )
}

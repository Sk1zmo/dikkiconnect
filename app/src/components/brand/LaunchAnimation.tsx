import { useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { MARK_DOT, MARK_PATH } from '@/components/brand/Logo'
import { BRAND } from '@/lib/brand'

/* ═══════════════════════════════════════════════════════════════════════════
   The opening — a parcel packed and sent, at dusk. Full screen.

     0.00  the evening settles: a low sun, hills, the road
     0.15  a carton falls from the top of the screen, open, with everything
           still inside it; it hits the ground, squashes, and the whole
           world shakes — the contents jump and rattle back down, dust and
           grit go out from under it, a smaller parcel lands beside it and
           tumbles onto its side
     1.20  the flaps swing shut, overshooting and settling; a tape seam runs
           across the seal and the frame flashes
     1.85  a white hatchback pulls up from the left, indicators blinking, and
           stops beside the parcels with a rock on its springs
     2.75  the rear door opens toward us; the small parcel hops in onto the
           back seat; the door shuts
     3.35  the tailgate lifts; the carton arcs over it into the boot; the
           suspension takes the weight; the tailgate shuts
     4.15  the car charges: motes drift in from everywhere and gather on it,
           it glows blue and trembles, the road lights up under it
     4.95  boost — a jet from the back, the car launches right, ghosts and
           speed lines behind it, the camera swings after it, the picture
           shakes with the thrust
     5.55  cut to the road behind the car: it is already small and going,
           flames under it, down the highway toward the sun
     5.80  the name rises in the sky over it; at 6.60 the screen dissolves —
           pixel by pixel — into the landing, which is that same view painted

   6.6s, tap anywhere to skip, replaced by a still frame under reduced motion.

   Why a car and not a van. The tempting drawing on a delivery app is a van and
   it would be the wrong one: Stowza owns no vehicle and nothing new goes on
   the road because of it. The proposition is that a hatchback is already
   making that journey with an empty boot and the parcel rides in the space
   that was going to travel empty anyway. Two parcels here, one in the boot
   and one on the back seat, because that is the whole car being used.

   Transform, opacity and gradient paint only. Glows are stacked radial
   gradients and the highlight sweep is a clipped rectangle, because an SVG
   blur filter over moving content re-rasterises every frame and a launch
   screen that stutters is worse than one that is plain.

   The stage is a 360 × 720 portrait view-box drawn with `slice`, so it covers
   any phone: a short one loses a little sky and road, a tall one sees more
   verge. Everything that matters lives inside x 0–360, y 40–680.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const
const GRAVITY = [0.45, 0, 0.7, 0.35] as const
const THRUST = [0.7, 0, 0.9, 0.4] as const

export const T = {
  drop: 0.15,
  land: 0.72,
  small: 0.55,
  smallLand: 1.02,
  flap: 1.2,
  tape: 1.62,
  car: 1.85,
  stop: 2.55,
  door: 2.75,
  seat: 2.95,
  doorShut: 3.25,
  gate: 3.35,
  boot: 3.55,
  gateShut: 4.05,
  charge: 4.15,
  boost: 4.95,
  cut: 5.55,
  word: 5.8,
  done: 6.6,
}

/** How long the whole thing runs, for whoever is holding the screen up. */
export const LAUNCH_ANIMATION_MS = T.done * 1000

/* ── The stage ──────────────────────────────────────────────────────────── */
const W = 360
const H = 720
const GROUND = 520

/* ── The carton ─────────────────────────────────────────────────────────── */
const BW = 96
const BH = 70
const BX = 72
const TOP = GROUND - BH
const L = BX - BW / 2
const R = BX + BW / 2
const FLAP_H = 14
const CARD = { edge: '#9A6C3C', inner: '#4A2F13' }

/* ── The small parcel ───────────────────────────────────────────────────── */
const SW = 40
const SH = 32
const SX = 140

/* ── The car, in its own coordinates: rear bumper at x = 0, ground at y = 0 ── */
const CAR_X = 152
const CAR_LEN = 200
const CAR_BODY = `M0 0 V-27 Q0 -34 8 -35 L36 -37 Q52 -56 74 -57 L128 -57 Q148 -56 160 -37 L192 -32 Q${CAR_LEN} -30 ${CAR_LEN} -20 V0 Z`
const CAR_ROOF = 'M36 -37 Q52 -56 74 -57 L128 -57 Q148 -56 160 -37 Z'
const WHEEL_A = 40
const WHEEL_B = 158
/* Rear door: hinge at its front edge, so it opens toward the viewer. */
const DOOR = { x1: 60, x2: 104, top: -52, bottom: -3 }

/**
 * Background dust and the skyline, placed off a hash rather than
 * Math.random so the field is the same every launch.
 */
const frac = (n: number) => {
  const v = Math.sin(n) * 43758.5453
  return v - Math.floor(v)
}
const STARS = Array.from({ length: 26 }, (_, i) => ({
  x: 8 + frac(i * 12.9898) * (W - 16),
  y: 40 + frac(i * 78.233) * 260,
  r: 0.5 + frac(i * 39.425) * 1.3,
  delay: frac(i * 21.7) * 2.6,
}))
const CITY = Array.from({ length: 16 }, (_, i) => ({
  x: 170 + i * 12 + frac(i * 3.1) * 5,
  w: 5 + frac(i * 7.7) * 7,
  h: 8 + frac(i * 5.3) * 22,
}))
/* Motes that gather on the car when it charges: from a ring around it. */
const MOTES = Array.from({ length: 28 }, (_, i) => {
  const a = frac(i * 9.13) * Math.PI * 2
  const reach = 120 + frac(i * 4.71) * 160
  return { x: CAR_X + CAR_LEN / 2 + Math.cos(a) * reach, y: GROUND - 30 + Math.sin(a) * reach * 0.6, r: 1.4 + frac(i * 2.9) * 2.2, d: frac(i * 6.1) * 0.35 }
})
/** Where each grain of the landing burst is thrown, fixed per index. */
const BURST = Array.from({ length: 14 }, (_, i) => {
  const a = -Math.PI * (0.06 + 0.88 * (i / 13))
  const reach = 30 + frac(i * 5.31) * 44
  return { dx: Math.cos(a) * reach, dy: Math.sin(a) * (reach * 0.5), r: 1.3 + frac(i * 9.7) * 2 }
})

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



/* The whole picture jolts: on the landing, and again on the thrust. */
const SHAKE = {
  x: [0, -7, 6, -5, 4, -3, 2, -1, 0],
  y: [0, 5, -4, 4, -3, 2, -1, 1, 0],
}
const TREMBLE = { x: [0, -1.5, 1.5, -1.2, 1.2, -1.5, 1.5, -1, 1, -0.6, 0.6, 0] }


/* The body's ride, as one list so x, y and time can never disagree: the
   rock when it stops, the dip when the carton lands in the boot, the tremble
   while it charges. */
const BODY_KEYS: Array<[number, number, number]> = [
  [T.stop, 0, 0],
  [T.stop + 0.06, 0, 3],
  [T.stop + 0.12, 0, -2],
  [T.stop + 0.18, 0, 0],
  [T.boot + 0.24, 0, 0],
  [T.boot + 0.36, 0, 3.4],
  [T.boot + 0.5, 0, -1.4],
  [T.boot + 0.6, 0, 0],
  ...TREMBLE.x.map((x, i): [number, number, number] => [T.charge + 0.05 + i * 0.062, x, 0]),
  [T.boost - 0.02, 0, 0],
  [T.boost, 0, 0],
]
const BODY = {
  duration: T.boost - T.stop,
  times: BODY_KEYS.map(([t]) => (t - T.stop) / (T.boost - T.stop)),
  x: BODY_KEYS.map(([, x]) => x),
  y: BODY_KEYS.map(([, , y]) => y),
}

/** A wheel with a hubcap and spokes, so that turning is something you can see. */
function Wheel({ cx, spin }: { cx: number; spin: { times: number[]; rotate: number[]; duration: number; delay: number } }) {
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      initial={{ rotate: 0 }}
      animate={{ rotate: spin.rotate }}
      transition={{ duration: spin.duration, delay: spin.delay, times: spin.times, ease: 'linear' }}
    >
      <circle cx={cx} cy="0" r="14.5" fill="#0a1024" />
      <circle cx={cx} cy="0" r="9.5" fill="url(#dc-rim)" />
      <circle cx={cx} cy="0" r="3" fill="#8ea6d6" />
      <path
        d={`M${cx} -9 V-4 M${cx} 4 V9 M${cx - 9} 0 H${cx - 4} M${cx + 4} 0 H${cx + 9}`}
        stroke="#3d4f7a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </motion.g>
  )
}

/* Wheels turn on arrival, hold, and turn again — hard — on the boost. */
const WHEEL_SPAN = T.boost + 0.6 - T.car
const WHEEL = {
  duration: WHEEL_SPAN,
  delay: T.car,
  times: [0, (T.stop - T.car) / WHEEL_SPAN, (T.boost - T.car) / WHEEL_SPAN, 1],
  rotate: [0, 720, 720, 2600],
}

export function LaunchAnimation({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, LAUNCH_ANIMATION_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="absolute inset-0">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="dc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#070f3a" />
            <stop offset="0.45" stopColor="#1e2a86" />
            <stop offset="0.72" stopColor="#5a3f9a" />
            <stop offset="0.86" stopColor="#c86a72" />
            <stop offset="1" stopColor="#f5a25e" />
          </linearGradient>
          <radialGradient id="dc-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff0b8" />
            <stop offset="0.65" stopColor="#ffb668" />
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
            <stop offset="1" stopColor="#070d2b" />
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
          <linearGradient id="dc-reflect" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dfe6f4" stopOpacity="0.35" />
            <stop offset="1" stopColor="#dfe6f4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dc-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="dc-charge">
            <stop offset="0" stopColor="#7ba5ff" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#3a68f5" stopOpacity="0.35" />
            <stop offset="1" stopColor="#3a68f5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dc-jet" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.25" stopColor="#9dc0ff" />
            <stop offset="0.7" stopColor="#3a68f5" stopOpacity="0.8" />
            <stop offset="1" stopColor="#3a68f5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dc-jet-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.3" stopColor="#9dc0ff" />
            <stop offset="1" stopColor="#3a68f5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dc-tarmac" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a3170" />
            <stop offset="1" stopColor="#0b1233" />
          </linearGradient>
          <clipPath id="dc-car-clip">
            <path d={CAR_BODY} />
          </clipPath>
          <clipPath id="dc-door-clip">
            <rect x={DOOR.x1} y={DOOR.top} width={DOOR.x2 - DOOR.x1} height={DOOR.bottom - DOOR.top} />
          </clipPath>
        </defs>

        {/* ══ THE EVENING ══ shared by both views: sky, stars, a sun about to go. */}
        <motion.rect x="0" y="0" width={W} height={H} fill="url(#dc-sky)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        {STARS.map((s, i) => (
          <motion.circle
            key={`s-${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#c9dbff"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.65, 0.2, 0.6] }}
            transition={{ duration: 3.4, delay: s.delay, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        ))}
        <motion.circle cx="252" cy="446" r="110" fill="url(#dc-sunglow)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.1 }} />
        <motion.circle cx="252" cy="452" r="34" fill="url(#dc-sun)" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, delay: 0.1, ease: EASE }} />

        {/* ══ THE SIDE OF THE ROAD ══ the first five beats. The group is the
            camera: it shakes on the landing and the thrust, and swings after
            the car when it goes. */}
        <motion.g
          initial={{ x: 0, y: 0 }}
          animate={{
            x: [0, 0, ...SHAKE.x, 0, ...SHAKE.x.map((v) => v * 1.4), -60, -260],
            y: [0, 0, ...SHAKE.y, 0, ...SHAKE.y.map((v) => v * 1.2), 0, 0],
          }}
          transition={{
            duration: T.cut,
            times: [
              0,
              T.land / T.cut,
              ...SHAKE.x.map((_, i) => (T.land + (i + 1) * 0.045) / T.cut),
              (T.boost - 0.01) / T.cut,
              ...SHAKE.x.map((_, i) => (T.boost + (i + 1) * 0.06) / T.cut),
              (T.boost + 0.6) / T.cut,
              1,
            ],
            ease: 'linear',
          }}
        >
          {/* Skyline, then the hills. */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ duration: 1, delay: 0.25 }}>
            {CITY.map((b, i) => (
              <rect key={`c-${i}`} x={b.x} y={GROUND - 40 - b.h} width={b.w} height={b.h + 40} fill="#1c2166" />
            ))}
          </motion.g>
          <motion.path
            d={`M-300 ${GROUND - 44} C-200 ${GROUND - 70} -80 ${GROUND - 30} 40 ${GROUND - 50} C120 ${GROUND - 66} 200 ${GROUND - 34} 300 ${GROUND - 56} C400 ${GROUND - 74} 500 ${GROUND - 40} 700 ${GROUND - 50} V${H} H-300 Z`}
            fill="url(#dc-hills)"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: EASE }}
          />
          {/* The road, wet, with the sky in it. */}
          <rect x="-300" y={GROUND - 4} width="1300" height={H} fill="url(#dc-road)" />
          <motion.ellipse cx="252" cy={GROUND + 18} rx="70" ry="10" fill="#ffb070" initial={{ opacity: 0 }} animate={{ opacity: 0.16 }} transition={{ duration: 1.2, delay: 0.3 }} />
          <path d={`M-300 ${GROUND - 3} H1000`} stroke="#8ab0ff" strokeWidth="1.4" opacity="0.5" />
          {/* Lane dashes: still, then streaming when the car moves. */}
          <motion.g
            initial={{ x: 0 }}
            animate={{ x: [0, -140, -140, -900] }}
            transition={{ duration: T.boost + 0.6 - T.car, delay: T.car, times: WHEEL.times, ease: ['easeOut', 'linear', 'easeIn'] }}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <rect key={`d-${i}`} x={-320 + i * 60} y={GROUND + 22} width="28" height="2.6" rx="1.3" fill="#7f95c9" opacity="0.5" />
            ))}
          </motion.g>

          {/* The closing of the box throws light across the whole frame. */}
          <motion.rect
            x="-300"
            y="0"
            width="1300"
            height={H}
            fill="#c8d8ff"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.5, delay: T.tape, ease: 'easeOut' }}
          />

          {/* ══ THE CARTON ══ painted before the car so the body occludes it
              once it is in the boot. Origin pinned to the carton's centre in
              view-box units (originX/originY + view-box transformBox: framer
              otherwise measures against the group's own bbox). */}
          <motion.g
            style={{ originX: `${BX}px`, originY: `${GROUND - BH / 2}px`, transformBox: 'view-box' }}
            initial={{ x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{
              /* wait → up over the tailgate → drop into the boot → hold → away with the car */
              x: [0, 0, CAR_X + 22 - BX, CAR_X + 22 - BX, CAR_X + 22 - BX, CAR_X + 22 - BX + 700],
              y: [0, 0, -96, 8, 8, 8],
              scale: [1, 1, 0.42, 0.42, 0.42, 0.42],
              rotate: [0, 0, -14, 0, 0, 0],
            }}
            transition={{
              duration: T.boost + 0.6 - T.gate,
              delay: T.gate,
              times: [
                0,
                (T.boot - T.gate) / (T.boost + 0.6 - T.gate),
                (T.boot + 0.24 - T.gate) / (T.boost + 0.6 - T.gate),
                (T.boot + 0.46 - T.gate) / (T.boost + 0.6 - T.gate),
                (T.boost - T.gate) / (T.boost + 0.6 - T.gate),
                1,
              ],
              ease: ['linear', [0.3, 0, 0.5, 1], GRAVITY, 'linear', THRUST],
            }}
          >
            {/* The fall, and the squash when it lands. */}
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              initial={{ y: -(GROUND + 120), scaleY: 1, scaleX: 1 }}
              animate={{ y: [-(GROUND + 120), 0, 0, 0, 0], scaleY: [1, 1, 0.78, 1.06, 1], scaleX: [1, 1, 1.14, 0.97, 1] }}
              transition={{ duration: T.land + 0.34 - T.drop, delay: T.drop, times: [0, 0.63, 0.74, 0.88, 1], ease: [GRAVITY, 'easeOut', EASE, EASE] }}
            >
              <motion.ellipse
                cx={BX}
                cy={GROUND + 3}
                rx="60"
                ry="7"
                fill="#020818"
                initial={{ opacity: 0, scaleX: 1.6 }}
                animate={{ opacity: [0, 0.6, 0.6], scaleX: [1.6, 1, 1] }}
                transition={{ duration: T.land - T.drop + 0.1, delay: T.drop, times: [0, 0.9, 1] }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />

              {/* Pass 1 — the inside. */}
              <rect x={L} y={TOP} width={BW} height={BH} rx="2" fill={CARD.inner} />

              {/* Pass 2 — the contents. They ride down in the box, and on the
                  landing they jump and rattle back into place. */}
              <motion.g
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: [0, -26, 0, -12, 0, -5, 0, -2, 0, 0, 0], opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0] }}
                transition={{
                  duration: T.flap + 0.3 - T.land,
                  delay: T.land,
                  times: [0, 0.1, 0.2, 0.28, 0.36, 0.43, 0.5, 0.55, 0.6, (T.flap + 0.16 - T.land) / (T.flap + 0.3 - T.land), 1],
                  ease: 'easeOut',
                }}
              >
                {ITEMS.map((it, i) => (
                  <motion.g
                    key={it.id}
                    initial={{ x: BX + it.x * 0.9, y: TOP + 7 + (i % 3) * 3, rotate: it.spin * 0.6 }}
                    animate={{ rotate: [it.spin * 0.6, it.spin * 1.4, -it.spin * 0.5, it.spin * 0.3, 0] }}
                    transition={{ duration: 0.7, delay: T.land + i * 0.02, ease: 'easeOut' }}
                  >
                    {it.node}
                  </motion.g>
                ))}
              </motion.g>

              {/* Pass 3 — the front wall. */}
              <rect x={L} y={TOP + 10} width={BW} height={BH - 10} rx="2" fill="url(#dc-front)" />
              <path d={`M${L} ${TOP + 10} H${R} V${GROUND} H${L} Z`} fill="none" stroke={CARD.edge} strokeWidth="1.4" />
              <path d={`M${BX} ${TOP + 10} V${GROUND}`} stroke={CARD.edge} strokeWidth="1.2" opacity="0.5" />
              <rect x={L + 10} y={TOP + 24} width="30" height="18" rx="1.5" fill="#FBF6EA" />
              <path d={`M${L + 14} ${TOP + 29} H${L + 32} M${L + 14} ${TOP + 33} H${L + 28} M${L + 14} ${TOP + 37} H${L + 24}`} stroke="#B9A88A" strokeWidth="1.3" strokeLinecap="round" />

              {/* Flaps — open on the way down, and they swing shut with a spring. */}
              {([
                { k: 'l', d: `M${BX} ${TOP} H${L} L${L + 4} ${TOP - FLAP_H} H${BX} Z`, open: 74, org: '100% 100%' },
                { k: 'r', d: `M${BX} ${TOP} H${R} L${R - 4} ${TOP - FLAP_H} H${BX} Z`, open: -74, org: '0% 100%' },
              ] as const).map((f) => (
                <motion.path
                  key={f.k}
                  d={f.d}
                  fill="url(#dc-flap)"
                  stroke={CARD.edge}
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                  style={{ transformBox: 'fill-box', transformOrigin: f.org }}
                  initial={{ rotate: f.open }}
                  animate={{ rotate: [f.open, f.open * 1.12, f.open, f.open * 0.92, f.open, -6 * Math.sign(f.open), 0] }}
                  transition={{ duration: T.flap + 0.42 - T.land, delay: T.land, times: [0, 0.12, 0.22, 0.32, (T.flap - T.land) / (T.flap + 0.42 - T.land), 0.9, 1], ease: EASE }}
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
                transition={{ duration: 0.3, delay: T.tape, ease: EASE }}
                style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
              />
              <motion.circle cy={TOP + 1} r="4.5" fill="#ffffff" initial={{ cx: L + 3, opacity: 0 }} animate={{ cx: R - 3, opacity: [0, 0.9, 0] }} transition={{ duration: 0.3, delay: T.tape, ease: EASE }} />
            </motion.g>
          </motion.g>

          {/* ══ THE LANDING ══ rings out from under the carton, and grit with it. */}
          {[0, 0.09].map((off, i) => (
            <motion.ellipse
              key={`ring-${i}`}
              cx={BX}
              cy={GROUND}
              rx="24"
              ry="5"
              fill="none"
              stroke="#8ab0ff"
              strokeWidth="2"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 4.2], opacity: [0.8, 0] }}
              transition={{ duration: 0.85, delay: T.land + off, ease: 'easeOut' }}
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
              animate={{ opacity: [0, 0.85, 0], x: p.dx, y: [0, p.dy, p.dy * 0.3], scale: [1, 1, 0.4] }}
              transition={{ duration: 0.66, delay: T.land, ease: 'easeOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          ))}

          {/* ══ THE CAR ══ */}
          <motion.g
            initial={{ x: -(CAR_LEN + 60) }}
            animate={{ x: [-(CAR_LEN + 60), CAR_X, CAR_X, CAR_X + 720] }}
            transition={{ duration: T.boost + 0.6 - T.car, delay: T.car, times: WHEEL.times, ease: [EASE, 'linear', THRUST] }}
          >
            <g transform={`translate(0 ${GROUND})`}>
              <ellipse cx={CAR_LEN / 2} cy="4" rx={CAR_LEN / 2 + 4} ry="6" fill="#020818" opacity="0.55" />
              <rect x="10" y="1" width={CAR_LEN - 20} height="26" fill="url(#dc-reflect)" opacity="0.7" />
              <ellipse cx={CAR_LEN + 40} cy="-8" rx="66" ry="15" fill="url(#dc-beam)" opacity="0.7" />

              {/* Charge: the glow that gathers on it. */}
              <motion.ellipse
                cx={CAR_LEN / 2}
                cy="-28"
                rx="150"
                ry="70"
                fill="url(#dc-charge)"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.9, 1, 0], scale: [0.5, 1.15, 1.3, 1.8] }}
                transition={{ duration: T.boost + 0.3 - T.charge, delay: T.charge, times: [0, 0.5, 0.85, 1], ease: 'easeInOut' }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
              <motion.rect
                x="-10"
                y="-2"
                width={CAR_LEN + 20}
                height="6"
                rx="3"
                fill="#7ba5ff"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.9, 0] }}
                transition={{ duration: T.boost + 0.3 - T.charge, delay: T.charge, times: [0, 0.4, 0.85, 1] }}
              />

              {/* The jet, from the moment of the boost. */}
              <motion.g
                style={{ transformBox: 'fill-box', transformOrigin: '100% 50%' }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: [0, 1, 1, 1, 1], scaleX: [0, 1.6, 1.1, 1.9, 1.4] }}
                transition={{ duration: 0.6, delay: T.boost, times: [0, 0.2, 0.45, 0.7, 1], ease: 'easeOut' }}
              >
                <path d="M2 -24 L-120 -16 L2 -8 Z" fill="url(#dc-jet)" />
                <path d="M2 -20 L-70 -16 L2 -12 Z" fill="#ffffff" opacity="0.8" />
              </motion.g>

              {/* Body and glass ride the suspension; the wheels do not. Also the
                  tremble while it charges, and the rock when it stops. */}
              <motion.g
                initial={{ y: 0, x: 0 }}
                animate={{ y: BODY.y, x: BODY.x }}
                transition={{ duration: BODY.duration, delay: T.stop, times: BODY.times, ease: 'easeOut' }}
              >
                {/* Tailgate: shut on arrival, lifts for the carton, shuts after. */}
                <motion.g
                  style={{ transformBox: 'fill-box', transformOrigin: '100% 0%' }}
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -76, -76, 0] }}
                  transition={{ duration: T.gateShut + 0.3 - T.gate, delay: T.gate, times: [0, 0.3, (T.gateShut - T.gate) / (T.gateShut + 0.3 - T.gate), 1], ease: EASE }}
                >
                  <path d="M46 -38 L12 -33 Q3 -31 2 -22 L40 -25 Z" fill="url(#dc-roof)" />
                  <path d="M44 -36 L16 -31.5" stroke="#b7c2da" strokeWidth="1" opacity="0.8" />
                </motion.g>

                <path d={CAR_BODY} fill="url(#dc-body)" />
                <circle cx={WHEEL_A} cy="-2" r="17.5" fill="#0a1024" />
                <circle cx={WHEEL_B} cy="-2" r="17.5" fill="#0a1024" />
                <path d={CAR_ROOF} fill="url(#dc-roof)" />
                <path d={`M2 -9 H${CAR_LEN - 2} V0 H0 Z`} fill="url(#dc-sill)" opacity="0.9" />
                {/* Glass: rear, then front. */}
                <path d="M49 -39 Q60 -51 74 -52 L96 -52 V-39 Z" fill="url(#dc-glass)" />
                <path d="M104 -52 L126 -52 Q145 -51 154 -39 L104 -39 Z" fill="url(#dc-glass)" />
                <path d="M100 -52 V-38" stroke="#c6cfe3" strokeWidth="2.2" />
                <path d="M52 -37 H150" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />

                {/* The rear door. The opening behind it is the cabin, dark; the
                    small parcel lands in it; the door panel, drawn last, closes
                    over the parcel. It opens toward us: the panel narrows to its
                    hinge and darkens on its shadowed face. */}
                <rect x={DOOR.x1} y={DOOR.top} width={DOOR.x2 - DOOR.x1} height={DOOR.bottom - DOOR.top} rx="2" fill="#141a36" />
                <rect x={DOOR.x1 + 6} y={DOOR.top + 22} width={DOOR.x2 - DOOR.x1 - 12} height="20" rx="3" fill="#2a3466" />
                {/* the small parcel, on the seat */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 1] }}
                  transition={{ duration: 0.05, delay: T.seat + 0.3 }}
                >
                  <rect x={DOOR.x1 + 8} y={DOOR.top + 30} width={SW * 0.7} height={SH * 0.7} rx="2" fill="#d9a86a" />
                  <rect x={DOOR.x1 + 8} y={DOOR.top + 30} width={SW * 0.7} height={SH * 0.28} rx="2" fill="#e8bd83" />
                </motion.g>
                <motion.g
                  style={{ transformBox: 'fill-box', transformOrigin: '100% 50%' }}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: [1, 0.28, 0.28, 1] }}
                  transition={{ duration: T.doorShut + 0.25 - T.door, delay: T.door, times: [0, 0.3, (T.doorShut - T.door) / (T.doorShut + 0.25 - T.door), 1], ease: EASE }}
                >
                  <rect x={DOOR.x1} y={DOOR.top} width={DOOR.x2 - DOOR.x1} height={DOOR.bottom - DOOR.top} rx="2" fill="url(#dc-body)" />
                  <path d={`M${DOOR.x1 + 4} -39 Q${DOOR.x1 + 12} -50 ${DOOR.x1 + 22} -51 L${DOOR.x2 - 4} -51 V-39 Z`} fill="url(#dc-glass)" />
                  <rect x={DOOR.x1 + 8} y="-30" width="12" height="2.6" rx="1.3" fill="#a9b6cf" />
                  <path d={`M${DOOR.x1 + 2} -37 H${DOOR.x2 - 2}`} stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
                  <motion.rect
                    x={DOOR.x1}
                    y={DOOR.top}
                    width={DOOR.x2 - DOOR.x1}
                    height={DOOR.bottom - DOOR.top}
                    rx="2"
                    fill="#0a1024"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.35, 0.35, 0] }}
                    transition={{ duration: T.doorShut + 0.25 - T.door, delay: T.door, times: [0, 0.3, (T.doorShut - T.door) / (T.doorShut + 0.25 - T.door), 1] }}
                  />
                </motion.g>

                {/* Lights: warm ahead, red behind, and the indicators blinking
                    as it pulls in. */}
                <ellipse cx={CAR_LEN - 5} cy="-24" rx="5.5" ry="3.6" fill="#fff1c9" />
                <rect x="1" y="-28" width="4.5" height="7" rx="2" fill="#ff5a5a" />
                <rect x="-0.5" y="-30" width="7" height="11" rx="3" fill="#ff5a5a" opacity="0.28" />
                {[{ x: 2, y: -33 }, { x: CAR_LEN - 10, y: -30 }].map((p, i) => (
                  <motion.g key={`ind-${i}`}>
                    <rect x={p.x} y={p.y} width="7" height="4" rx="1.5" fill="#ffb648" />
                    <motion.circle
                      cx={p.x + 3.5}
                      cy={p.y + 2}
                      r="9"
                      fill="#ffb648"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.6, 0, 0.6, 0, 0.6, 0, 0.6, 0] }}
                      transition={{ duration: T.stop + 0.6 - T.car, delay: T.car, times: [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 1] }}
                    />
                  </motion.g>
                ))}

                {/* Highlight sweeping down the flank on the load and the launch. */}
                <g clipPath="url(#dc-car-clip)">
                  <g transform="skewX(-20)">
                    <motion.rect y="-70" width="30" height="80" fill="url(#dc-sheen)" initial={{ x: -20, opacity: 0 }} animate={{ x: [-20, CAR_LEN + 40], opacity: [0, 1, 1, 0] }} transition={{ duration: 0.85, delay: T.boot + 0.4, ease: EASE }} />
                    <motion.rect y="-70" width="24" height="80" fill="url(#dc-sheen)" initial={{ x: -20, opacity: 0 }} animate={{ x: [-20, CAR_LEN + 40], opacity: [0, 1, 0] }} transition={{ duration: 0.5, delay: T.boost, ease: 'easeIn' }} />
                  </g>
                </g>
              </motion.g>

              <Wheel cx={WHEEL_A} spin={WHEEL} />
              <Wheel cx={WHEEL_B} spin={WHEEL} />
            </g>
          </motion.g>

          {/* ══ THE SMALL PARCEL ══ painted after the car so it sits in front of
              the bumper on the ground, then hops in through the open door and
              vanishes behind the closing panel. */}
          <motion.g
            style={{ originX: `${SX}px`, originY: `${GROUND - SH / 2}px`, transformBox: 'view-box' }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: [0, 0, CAR_X + DOOR.x1 + 22 - SX, CAR_X + DOOR.x1 + 22 - SX],
              y: [0, 0, -78, -36],
              rotate: [0, 0, 18, 0],
              opacity: [1, 1, 1, 0],
            }}
            transition={{ duration: T.seat + 0.34 - T.stop, delay: T.stop, times: [0, (T.seat - T.stop) / (T.seat + 0.34 - T.stop), (T.seat + 0.2 - T.stop) / (T.seat + 0.34 - T.stop), 1], ease: ['linear', [0.3, 0, 0.5, 1], GRAVITY] }}
          >
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              initial={{ y: -(GROUND + 60), rotate: -40, scaleY: 1 }}
              animate={{ y: [-(GROUND + 60), 0, 0, -10, 0, 0], rotate: [-40, 0, 0, 12, -2, 0], scaleY: [1, 1, 0.8, 1, 0.94, 1] }}
              transition={{ duration: T.smallLand + 0.42 - T.small, delay: T.small, times: [0, 0.5, 0.58, 0.72, 0.86, 1], ease: [GRAVITY, 'easeOut', 'easeOut', 'easeIn', 'easeOut'] }}
            >
              <ellipse cx={SX} cy={GROUND + 2} rx="24" ry="4" fill="#020818" opacity="0.5" />
              <rect x={SX - SW / 2} y={GROUND - SH} width={SW} height={SH} rx="2" fill="url(#dc-front)" />
              <rect x={SX - SW / 2} y={GROUND - SH} width={SW} height={SH * 0.4} rx="2" fill="#e8bd83" />
              <rect x={SX - 2} y={GROUND - SH} width="4" height={SH} fill="#f6e2bf" opacity="0.9" />
              <path d={`M${SX - SW / 2} ${GROUND - SH} H${SX + SW / 2} V${GROUND} H${SX - SW / 2} Z`} fill="none" stroke={CARD.edge} strokeWidth="1.2" />
            </motion.g>
          </motion.g>

          {/* ══ THE CHARGE ══ motes from everywhere, gathering on the car. */}
          {MOTES.map((m, i) => (
            <motion.circle
              key={`m-${i}`}
              cx={m.x}
              cy={m.y}
              r={m.r}
              fill="#9dc0ff"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [0, 0, (CAR_X + CAR_LEN / 2 - m.x) * 0.9, CAR_X + CAR_LEN / 2 - m.x],
                y: [0, -6, (GROUND - 30 - m.y) * 0.9, GROUND - 30 - m.y],
                scale: [0.6, 1.2, 1, 0.2],
              }}
              transition={{ duration: 0.72, delay: T.charge + m.d, times: [0, 0.25, 0.85, 1], ease: ['easeOut', [0.6, 0, 0.8, 0.3], 'linear'] }}
            />
          ))}

          {/* Ghosts and speed lines on the launch. */}
          {[
            { o: 0.25, lag: 0.05 },
            { o: 0.14, lag: 0.1 },
          ].map((g, i) => (
            <g key={`ghost-${i}`} transform={`translate(${CAR_X} ${GROUND})`}>
              <motion.path
                d={CAR_BODY}
                fill="#e9eef9"
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: [0, 720], opacity: [0, g.o, 0] }}
                transition={{ duration: 0.6 - g.lag, delay: T.boost + 0.02, ease: THRUST }}
              />
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.rect
              key={`out-${i}`}
              x={CAR_X - 20}
              y={GROUND - 58 + i * 11}
              height="2.8"
              rx="1.4"
              fill="#c9dbff"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: [0, 160, 0], opacity: [0, 0.85, 0] }}
              transition={{ duration: 0.5, delay: T.boost + 0.05 + i * 0.04, ease: 'easeOut' }}
            />
          ))}
        </motion.g>

        {/* ══ BEHIND THE CAR ══ the cut: the road ahead of it, the car already
            small and going, flames under it, the sun at the end of the road. */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1] }} transition={{ duration: 0.02, delay: T.cut, times: [0, 0.5, 1] }}>
          {/* Its own ground, in perspective. */}
          <path d={`M-40 ${GROUND - 46} H400 V${H} H-40 Z`} fill="url(#dc-hills)" />
          <path d={`M0 ${H} L150 ${GROUND - 40} L210 ${GROUND - 40} L360 ${H} Z`} fill="url(#dc-tarmac)" />
          <path d={`M-40 ${H} L152 ${GROUND - 40}`} stroke="#8ab0ff" strokeWidth="1.2" opacity="0.5" />
          <path d={`M400 ${H} L208 ${GROUND - 40}`} stroke="#8ab0ff" strokeWidth="1.2" opacity="0.5" />
          {[0.12, 0.24, 0.4, 0.62, 0.88].map((t, i) => {
            const y = GROUND - 40 + t * (H - GROUND + 40)
            const w = 2 + t * 9
            const h = 4 + t * 26
            return <rect key={`pd-${i}`} x={180 - w / 2} y={y} width={w} height={h} rx={w / 2} fill="#ffffff" opacity={0.35 + t * 0.4} />
          })}
          <ellipse cx="180" cy={GROUND - 40} rx="60" ry="14" fill="#ffb070" opacity="0.35" />

          {/* The car from behind, shrinking down the road. */}
          <motion.g
            style={{ originX: '180px', originY: `${GROUND + 40}px`, transformBox: 'view-box' }}
            initial={{ scale: 1.1, y: 0, x: 0 }}
            animate={{ scale: [1.1, 0.7, 0.32, 0.12], y: [0, -30, -60, -84], x: [0, 0, 0, 0] }}
            transition={{ duration: T.done - T.cut, delay: T.cut, times: [0, 0.3, 0.65, 1], ease: [0.5, 0, 0.7, 0.4] }}
          >
            {/* Jets under the bumper. */}
            {[-38, 38].map((dx, i) => (
              <motion.path
                key={`jet-${i}`}
                d={`M${180 + dx - 12} ${GROUND + 34} L${180 + dx} ${GROUND + 120} L${180 + dx + 12} ${GROUND + 34} Z`}
                fill="url(#dc-jet-v)"
                style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
                initial={{ scaleY: 0.8, opacity: 0.9 }}
                animate={{ scaleY: [0.8, 1.4, 1, 1.5, 1.1], opacity: [0.9, 1, 0.9, 1, 0.9] }}
                transition={{ duration: 0.5, delay: T.cut, repeat: 2, ease: 'easeInOut' }}
              />
            ))}
            <ellipse cx="180" cy={GROUND + 44} rx="82" ry="10" fill="#020818" opacity="0.5" />
            <path d={`M108 ${GROUND + 36} V${GROUND - 4} Q108 ${GROUND - 12} 118 ${GROUND - 12} L242 ${GROUND - 12} Q252 ${GROUND - 12} 252 ${GROUND - 4} V${GROUND + 36} Z`} fill="url(#dc-body)" />
            <path d={`M122 ${GROUND - 12} L132 ${GROUND - 52} L228 ${GROUND - 52} L238 ${GROUND - 12} Z`} fill="url(#dc-roof)" />
            <path d={`M134 ${GROUND - 16} L142 ${GROUND - 48} L218 ${GROUND - 48} L226 ${GROUND - 16} Z`} fill="url(#dc-glass)" opacity="0.95" />
            <rect x="118" y={GROUND + 4} width="124" height="14" rx="3" fill="url(#dc-sill)" opacity="0.9" />
            <rect x="160" y={GROUND + 6} width="40" height="10" rx="2" fill="#eef2fa" stroke="#c9d3e6" strokeWidth="1" />
            {[110, 232].map((x, i) => (
              <g key={`tl-${i}`}>
                <rect x={x} y={GROUND - 6} width="18" height="9" rx="3" fill="#ff5a5a" />
                <rect x={x - 4} y={GROUND - 10} width="26" height="17" rx="6" fill="#ff5a5a" opacity="0.3" />
              </g>
            ))}
            <rect x="104" y={GROUND + 24} width="18" height="14" rx="4" fill="#0a1024" />
            <rect x="238" y={GROUND + 24} width="18" height="14" rx="4" fill="#0a1024" />
          </motion.g>

          {/* Heat and light thrown back at us. */}
          <motion.rect x="0" y="0" width={W} height={H} fill="#9dc0ff" initial={{ opacity: 0 }} animate={{ opacity: [0.35, 0] }} transition={{ duration: 0.5, delay: T.cut }} />
        </motion.g>
      </svg>

      {/* The name, in the sky over the road. */}
      <div className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top: 'max(20%, calc(env(safe-area-inset-top) + 56px))' }}>
        <LaunchLockup delay={T.word} />
      </div>
    </div>
  )
}

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

import { useEffect, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch animation — a parcel packed and sent.

     0.05  a cardboard box falls in, squashing as it lands; the ground takes
           the hit and two rings run out from under it
     0.40  its flaps swing open, overshooting slightly before they settle
     0.85  eight things fall in, 85ms apart, each trailing a streak and
           kicking dust off the rim as it goes over
     2.00  the flaps fold back, a tape seam runs across the seal and the
           whole frame flashes on the closing
     2.06  a car arrives, headlights first, wheels turning, speed lines and a
           light spilling onto the road ahead of it
     2.55  the box tips across and drops into the boot; the suspension takes
           it and a highlight sweeps down the flank as it settles
     2.90  the tailgate shuts
     3.06  the car pulls away trailing ghosts, the camera pans after it, and
           the wordmark lands letter by letter with a shine across it

   4.0s, tap anywhere to skip, skipped outright under reduced motion.

   Why a car and not a van. The tempting drawing on a delivery app is a van and
   it would be the wrong one: DikkiConnect owns no vehicle and nothing new goes
   on the road because of it. The proposition is that a hatchback is already
   making that journey with an empty boot and the parcel rides in the space that
   was going to travel empty anyway. A van sells a courier company we are not.

   What sells the weight, in rough order of how much each one buys:

     · The wheels turn, and they have spokes so the turning is visible. A car
       sliding along on two static discs is the single loudest tell in any
       vehicle animation, and it stays loud no matter how good the rest is.
       They spin while it arrives, hold while it waits, spin again as it goes —
       driven off the same keyframe times as the body, so the two can never
       disagree.
     · The body dips when the parcel lands in the boot and rocks back. Mass
       arriving somewhere ought to cost something.
     · Everything that falls squashes when it lands, and the box squashes when
       it first arrives. Nothing rigid ever stops dead.
     · Each item drags a streak and knocks a little dust off the rim on its way
       in, so the fall has a direction and the box has an edge.
     · The flaps overshoot a few degrees and come back. Cardboard has spring.
     · Nothing is a flat fill. Every panel is a gradient lit from above, so the
       roof reads as the roof and the flank reads as the flank.
     · The camera is never still: it pushes in on the packing, holds through
       the load, and pans after the car as it leaves.

   Three things that silently destroyed the whole effect until they were right:

     · Flap rotation is signed — left positive, right negative. Matching signs
       swing one of them straight through the carton.
     · The items are only visible above the rim, because the front wall is
       painted over them (which is what puts them genuinely inside). They fall
       from the top of the frame into a box that sits low, so each gets a clear
       run, and the front wall starts below the rim so the interior shows.
     · The box is painted before the car. Painted after, it read as a carton
       strapped to the outside over the rear wheel.

   Transform, opacity and gradient paint only. Glows are stacked radial
   gradients and the highlight sweep is a clipped rectangle, because an SVG
   blur filter over moving content re-rasterises every frame and a launch
   screen that stutters is worse than one that is plain.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const
const GRAVITY = [0.45, 0, 0.7, 0.35] as const

const T = {
  box: 0.05,
  land: 0.5,
  flap: 0.4,
  item: 0.85,
  gap: 0.085,
  fall: 0.46,
  seal: 2.0,
  tape: 2.14,
  car: 2.06,
  load: 2.55,
  gate: 2.9,
  drive: 3.06,
  word: 3.16,
  done: 4.0,
}

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

/* Car timeline, shared by the body and the wheels so they cannot drift. */
const CAR_SPAN = T.drive + 0.55 - T.car
const CAR_TIMES = [0, 0.45, (T.drive - T.car) / CAR_SPAN, 1]

/* The parcel's own timeline, from being lifted to leaving with the car. */
const BOX_SPAN = T.drive + 0.55 - T.load

/**
 * Background dust, placed off a hash rather than Math.random so the field is
 * the same every launch and nothing can pop differently between two renders.
 */
const frac = (n: number) => {
  const v = Math.sin(n) * 43758.5453
  return v - Math.floor(v)
}
const STARS = Array.from({ length: 22 }, (_, i) => ({
  x: 10 + frac(i * 12.9898) * 280,
  y: 6 + frac(i * 78.233) * 150,
  r: 0.5 + frac(i * 39.425) * 1.4,
  delay: frac(i * 21.7) * 2.6,
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

/** A wheel with spokes, so that turning is something you can actually see. */
function Wheel({ cx }: { cx: number }) {
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, 760, 760, 1520] }}
      transition={{ duration: CAR_SPAN, delay: T.car, times: CAR_TIMES, ease: 'linear' }}
    >
      <circle cx={cx} cy={GROUND} r="14" fill="#070d20" />
      <circle cx={cx} cy={GROUND} r="14" fill="none" stroke="#1b2a52" strokeWidth="1.4" />
      <circle cx={cx} cy={GROUND} r="6" fill="url(#dc-hub)" />
      <path
        d={`M${cx} ${GROUND - 11} V${GROUND - 7} M${cx} ${GROUND + 7} V${GROUND + 11}
            M${cx - 11} ${GROUND} H${cx - 7} M${cx + 7} ${GROUND} H${cx + 11}`}
        stroke="#4a6fc4"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </motion.g>
  )
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

  return (
    <motion.div
      onClick={onDone}
      className="fixed inset-0 z-200 grid place-items-center overflow-hidden bg-[#050d2b]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.42, ease: EASE }}
    >
      {/* ── Atmosphere ────────────────────────────────────────────────────
          Three stacked radial gradients rather than one blurred sprite: the
          same falloff, none of the per-frame rasterisation. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 42% at 50% 46%, rgba(58,104,245,0.30), transparent 70%),' +
            'radial-gradient(90% 60% at 50% 100%, rgba(24,58,160,0.45), transparent 72%)',
        }}
        initial={{ opacity: 0.55 }}
        animate={{ opacity: [0.55, 0.7, 1, 0.6] }}
        transition={{ duration: T.done, times: [0, 0.45, 0.78, 1], ease: 'easeInOut' }}
      />

      {/* The closing of the box throws light across the whole frame. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(46% 34% at 50% 58%, rgba(150,185,255,0.6), transparent 70%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ duration: 0.52, delay: T.tape, ease: 'easeOut' }}
      />

      {/* Vignette, so the eye stays in the middle third where the work is. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(78% 64% at 50% 50%, transparent 42%, rgba(2,6,22,0.72))' }}
      />

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
              <stop offset="0" stopColor="#2f66f4" />
              <stop offset="0.5" stopColor="#1650e0" />
              <stop offset="1" stopColor="#0c2f8e" />
            </linearGradient>
            <linearGradient id="dc-roof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5c86ff" />
              <stop offset="1" stopColor="#2f60ef" />
            </linearGradient>
            <linearGradient id="dc-glass" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor="#DCE9FF" />
              <stop offset="1" stopColor="#7EA4EE" />
            </linearGradient>
            <linearGradient id="dc-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.55" />
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
              <stop offset="0" stopColor="#4a7cf0" stopOpacity="0.5" />
              <stop offset="1" stopColor="#4a7cf0" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="dc-beam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.42" />
              <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="dc-hub">
              <stop offset="0" stopColor="#bcd4ff" />
              <stop offset="1" stopColor="#5680dd" />
            </radialGradient>
            <radialGradient id="dc-pool">
              <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.3" />
              <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
            </radialGradient>
            <clipPath id="dc-car-clip">
              <path d={CAR_BODY} />
            </clipPath>
          </defs>

          {/* ══ DUST IN THE AIR ══ */}
          {STARS.map((s, i) => (
            <motion.circle
              key={`s-${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#9dc0ff"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.45, 0.12, 0.4], y: [0, -7, -13] }}
              transition={{
                duration: 3.4,
                delay: s.delay,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* ══ THE ROAD ══ */}
          <motion.ellipse
            cx="150"
            cy={GROUND + 2}
            rx="132"
            ry="13"
            fill="url(#dc-reflect)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.7, delay: T.box, ease: EASE }}
          />
          <motion.line
            x1="18"
            y1={GROUND + 1}
            x2="282"
            y2={GROUND + 1}
            stroke="url(#dc-ground)"
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: T.box, ease: EASE }}
          />

          {/* ══ THE BOX ══ painted before the car, so the car's rear body
              occludes its lower half once it is loaded. */}
          {/* Load, then leave with the car. The departure has to be on this
              group too: the box and the car are separate, so without it the
              car drove off and left the parcel hanging in mid-air exactly
              where the boot had been. Same times as the car's own keyframes. */}
          {/* The origin is pinned to the carton in view-box units, NOT to this
              group's bounding box. The group also contains the items, which
              start at the top of the frame, and the landing burst, which throws
              rings well outside it — so its bbox centre sits some 55px above
              the carton, and scaling about that lifted the parcel onto the roof
              instead of settling it into the boot. */}
          <motion.g
            style={{ transformOrigin: `${BX}px ${GROUND - BH / 2}px` }}
            initial={{ x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{
              x: [0, -66, -66, 274],
              y: [0, 11, 11, 11],
              scale: [1, 0.4, 0.4, 0.4],
              rotate: [0, 6, 0, 0],
            }}
            transition={{
              duration: BOX_SPAN,
              delay: T.load,
              times: [0, 0.46 / BOX_SPAN, (T.drive - T.load) / BOX_SPAN, 1],
              ease: [[0.5, 0, 0.4, 1], 'linear', [0.45, 0, 0.55, 1]],
            }}
          >
            {/* Entry: falls, then squashes onto the ground and recovers. */}
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              initial={{ y: -96, scaleY: 1, opacity: 0 }}
              animate={{ y: [-96, 0, 0, 0], scaleY: [1, 1, 0.84, 1], opacity: [0, 1, 1, 1] }}
              transition={{
                duration: 0.74,
                delay: T.box,
                times: [0, 0.6, 0.76, 1],
                ease: [GRAVITY, EASE, EASE],
              }}
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
                    transition={{
                      duration: T.fall,
                      delay: d,
                      ease: GRAVITY,
                      opacity: { duration: 0.1, delay: d },
                    }}
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
              <path
                d={`M${L} ${TOP + MOUTH} H${R} V${GROUND} H${L} Z`}
                fill="none"
                stroke={CARD.edge}
                strokeWidth="1.4"
              />
              <path d={`M${BX} ${TOP + MOUTH} V${GROUND}`} stroke={CARD.edge} strokeWidth="1.2" opacity="0.5" />

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
                  transition={{
                    duration: FLAP_SPAN,
                    delay: T.flap,
                    times: [0, FLAP_OPEN * 0.78, FLAP_OPEN, FLAP_HOLD, 1],
                    ease: EASE,
                  }}
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

              {/* The seam catches the light as it runs across. */}
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

          {/* ══ THE LANDING ══ rings out from under the box, and grit with it.
              Painted after the box so it reads as being thrown towards us. */}
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
            transition={{ duration: CAR_SPAN, delay: T.car, times: CAR_TIMES, ease: [EASE, EASE, [0.45, 0, 0.55, 1]] }}
          >
            <ellipse cx="150" cy={GROUND + 3} rx="106" ry="5" fill="#020818" opacity="0.5" />
            {/* Wet-road smear under the flank — the reflection, without a blur. */}
            <rect x="58" y={GROUND + 1} width="192" height="24" fill="url(#dc-reflect)" opacity="0.55" />
            {/* And the pool the headlights throw down the road ahead. */}
            <ellipse cx="292" cy={GROUND - 6} rx="62" ry="14" fill="url(#dc-pool)" />

            {/* Body and glass ride the suspension; the wheels do not. */}
            <motion.g
              initial={{ y: 0 }}
              animate={{ y: [0, 3.2, -1.2, 0] }}
              transition={{
                duration: 0.62,
                delay: T.load + 0.3,
                times: [0, 0.34, 0.66, 1],
                ease: 'easeOut',
              }}
            >
              <motion.g
                style={{ transformBox: 'fill-box', transformOrigin: '100% 0%' }}
                initial={{ rotate: -74 }}
                animate={{ rotate: [-74, -74, 0] }}
                transition={{ duration: 0.95, delay: T.gate - 0.6, times: [0, 0.62, 1], ease: EASE }}
              >
                <path d="M94 139 L60 144 Q51 146 50 155 L88 152 Z" fill="url(#dc-roof)" />
              </motion.g>

              <path d={CAR_BODY} fill="url(#dc-body)" />
              <path d={CAR_ROOF} fill="url(#dc-roof)" />
              <path d="M97 138 Q108 126 122 125 L142 125 V138 Z" fill="url(#dc-glass)" />
              <path d="M150 125 L172 125 Q191 126 200 138 L150 138 Z" fill="url(#dc-glass)" />

              {/* A crease along the flank, which is what stops a car reading as
                  a coloured blob. */}
              <path d={`M52 156 H250`} stroke="#7ba5ff" strokeWidth="1.2" opacity="0.35" />

              <ellipse cx="250" cy="152" rx="5" ry="3.4" fill="#ffeec2" />
              <path d="M254 148 L300 138 L300 166 L254 156 Z" fill="url(#dc-beam)" />
              <rect x="45.5" y="150" width="4" height="6" rx="2" fill="#ff7a7a" />

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
                    transition={{ duration: 0.85, delay: T.load + 0.24, ease: EASE }}
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
              fill="#3a68f5"
              opacity={g.o}
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: [0, 340], opacity: [0, g.o, 0] }}
              transition={{ duration: 0.55 - g.lag, delay: T.drive, ease: [0.45, 0, 0.55, 1] }}
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
              fill="#7ba5ff"
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
              fill="#9dc0ff"
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
              fill="#7ba5ff"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.34, 0], scale: [0.4, 1.7, 2.6], x: [0, -18, -34] }}
              transition={{ duration: 0.62, delay: T.drive + i * 0.06, ease: 'easeOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          ))}
        </motion.svg>

        {/* ══ THE LOCKUP ══ letter by letter, then a shine across the whole
            thing — the one flourish that is allowed to be pure decoration. */}
        <div className="flex min-h-[68px] flex-col items-center">
          <div className="relative flex items-center gap-2.5 overflow-hidden px-1">
            <motion.svg
              viewBox="0 0 48 48"
              width="27"
              height="27"
              aria-hidden
              initial={{ opacity: 0, scale: 0.4, rotate: -25 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 17, delay: T.word }}
            >
              <path d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z" fill="#3a68f5" />
              <path d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z" fill="#ffffff" />
            </motion.svg>

            <span className="text-display flex text-[26px] leading-none font-extrabold tracking-[-0.04em] text-white">
              {'DikkiConnect'.split('').map((ch, i) => (
                <motion.span
                  key={`${ch}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: T.word + 0.06 + i * 0.028, ease: EASE }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>

            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-16"
              style={{
                background:
                  'linear-gradient(100deg, transparent, rgba(255,255,255,0.85), transparent)',
                mixBlendMode: 'overlay',
              }}
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 260, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.78, delay: T.word + 0.42, ease: 'easeInOut' }}
            />
          </div>

          <motion.p
            className="mt-2.5 text-[9.5px] font-semibold text-white/45 uppercase"
            initial={{ opacity: 0, letterSpacing: '0.14em' }}
            animate={{ opacity: 1, letterSpacing: '0.3em' }}
            transition={{ duration: 0.55, delay: T.word + 0.2, ease: EASE }}
          >
            Move more. Together.
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}

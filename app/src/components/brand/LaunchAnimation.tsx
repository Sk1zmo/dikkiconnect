import { useEffect, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch animation — a parcel packed and sent.

     0.05  a cardboard box drops in and settles
     0.40  its flaps swing open, showing the dark inside
     0.85  eight things fall in, 85ms apart — a laptop, a phone, keys, a
           wallet, headphones, a camera, a gift, papers
     2.00  the flaps fold back and a tape seam runs across the seal
     2.10  a car arrives with its boot already open
     2.55  the box lifts across and drops into the boot
     2.90  the tailgate shuts
     3.05  the car leaves, and the wordmark lands

   3.6s, tap anywhere to skip, skipped outright under reduced motion.

   Why a car and not a van. The tempting drawing on a delivery app is a van,
   and it would be the wrong one: DikkiConnect owns no vehicle and nothing new
   goes on the road because of it. The proposition is that a hatchback is
   already making that journey with an empty boot and the parcel rides in the
   space that was going to travel empty anyway. A van sells a courier company
   we are not, so the last beat is deliberately an ordinary car.

   Three things that took getting right:

     · The items have to be *seen*. Painting them behind the front wall makes
       them genuinely inside the box, but it also means they are only visible
       above the rim — so they fall a long way from the top of the frame and
       the box sits low, giving each one a clear run before it disappears.
       An early pass had them falling 58px into a box painted over the top of
       them, and the whole sequence played with nothing visibly going in.
     · The open box needs a visible mouth. A front wall drawn over the full
       height hides the interior completely and reads as a plain rectangle, so
       the front wall starts below the rim and the dark inside shows above it.
     · Flap rotation is signed. The left flap opens on a positive angle and the
       right on a negative one; matching signs swings one of them through the
       box. Origins are set with `transform-box: fill-box` and box corners,
       which is the one formulation that behaves the same across engines —
       absolute user-space origins on an SVG group do not.

   Everything moves on transform and opacity: no filters, no blur, no layout.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const
const GRAVITY = [0.45, 0, 0.7, 0.35] as const

const T = {
  box: 0.05,
  flap: 0.4,
  item: 0.85,
  gap: 0.085,
  fall: 0.46,
  seal: 2.0,
  tape: 2.14,
  car: 2.1,
  load: 2.55,
  gate: 2.9,
  drive: 3.05,
  word: 3.1,
  done: 3.62,
}

/* ── Geometry. One origin; move the box by changing BX / GROUND. ── */
const GROUND = 178
const BW = 104
const BH = 76
const BX = 150
const TOP = GROUND - BH
const L = BX - BW / 2
const R = BX + BW / 2
const MOUTH = 15 // how much dark interior shows above the front wall
const FLAP_H = 15

const CARD = { flap: '#DCA967', front: '#C08E52', edge: '#9A6C3C', inner: '#553818' }

/* ── The things that go in. Blunt on purpose: at this size detail turns to mud. ── */
const ITEMS: { id: string; node: ReactNode; x: number; spin: number }[] = [
  {
    id: 'laptop',
    x: -18,
    spin: -16,
    node: (
      <>
        <rect x="-15" y="-10" width="30" height="18" rx="1.8" fill="#C9D4E8" />
        <rect x="-12.6" y="-7.6" width="25.2" height="13.4" rx="1" fill="#26314C" />
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
        <rect x="-6" y="-11.5" width="9.5" height="4.5" rx="1.4" fill="#48546F" />
        <circle cx="0" cy="1.5" r="6" fill="#9FB3D9" />
        <circle cx="0" cy="1.5" r="2.8" fill="#26314C" />
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

/* The flaps hold open while the box fills, then fold. Expressed as fractions of
   their own timeline so retiming the fill does not desynchronise them. */
const FLAP_SPAN = T.seal + 0.36 - T.flap
const FLAP_OPEN_AT = 0.17
const FLAP_HOLD_TO = (T.item + (ITEMS.length - 1) * T.gap + T.fall - T.flap) / FLAP_SPAN

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
      className="fixed inset-0 z-200 grid place-items-center overflow-hidden bg-[#091a4a]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 40% at 50% 46%, rgba(58,104,245,0.28), transparent 70%)',
        }}
      />

      <div className="relative flex w-full max-w-[440px] flex-col items-center px-4">
        <svg viewBox="0 0 300 210" className="w-full" aria-hidden>
          <motion.line
            x1="18"
            y1={GROUND + 1}
            x2="282"
            y2={GROUND + 1}
            stroke="#2c4a94"
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: T.box, ease: EASE }}
          />

          {/* ══ THE BOX ══
              Painted before the car on purpose. When it is loaded, the car's
              rear body is drawn over its lower half and only the top of the
              carton shows above the boot line — which is what a parcel in an
              open boot actually looks like. Painted after the car instead, it
              read as a box strapped to the outside over the wheel. */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{ x: 66, y: 11, scale: 0.4 }}
            transition={{ duration: 0.46, delay: T.load, ease: [0.5, 0, 0.4, 1] }}
          >
            <motion.g
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: T.box, ease: EASE }}
            >
              <motion.ellipse
                cx={BX}
                cy={GROUND + 2}
                rx="56"
                ry="6"
                fill="#040d28"
                initial={{ opacity: 0, scaleX: 1.5 }}
                animate={{ opacity: 0.55, scaleX: 1 }}
                transition={{ duration: 0.5, delay: T.box, ease: EASE }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />

              {/* Pass 1 — the inside. Visible through the mouth once flaps open. */}
              <rect x={L} y={TOP} width={BW} height={BH} rx="2" fill={CARD.inner} />

              {/* Pass 2 — the contents, falling. Covered by pass 3 below the rim,
                  which is what puts them inside rather than on top. */}
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
                    {it.node}
                  </motion.g>
                )
              })}

              {/* Pass 3 — the front wall, starting below the rim so the mouth shows. */}
              <rect x={L} y={TOP + MOUTH} width={BW} height={BH - MOUTH} rx="2" fill={CARD.front} />
              <path
                d={`M${L} ${TOP + MOUTH} H${R} V${GROUND} H${L} Z`}
                fill="none"
                stroke={CARD.edge}
                strokeWidth="1.4"
              />
              <path
                d={`M${BX} ${TOP + MOUTH} V${GROUND}`}
                stroke={CARD.edge}
                strokeWidth="1.2"
                opacity="0.5"
              />

              {/* Flaps. Left opens positive, right negative — matching signs would
                  swing one of them straight through the carton. */}
              {([
                { k: 'l', d: `M${BX} ${TOP} H${L} L${L + 4} ${TOP - FLAP_H} H${BX} Z`, to: 62, org: '100% 100%' },
                { k: 'r', d: `M${BX} ${TOP} H${R} L${R - 4} ${TOP - FLAP_H} H${BX} Z`, to: -62, org: '0% 100%' },
              ] as const).map((f) => (
                <motion.path
                  key={f.k}
                  d={f.d}
                  fill={CARD.flap}
                  stroke={CARD.edge}
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                  style={{ transformBox: 'fill-box', transformOrigin: f.org }}
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, f.to, f.to, 0] }}
                  transition={{
                    duration: FLAP_SPAN,
                    delay: T.flap,
                    times: [0, FLAP_OPEN_AT, FLAP_HOLD_TO, 1],
                    ease: EASE,
                  }}
                />
              ))}

              {/* Tape across the seal, drawn once the flaps are down. */}
              <motion.rect
                x={L + 3}
                y={TOP - 2}
                width={BW - 6}
                height="6"
                rx="1.4"
                fill="#EBD3A8"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.34, delay: T.tape, ease: EASE }}
                style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
              />
            </motion.g>
          </motion.g>

          {/* ══ THE CAR ══ An ordinary hatchback, boot already open. */}
          <motion.g
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: [-300, 0, 0, 340], opacity: [0, 1, 1, 1] }}
            transition={{
              duration: T.drive + 0.55 - T.car,
              delay: T.car,
              times: [0, 0.45, (T.drive - T.car) / (T.drive + 0.55 - T.car), 1],
              ease: [EASE, EASE, [0.45, 0, 0.55, 1]],
            }}
          >
            <ellipse cx="150" cy={GROUND + 3} rx="106" ry="5" fill="#040d28" opacity="0.45" />

            {/* Tailgate, hinged at the rear of the roof. Open while the car
                waits, swung shut once the parcel is aboard. Drawn before the
                body so the body's edge hides its pivot. */}
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }}
              initial={{ rotate: -74 }}
              animate={{ rotate: [-74, -74, 0] }}
              transition={{
                duration: 0.95,
                delay: T.gate - 0.6,
                times: [0, 0.62, 1],
                ease: EASE,
              }}
            >
              <path d="M206 139 L240 144 Q249 146 250 155 L212 152 Z" fill="#2f60ef" />
            </motion.g>

            <path
              d={`M46 ${GROUND} V150 Q46 143 55 142 L84 140 Q99 121 121 120 L177 120
                  Q197 121 208 140 L242 145 Q254 147 254 158 V${GROUND} Z`}
              fill="#1650e0"
            />
            <path d="M84 140 Q99 121 121 120 L177 120 Q197 121 208 140 Z" fill="#3a68f5" />
            <path d="M97 138 Q108 126 122 125 L142 125 V138 Z" fill="#96b8ff" />
            <path d="M150 125 L172 125 Q191 126 200 138 L150 138 Z" fill="#96b8ff" />

            {[92, 206].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy={GROUND} r="14" fill="#0b1024" />
                <circle cx={cx} cy={GROUND} r="5.6" fill="#7ba5ff" />
              </g>
            ))}
          </motion.g>

          {/* Speed lines, only while it is genuinely leaving. */}
          {[0, 1, 2].map((i) => (
            <motion.rect
              key={i}
              x="26"
              y={126 + i * 14}
              height="2.6"
              rx="1.3"
              fill="#7ba5ff"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: [0, 62, 0], opacity: [0, 0.75, 0] }}
              transition={{ duration: 0.5, delay: T.drive + i * 0.05, ease: 'easeOut' }}
            />
          ))}
        </svg>

        <div className="flex min-h-[68px] flex-col items-center">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.46, delay: T.word, ease: EASE }}
          >
            <svg viewBox="0 0 48 48" width="27" height="27" aria-hidden>
              <path d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z" fill="#3a68f5" />
              <path d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z" fill="#ffffff" />
            </svg>
            <span className="text-display text-[26px] leading-none font-extrabold tracking-[-0.04em] text-white">
              DikkiConnect
            </span>
          </motion.div>

          <motion.p
            className="mt-2.5 text-[9.5px] font-semibold tracking-[0.3em] text-white/45 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: T.word + 0.16 }}
          >
            Move more. Together.
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   Launch animation — "the space was already going there".

   The old opening was a mini-truck: a parcel dropped into a bed, the tailgate
   shut, it drove off. Competent, and wrong — DikkiConnect does not own a
   truck. Nothing new goes on the road. The entire proposition is that a car is
   already making that journey with an empty boot, and your parcel takes the
   space that was going to travel empty anyway. An opening that shows a
   delivery vehicle sells a courier company we are not.

   So the subject is the space itself. A dikki, drawn as an open volume:

     1. Journeys already under way — soft, out-of-focus lines drifting behind.
        The road is busy before we arrive.
     2. One resolves: a single route draws itself between two points.
     3. An open boot rides it, outlined and empty. Allocated, moving, carrying
        nothing.
     4. A parcel falls into it.
     5. The outline fills solid, and it carries on down the same line it was
        already travelling.

   Where the depth comes from, all of it cheaper than it looks:

     · The parcel is genuinely inside the box, not on it. The crate is drawn in
       two passes — opening first, front walls last — with the parcel painted
       between them, so the walls occlude its lower half exactly as they would
       in life. Painter's algorithm, four extra lines, and it is the single
       thing that stops the scene reading as two stacked cubes.
     · Contact shadows that report height. The parcel's shadow starts wide and
       nearly invisible and tightens as it drops; that one relationship sells
       altitude better than any amount of perspective.
     · A real depth of field — background planes are Gaussian-blurred and drift
       slower than the subject, so the scene has depth rather than a floor with
       stickers on it.
     · One light source, upper left, obeyed by every face in the scene. That
       consistency is the difference between an object and a diagram.
     · A slow camera push across the run, so the frame feels held.

   Every animated element carries absolute coordinates rather than sitting
   inside another animated transform: nesting them three deep is how an earlier
   pass ended up squashing the parcel in mid-air.

   3.0s, tap to skip, skipped outright for reduced motion.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const
const GRAVITY = [0.4, 0, 0.72, 0.38] as const

const FALL = 0.52

const T = {
  route: 0.26,
  crate: 0.6,
  parcel: 1.1,
  land: 1.1 + FALL,
  fill: 1.74,
  travel: 2.02,
  done: 3.05,
}

/* ── Geometry ──────────────────────────────────────────────────────────────
   2:1 isometric. Every solid is expressed from a single ground point, so it
   can be planted anywhere by moving that one coordinate.                      */
const iso = (cx: number, cy: number, halfW: number, halfD: number, height: number) => {
  const F: [number, number] = [cx, cy]
  const R: [number, number] = [cx + halfW, cy - halfD]
  const B: [number, number] = [cx, cy - 2 * halfD]
  const L: [number, number] = [cx - halfW, cy - halfD]
  const up = ([x, y]: [number, number]): [number, number] => [x, y - height]
  const [Ft, Rt, Bt, Lt] = [up(F), up(R), up(B), up(L)]
  const p = (...ps: [number, number][]) => ps.map(([x, y]) => `${x},${y}`).join(' ')

  const mx = cx
  const my = cy - halfD - height
  /* The mouth, inset towards its own centre. An inset darker rhombus is what
     makes a box read as open at a glance; a plain top face reads as a cube no
     matter how it is coloured. */
  const inset = ([x, y]: [number, number]) => `${mx + (x - mx) * 0.7},${my + (y - my) * 0.7}`

  return {
    left: p(L, F, Ft, Lt),
    right: p(F, R, Rt, Ft),
    top: p(Ft, Rt, Bt, Lt),
    mouth: [Ft, Rt, Bt, Lt].map(inset).join(' '),
    /* Floor centre: where anything dropped into this volume comes to rest. */
    floor: [cx, cy - halfD] as [number, number],
  }
}

const CRATE_X = 126
const CRATE_Y = 170
const CRATE = iso(CRATE_X, CRATE_Y, 48, 24, 32)

/* The parcel settles on the crate's floor, not on its rim — which is what puts
   its lower half behind the front walls. */
const PARCEL_REST_Y = CRATE.floor[1]
const PARCEL = iso(0, 0, 22, 11, 19)

export function LaunchAnimation({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<'empty' | 'loaded' | 'moving'>('empty')

  useEffect(() => {
    if (reduced) {
      onDone()
      return
    }
    const timers = [
      setTimeout(() => setPhase('loaded'), T.fill * 1000),
      setTimeout(() => setPhase('moving'), T.travel * 1000),
      setTimeout(onDone, T.done * 1000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [reduced, onDone])

  if (reduced) return null

  const loaded = phase !== 'empty'
  const moving = phase === 'moving'

  /* Both halves of the crate share one entry, so the two passes stay welded
     together while it settles onto its shadow. */
  const entry = {
    initial: { y: -18, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.58, delay: T.crate, ease: EASE },
  } as const
  const swap = (on: boolean) => ({
    animate: { opacity: on ? 1 : 0 },
    transition: { duration: 0.3, ease: 'easeOut' as const },
  })

  return (
    <motion.div
      onClick={onDone}
      className="fixed inset-0 z-200 grid place-items-center overflow-hidden bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      {/* Key light, placed where the faces below say the sun is. */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(58% 40% at 40% 42%, rgba(22,80,224,0.10), transparent 72%)',
        }}
      />

      <div className="relative flex w-full max-w-[460px] flex-col items-center px-6">
        <motion.svg
          viewBox="0 0 360 212"
          className="w-full"
          aria-hidden
          initial={{ scale: 1 }}
          animate={{ scale: 1.035 }}
          transition={{ duration: T.done, ease: 'linear' }}
        >
          <defs>
            <filter id="dkc-far" x="-25%" y="-50%" width="150%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <filter id="dkc-mid" x="-25%" y="-50%" width="150%" height="200%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
            {/* Soft, never hard-edged: a hard shadow is a shape on the floor,
                a soft one is an object above it. */}
            <filter id="dkc-soft" x="-70%" y="-200%" width="240%" height="500%">
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
            <filter id="dkc-soft-tight" x="-70%" y="-200%" width="240%" height="500%">
              <feGaussianBlur stdDeviation="2" />
            </filter>

            {/* One sun, upper left. Top faces brightest, left mid, right shaded. */}
            <linearGradient id="dkc-top" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#5285ff" />
              <stop offset="100%" stopColor="#2c62e9" />
            </linearGradient>
            <linearGradient id="dkc-left" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a60e8" />
              <stop offset="100%" stopColor="#1846c8" />
            </linearGradient>
            <linearGradient id="dkc-right" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1543bd" />
              <stop offset="100%" stopColor="#0e3095" />
            </linearGradient>
          </defs>

          {/* ── Far plane ──────────────────────────────────────────────────── */}
          <g filter="url(#dkc-far)">
            <motion.g
              animate={{ x: [0, -120] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: 'linear' }}
            >
              {[
                { y: 74, w: 150, o: 0.34 },
                { y: 96, w: 96, o: 0.26 },
                { y: 116, w: 186, o: 0.22 },
              ].map((l, i) => (
                <g key={i}>
                  <rect x={i * 120} y={l.y} width={l.w} height="4" rx="2" fill="#6f9aee" opacity={l.o} />
                  <rect
                    x={i * 120 + 240}
                    y={l.y}
                    width={l.w * 0.55}
                    height="4"
                    rx="2"
                    fill="#6f9aee"
                    opacity={l.o * 0.75}
                  />
                </g>
              ))}
            </motion.g>
          </g>

          {/* ── Mid plane ──────────────────────────────────────────────────── */}
          <g filter="url(#dkc-mid)">
            <motion.g
              animate={{ x: [0, -96] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <rect
                  key={i}
                  x={i * 96 - 40}
                  y="142"
                  width="54"
                  height="3"
                  rx="1.5"
                  fill="#9dbdf7"
                  opacity="0.5"
                />
              ))}
            </motion.g>
          </g>

          {/* ── The route ──────────────────────────────────────────────────── */}
          <path
            d="M40 176 C 120 169, 250 182, 322 174"
            stroke="#dbe5f8"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <motion.path
            d="M40 176 C 120 169, 250 182, 322 174"
            stroke="#1650e0"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: T.route, ease: EASE }}
          />
          {[
            { cx: 40, cy: 176, d: T.route },
            { cx: 322, cy: 174, d: T.route + 0.7 },
          ].map((n) => (
            <motion.circle
              key={n.cx}
              cx={n.cx}
              cy={n.cy}
              r="5.5"
              fill="#ffffff"
              stroke="#1650e0"
              strokeWidth="2.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: n.d, ease: EASE }}
              style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
            />
          ))}

          {/* ── Subject ─────────────────────────────────────────────────────
              Painted back to front: opening, then the parcel, then the front
              walls over the top of it. */}
          <motion.g
            initial={{ x: 0 }}
            animate={{ x: moving ? 168 : 0 }}
            transition={moving ? { duration: 1.02, ease: [0.5, 0, 0.72, 0.3] } : { duration: 0 }}
          >
            {/* Ground shadow */}
            <motion.ellipse
              cx={CRATE_X}
              cy={CRATE_Y + 2}
              rx="56"
              ry="10"
              fill="#0d2a6b"
              filter="url(#dkc-soft)"
              initial={{ opacity: 0, scaleX: 1.4 }}
              animate={{ opacity: 0.16, scaleX: 1 }}
              transition={{ duration: 0.5, delay: T.crate, ease: EASE }}
              style={{ transformOrigin: `${CRATE_X}px ${CRATE_Y + 2}px` }}
            />

            {/* Pass 1 — rim and opening. */}
            <motion.g {...entry}>
              <motion.g {...swap(!loaded)}>
                <polygon
                  points={CRATE.top}
                  fill="#eaf1ff"
                  stroke="#1650e0"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <polygon
                  points={CRATE.mouth}
                  fill="#a9c6f4"
                  stroke="#1650e0"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                  strokeLinejoin="round"
                />
              </motion.g>
              <motion.g initial={{ opacity: 0 }} {...swap(loaded)}>
                <polygon points={CRATE.top} fill="url(#dkc-top)" />
                <polygon points={CRATE.mouth} fill="#0c2a7a" />
              </motion.g>
            </motion.g>

            {/* Shadow the parcel throws onto the floor of the crate. Wide and
                faint at altitude, tight and dark on contact — the only element
                here that reports height, so it earns its keep. */}
            <motion.ellipse
              cx={CRATE_X}
              cy={PARCEL_REST_Y}
              rx="26"
              ry="10"
              fill="#0b2560"
              filter="url(#dkc-soft-tight)"
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: [0, 0.08, 0.32], scale: [2, 1.55, 1] }}
              transition={{ duration: FALL, delay: T.parcel, times: [0, 0.55, 1], ease: GRAVITY }}
              style={{ transformOrigin: `${CRATE_X}px ${PARCEL_REST_Y}px` }}
            />

            {/* The parcel — falls to a number, which is why it arrives. */}
            <motion.g
              initial={{ x: CRATE_X + 40, y: -150, opacity: 0 }}
              animate={{ x: CRATE_X, y: PARCEL_REST_Y, opacity: 1 }}
              transition={{
                duration: FALL,
                delay: T.parcel,
                ease: GRAVITY,
                opacity: { duration: 0.16, delay: T.parcel },
              }}
            >
              {/* Squash fires exactly on contact, never before. */}
              <motion.g
                initial={{ scaleY: 1 }}
                animate={{ scaleY: [1, 0.82, 1.06, 1] }}
                transition={{
                  duration: 0.32,
                  delay: T.land,
                  times: [0, 0.3, 0.62, 1],
                  ease: 'easeOut',
                }}
                style={{ transformOrigin: '0px 0px' }}
              >
                <polygon points={PARCEL.left} fill="url(#dkc-left)" />
                <polygon points={PARCEL.right} fill="url(#dkc-right)" />
                <polygon points={PARCEL.top} fill="url(#dkc-top)" />
                {/* tape seam, so it is a parcel rather than a cube */}
                <path d="M-22,-30 L22,-30" stroke="#ffffff" strokeWidth="1.5" opacity="0.45" />
              </motion.g>
            </motion.g>

            {/* Pass 2 — the front walls, over the parcel. This is the occlusion
                that makes the parcel read as inside the boot. */}
            <motion.g {...entry}>
              <motion.g {...swap(!loaded)}>
                <polygon
                  points={CRATE.left}
                  fill="#ffffff"
                  stroke="#1650e0"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <polygon
                  points={CRATE.right}
                  fill="#ffffff"
                  stroke="#1650e0"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              </motion.g>
              <motion.g initial={{ opacity: 0 }} {...swap(loaded)}>
                <polygon points={CRATE.left} fill="url(#dkc-left)" />
                <polygon points={CRATE.right} fill="url(#dkc-right)" />
              </motion.g>
            </motion.g>

            {/* Trails, only while it is genuinely moving. */}
            {moving &&
              [0, 1, 2].map((i) => (
                <motion.rect
                  key={i}
                  x={CRATE_X - 130}
                  y={118 + i * 15}
                  height="3"
                  rx="1.5"
                  fill="#7ba5ff"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: [0, 72, 0], opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.52, delay: i * 0.06, ease: 'easeOut' }}
                />
              ))}
          </motion.g>
        </motion.svg>

        {/* ── Wordmark ─────────────────────────────────────────────────────
            In the flow beneath the art, not floated over it. Reserved height
            keeps the composition from jumping when it arrives. */}
        <div className="flex min-h-[74px] flex-col items-center justify-start pt-1">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: moving ? 1 : 0, y: moving ? 0 : 12 }}
            transition={{ duration: 0.5, delay: moving ? 0.3 : 0, ease: EASE }}
          >
            <svg viewBox="0 0 48 48" width="30" height="30" aria-hidden>
              <path d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z" fill="#96b8ff" />
              <path d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z" fill="#1650e0" />
            </svg>
            <span className="text-display text-[26px] leading-none font-bold tracking-[-0.035em] text-black">
              DikkiConnect
            </span>
          </motion.div>

          <motion.p
            className="mt-3 text-[10.5px] font-semibold tracking-[0.24em] text-black/40 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: moving ? 1 : 0 }}
            transition={{ duration: 0.4, delay: moving ? 0.48 : 0 }}
          >
            Move more. Together.
          </motion.p>
        </div>
      </div>

      <motion.span
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brand-600"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: T.done, ease: 'linear' }}
      />
    </motion.div>
  )
}

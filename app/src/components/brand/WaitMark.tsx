/* ═══════════════════════════════════════════════════════════════════════════
   The waiting mark.

   One idea, told in four parts: a road draws itself between two points, a
   parcel rides the arc above it, and the far point lands as the parcel
   arrives. Then it starts again. That is the whole product in 2.2 seconds —
   a thing going somewhere it was already going.

   It replaced a grid of blue squares that flooded the frame on every route
   change. The squares were striking once and tiring by the tenth tap, and
   they said nothing; this says what the app is for, and it only appears when
   there is genuinely something to wait for.

   Pure CSS, no runtime, no dependency on anything in a lazy chunk — it has to
   be able to paint while the chunk it is waiting for is still in flight. The
   animation lives in index.css under "The waiting mark"; all four parts read
   the same `--wait-dur`, so the phases stay locked to each other however the
   browser schedules them.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Where the road starts and ends. The parcel's 60px travel is the span. */
const FROM_X = 14
const TO_X = 74
const ROAD_Y = 44

export function WaitMark({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 88 60"
      width={size}
      height={(size * 60) / 88}
      className={className}
      aria-hidden
      role="presentation"
    >
      {/* The road not yet travelled. */}
      <path
        d={`M${FROM_X} ${ROAD_Y} H${TO_X}`}
        fill="none"
        stroke="var(--color-ink-200)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* The road being travelled. pathLength="1" makes the dash units
          fractions of the whole, so the timing survives a redrawn path. */}
      <path
        d={`M${FROM_X} ${ROAD_Y} H${TO_X}`}
        pathLength={1}
        fill="none"
        stroke="var(--color-brand-600)"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="anim-road-draw"
      />

      {/* Where it left from — hollow, because it is now empty. */}
      <circle
        cx={FROM_X}
        cy={ROAD_Y}
        r="5"
        fill="var(--color-ink-50)"
        stroke="var(--color-brand-600)"
        strokeWidth="3.5"
      />

      {/* Where it arrives — solid, and it lands rather than appears. */}
      <circle cx={TO_X} cy={ROAD_Y} r="5.5" fill="var(--color-brand-600)" className="anim-pin-land" />

      {/* The parcel, riding the arc. Its centre sits over FROM_X at rest. */}
      <g className="anim-parcel-run">
        {/* rx was 4.5 on a 13px-tall box, which at this size rounds away the
            corners entirely and renders a coin with a stripe on it. A box
            needs to be visibly wider than it is tall and to keep its
            corners. */}
        <rect
          x={FROM_X - 8}
          y="16.5"
          width="16"
          height="12.5"
          rx="2.6"
          fill="var(--color-brand-600)"
        />
        {/* The tape — the one detail that makes it read as a box rather than
            a rounded rectangle. Thin: at 2.6 it split the box in half. */}
        <rect x={FROM_X - 8} y="20.6" width="16" height="2" fill="var(--color-brand-200)" />
      </g>
    </svg>
  )
}

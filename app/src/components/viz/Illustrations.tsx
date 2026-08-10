import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   Hand-built SVG art. Self-contained (no remote assets), theme-aware, and
   sized to sit inside cards and empty states without cropping.
   ═══════════════════════════════════════════════════════════════════════════ */

/** The hero graphic: two pins, a route, and a parcel riding a car's boot. */
export function HeroNetwork({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 220" className={cn('w-full', className)} fill="none" aria-hidden>
      {/* constellation */}
      <g opacity="0.5">
        {[
          [40, 46], [116, 26], [196, 40], [274, 22], [310, 70],
          [22, 118], [96, 96], [170, 74], [246, 92], [300, 132],
          [58, 176], [140, 158], [224, 168], [292, 190],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.6 : 1.7} fill="white" opacity={0.5} />
        ))}
        {[
          [40, 46, 116, 26], [116, 26, 196, 40], [196, 40, 274, 22], [274, 22, 310, 70],
          [22, 118, 96, 96], [96, 96, 170, 74], [170, 74, 246, 92], [246, 92, 300, 132],
          [58, 176, 140, 158], [140, 158, 224, 168], [224, 168, 292, 190],
          [40, 46, 96, 96], [196, 40, 170, 74], [96, 96, 58, 176], [246, 92, 224, 168],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="0.9" opacity={0.22} />
        ))}
      </g>

      {/* route */}
      <path
        d="M58 168 C 96 168 108 132 150 126 C 196 119 210 84 268 76"
        stroke="white"
        strokeOpacity="0.85"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="9 7"
        className="anim-route-flow"
      />
      <path
        d="M58 168 C 96 168 108 132 150 126 C 196 119 210 84 268 76"
        stroke="white"
        strokeOpacity="0.16"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* origin pin */}
      <g transform="translate(42, 138)">
        <circle cx="16" cy="30" r="6" fill="white" opacity="0.14" />
        <path
          d="M16 0c-8.8 0-16 7-16 15.7C0 27.3 16 42 16 42s16-14.7 16-26.3C32 7 24.8 0 16 0Z"
          fill="white"
        />
        <circle cx="16" cy="15.5" r="6.6" fill="#1650e0" />
      </g>

      {/* destination pin */}
      <g transform="translate(252, 46)">
        <circle cx="16" cy="30" r="6" fill="white" opacity="0.14" />
        <path
          d="M16 0c-8.8 0-16 7-16 15.7C0 27.3 16 42 16 42s16-14.7 16-26.3C32 7 24.8 0 16 0Z"
          fill="#96b8ff"
        />
        <circle cx="16" cy="15.5" r="6.6" fill="#0e339a" />
      </g>

      {/* parcel in transit — position on the outer <g>, motion on the inner one */}
      <g transform="translate(148, 92)">
        <g className="anim-bob">
          <rect x="0" y="7" width="44" height="34" rx="4" fill="#e0a86a" />
          <rect x="0" y="7" width="44" height="11" rx="3" fill="#c98b4b" />
          <rect x="18" y="7" width="8" height="34" fill="#b87a3c" opacity="0.75" />
          <rect x="6" y="24" width="14" height="7" rx="1.5" fill="#f5e2c8" opacity="0.85" />
          <ellipse cx="22" cy="46" rx="19" ry="3.2" fill="#091a4a" opacity="0.22" />
        </g>
      </g>
    </svg>
  )
}

/** Empty state: an open, empty box. */
export function EmptyBoxArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 130" className={cn('mb-4 w-[150px]', className)} fill="none" aria-hidden>
      <ellipse cx="80" cy="116" rx="46" ry="8" fill="#dfeaff" />
      <path d="M32 54h96v52a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V54Z" fill="#c2d7ff" />
      <path d="M32 54h96v14H32z" fill="#96b8ff" />
      <path d="M74 54h12v58H74z" fill="#628fff" opacity="0.55" />
      <path d="M24 32l16 22h36L60 32H24Z" fill="#96b8ff" />
      <path d="M136 32l-16 22H84l16-22h36Z" fill="#628fff" />
      <circle cx="80" cy="24" r="4" fill="#1650e0" opacity="0.35" />
      <circle cx="52" cy="16" r="2.6" fill="#1650e0" opacity="0.22" />
      <circle cx="110" cy="18" r="3.2" fill="#1650e0" opacity="0.28" />
    </svg>
  )
}

/** Empty state: a road with no cars on it. */
export function EmptyRoadArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 120" className={cn('mb-4 w-[160px]', className)} fill="none" aria-hidden>
      <ellipse cx="85" cy="106" rx="62" ry="9" fill="#eef1f8" />
      <path d="M22 106 L60 24 h50 l38 82 Z" fill="#dfeaff" />
      <path d="M79 24h12l14 82H67L79 24Z" fill="#f0f5ff" />
      <g fill="#96b8ff">
        <rect x="82" y="34" width="5" height="12" rx="2.5" />
        <rect x="81" y="54" width="6" height="14" rx="3" />
        <rect x="80" y="78" width="7" height="16" rx="3.5" />
      </g>
      <circle cx="36" cy="30" r="12" fill="#c2d7ff" opacity="0.6" />
      <circle cx="140" cy="42" r="8" fill="#c2d7ff" opacity="0.5" />
      <path d="M120 66c6-10 18-10 22 0" stroke="#96b8ff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** Empty state: an unplugged / offline cloud. */
export function OfflineArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cn('mb-4 w-[150px]', className)} fill="none" aria-hidden>
      <ellipse cx="80" cy="104" rx="48" ry="8" fill="#eef1f8" />
      <path
        d="M52 78a20 20 0 0 1 .8-40 28 28 0 0 1 53 6 18 18 0 0 1-4 34H52Z"
        fill="#cbd3e4"
      />
      <path
        d="M36 26l88 72"
        stroke="#ef4444"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path d="M36 26l88 72" stroke="#fef2f2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Empty state: a wallet with nothing in it. */
export function EmptyWalletArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cn('mb-4 w-[148px]', className)} fill="none" aria-hidden>
      <ellipse cx="80" cy="106" rx="46" ry="8" fill="#eef1f8" />
      <rect x="26" y="36" width="108" height="66" rx="12" fill="#c2d7ff" />
      <rect x="26" y="36" width="108" height="18" rx="9" fill="#96b8ff" />
      <rect x="96" y="60" width="46" height="26" rx="9" fill="#f0f5ff" />
      <circle cx="115" cy="73" r="6.5" fill="#1650e0" />
      <path
        d="M44 24l58 12"
        stroke="#96b8ff"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}

/** Success burst behind confirmation checkmarks. */
export function SuccessBurst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn('absolute inset-0', className)} fill="none" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        const r1 = 40
        const r2 = i % 2 ? 52 : 48
        return (
          <line
            key={i}
            x1={60 + Math.cos(a) * r1}
            y1={60 + Math.sin(a) * r1}
            x2={60 + Math.cos(a) * r2}
            y2={60 + Math.sin(a) * r2}
            stroke="#10b981"
            strokeWidth={i % 2 ? 2.6 : 1.8}
            strokeLinecap="round"
            opacity={i % 2 ? 0.55 : 0.32}
          />
        )
      })}
    </svg>
  )
}

/**
 * Confetti burst. Pieces fire outward from a point on their own arcs rather
 * than raining straight down — a burst reads as a reward, rain reads as
 * weather. Deterministic offsets keep it stable across re-renders.
 */
export function Confetti({
  pieces = 34,
  origin = '38%',
}: {
  pieces?: number
  /** Vertical launch point, e.g. the tick mark's centre. */
  origin?: string
}) {
  const colours = ['#1650e0', '#628fff', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ffffff']

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      {Array.from({ length: pieces }).map((_, i) => {
        // Fan the launch angles across a wide arc, with a deterministic jitter.
        const spread = (i / pieces) * 2 - 1 // -1 … 1
        const jitter = (((i * 71) % 23) - 11) / 100
        const dx = (spread + jitter) * 190
        const rise = 40 + ((i * 37) % 70)
        const delay = ((i * 29) % 34) / 100
        const round = i % 4 === 0

        return (
          <span
            key={i}
            className="anim-confetti absolute block"
            style={{
              left: '50%',
              top: origin,
              width: round ? 7 : 9,
              height: round ? 7 : 5,
              background: colours[i % colours.length],
              borderRadius: round ? '50%' : 1.5,
              animationDelay: `${delay}s`,
              animationDuration: `${1.5 + ((i % 5) * 0.16)}s`,
              ['--dx' as string]: `${dx}px`,
              ['--rise' as string]: `${-rise}px`,
              ['--rot' as string]: `${(i % 2 ? 1 : -1) * (420 + (i % 5) * 120)}deg`,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * A tick that draws itself inside a ring that pops. Used wherever a flow
 * completes — booking confirmed, custody accepted, delivered.
 */
export function SuccessMark({
  size = 84,
  tone = 'success',
}: {
  size?: number
  tone?: 'success' | 'brand'
}) {
  const ring = tone === 'success' ? '#10b981' : '#1650e0'
  const wash = tone === 'success' ? '#ecfdf5' : '#f0f5ff'

  return (
    <span
      className="anim-boing relative grid place-items-center rounded-full"
      style={{ width: size, height: size, background: wash }}
    >
      <svg viewBox="0 0 72 72" style={{ width: size * 0.76, height: size * 0.76 }} aria-hidden>
        <circle cx="36" cy="36" r="34" fill={ring} />
        <path
          d="M20 37.5 L31 48 L52 25"
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-draw"
          style={{ ['--len' as string]: 56, ['--dur' as string]: '0.5s', ['--delay' as string]: '0.24s' }}
        />
      </svg>
    </span>
  )
}

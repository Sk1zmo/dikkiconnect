import type { ReactNode } from 'react'
import {
  CloudSlash as CloudSlashIcon,
  Package as PackageIcon,
  Path as PathIcon,
  Wallet as WalletIcon,
} from '@phosphor-icons/react'
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
/* ═══════════════════════════════════════════════════════════════════════════
   Empty states.

   These used to be drawn scenes — a cardboard box, a road, a wallet. Drawn
   illustration is a genuine craft and a passable version of it reads worse
   than none at all: it makes a product look like a template.

   So the vocabulary here is the one Linear, Vercel and Stripe use instead —
   a single confident icon on a lit plate, over a dot grid that fades out at
   the edges. It carries no illustrative burden, scales to any concept by
   swapping the glyph, and is built from the same tokens as the rest of the UI,
   so it cannot drift out of step with the theme.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The plate. A soft radial glow, a fading dot grid, and a floating rounded
 * tile holding the glyph — with two accent motes drifting behind it so the
 * composition breathes without asking for attention.
 */
export function EmptyArt({
  icon,
  tone = 'brand',
  className,
}: {
  icon: ReactNode
  tone?: 'brand' | 'neutral' | 'success' | 'warn'
  className?: string
}) {
  const tones = {
    brand: { glow: 'rgba(22,80,224,0.16)', tile: 'from-brand-500 to-brand-700', mote: '#628fff' },
    neutral: { glow: 'rgba(99,116,150,0.14)', tile: 'from-ink-400 to-ink-600', mote: '#8fa3c8' },
    success: { glow: 'rgba(16,185,129,0.16)', tile: 'from-success-500 to-success-700', mote: '#34d399' },
    warn: { glow: 'rgba(245,158,11,0.18)', tile: 'from-warn-500 to-warn-600', mote: '#fbbf24' },
  }[tone]

  return (
    <div className={cn('relative mb-4 grid h-[132px] w-[132px] place-items-center', className)} aria-hidden>
      {/* Dot grid, masked to a circle so it has no visible edge */}
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,116,150,0.28) 1px, transparent 1px)',
          backgroundSize: '11px 11px',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 34%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 34%, transparent 72%)',
        }}
      />
      {/* Glow */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle at 50% 46%, ${tones.glow}, transparent 62%)` }}
      />
      {/* Drifting motes */}
      <span
        className="anim-bob absolute top-[14px] left-[16px] size-2 rounded-full opacity-70"
        style={{ background: tones.mote }}
      />
      <span
        className="anim-bob absolute right-[20px] bottom-[24px] size-1.5 rounded-full opacity-55"
        style={{ background: tones.mote, animationDelay: '0.9s' }}
      />
      {/* The tile */}
      <span
        className={cn(
          'anim-scale-in relative grid size-[62px] place-items-center rounded-[20px] bg-gradient-to-br text-white',
          'shadow-[0_10px_28px_rgba(16,26,56,0.16),inset_0_1px_0_rgba(255,255,255,0.28)]',
          tones.tile,
        )}
      >
        {icon}
      </span>
    </div>
  )
}

/** Empty state: nothing has been shipped yet. */
export function EmptyBoxArt({ className }: { className?: string }) {
  return <EmptyArt icon={<PackageIcon size={28} weight="duotone" />} className={className} />
}

/** Empty state: no rides on this route. */
export function EmptyRoadArt({ className }: { className?: string }) {
  return <EmptyArt icon={<PathIcon size={28} weight="duotone" />} className={className} />
}

/** Empty state: the connection dropped. */
export function OfflineArt({ className }: { className?: string }) {
  return (
    <EmptyArt icon={<CloudSlashIcon size={28} weight="duotone" />} tone="neutral" className={className} />
  )
}

/** Empty state: no money has moved yet. */
export function EmptyWalletArt({ className }: { className?: string }) {
  return <EmptyArt icon={<WalletIcon size={28} weight="duotone" />} className={className} />
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

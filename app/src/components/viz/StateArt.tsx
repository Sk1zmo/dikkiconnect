import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { MARK_DOT, MARK_PATH } from '@/components/brand/Logo'

/* ═══════════════════════════════════════════════════════════════════════════
   State art — one small world for every moment nothing is happening.

   Every empty, error, offline and not-found screen draws the same place: a
   pale sky, a road running to the right, the low sun that was setting in the
   opening. What changes is what is on the road. So a screen with nothing on
   it still looks like Stowza, and a person who has seen one of these knows
   how to read the next.

   Drawn flat, on a 220 × 140 stage, with one or two things that move (a bob,
   a pulse, a blink) so the picture is alive without asking for attention.
   All motion is a CSS class from index.css and stops under reduced motion.
   ═══════════════════════════════════════════════════════════════════════════ */

export type StateArtKind =
  | 'empty-boot'
  | 'road-end'
  | 'signal'
  | 'search'
  | 'bell'
  | 'broken'
  | 'wallet'
  | 'chat'
  | 'cones'
  | 'camera'
  | 'pin'
  | 'seat'
  | 'shelf'

const SKY = { top: '#eaf1ff', bottom: '#f7f9ff' }
const ROAD = '#d9e0f0'
const ROAD_DARK = '#c3cde3'
const INK = '#26314c'
const BRAND = '#1650e0'
const BRAND_SOFT = '#96b8ff'
const SUN = '#ffb668'

/** The stage: sky, sun, ground, road. Children are the subject. */
function Stage({ children, className, sun = true }: { children: ReactNode; className?: string; sun?: boolean }) {
  return (
    <svg viewBox="0 0 220 140" className={cn('mb-4 w-[200px] max-w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="sa-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY.top} />
          <stop offset="1" stopColor={SKY.bottom} />
        </linearGradient>
        <linearGradient id="sa-mark" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7ba5ff" />
          <stop offset="1" stopColor="#1650e0" />
        </linearGradient>
      </defs>
      <rect width="220" height="140" rx="22" fill="url(#sa-sky)" />
      {sun && <circle cx="176" cy="44" r="14" fill={SUN} opacity="0.85" className="anim-breathe" />}
      {/* Hills */}
      <path d="M0 96 C30 84 60 92 90 86 C120 80 150 90 180 84 C200 80 210 84 220 82 V140 H0 Z" fill="#e2e9f7" />
      {/* Road */}
      <path d="M0 118 H220 V140 H0 Z" fill={ROAD} />
      <path d="M0 117 H220" stroke={ROAD_DARK} strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={8 + i * 40} y="128" width="18" height="2.4" rx="1.2" fill="#ffffff" opacity="0.9" />
      ))}
      {children}
    </svg>
  )
}

/** The hatchback from behind, boot open — the app's own picture, in miniature. */
function Hatchback({ x = 110, y = 100, empty = true }: { x?: number; y?: number; empty?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="anim-bob">
      <ellipse cx="0" cy="18" rx="34" ry="4" fill={INK} opacity="0.12" />
      {/* Body */}
      <path d="M-30 14 V-6 Q-30 -12 -24 -13 L24 -13 Q30 -12 30 -6 V14 Z" fill="#ffffff" stroke="#c9d3e6" strokeWidth="1.4" />
      {/* Open tailgate */}
      <path d="M-22 -13 L-18 -30 L18 -30 L22 -13 Z" fill="#eef2fa" stroke="#c9d3e6" strokeWidth="1.4" />
      {/* Boot interior */}
      <rect x="-20" y="-11" width="40" height="18" rx="2" fill={INK} opacity="0.9" />
      {!empty && (
        <>
          <rect x="-15" y="-6" width="12" height="11" rx="1.5" fill="#c9985a" />
          <rect x="0" y="-8" width="14" height="13" rx="1.5" fill="#5b7bd6" />
        </>
      )}
      {/* Tail lights */}
      <rect x="-30" y="2" width="7" height="4" rx="2" fill="#ff5a5a" />
      <rect x="23" y="2" width="7" height="4" rx="2" fill="#ff5a5a" />
      {/* Plate + wheels */}
      <rect x="-9" y="6" width="18" height="5" rx="1" fill="#eef2fa" stroke="#c9d3e6" strokeWidth="1" />
      <rect x="-27" y="12" width="9" height="6" rx="2" fill={INK} />
      <rect x="18" y="12" width="9" height="6" rx="2" fill={INK} />
      </g>
    </g>
  )
}

function Parcel({ x, y, size = 22, dented = false }: { x: number; y: number; size?: number; dented?: boolean }) {
  const s = size
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-s / 2} y={-s / 2} width={s} height={s} rx="2.5" fill="#d9a86a" />
      <rect x={-s / 2} y={-s / 2} width={s} height={s * 0.42} rx="2.5" fill="#e8bd83" />
      <rect x={-2} y={-s / 2} width="4" height={s} fill="#f6e2bf" opacity="0.9" />
      {dented && (
        <path d={`M${s / 2 - 8} ${-s / 2} l4 5 l-6 4 l7 3`} stroke="#8a5a2b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      )}
    </g>
  )
}

function Mark({ x, y, size = 18 }: { x: number; y: number; size?: number }) {
  const k = size / 48
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${k})`}>
      <path d={MARK_PATH} fill="none" stroke="url(#sa-mark)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill="#3a68f5" />
    </g>
  )
}

const SCENES: Record<StateArtKind, () => ReactNode> = {
  /* Nothing booked: the car is here, the boot is open, and it is empty. */
  'empty-boot': () => <Hatchback empty />,

  /* 404: the road stops at a barrier, and the sign points back the way you came. */
  'road-end': () => (
    <>
      <rect x="150" y="98" width="70" height="42" fill="#e2e9f7" />
      <path d="M150 117 V140" stroke={ROAD_DARK} strokeWidth="1.2" />
      {/* Barrier */}
      <g transform="translate(150 104)">
        <rect x="-3" y="0" width="6" height="30" rx="1.5" fill={INK} opacity="0.85" />
        <rect x="-22" y="4" width="44" height="9" rx="2" fill="#ffffff" stroke="#c9d3e6" strokeWidth="1.2" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={-20 + i * 15} y="5.5" width="7" height="6" rx="1" fill={SUN} />
        ))}
        <circle cx="0" cy="-6" r="5" fill="#ff5a5a" className="anim-ping" />
        <circle cx="0" cy="-6" r="3" fill="#ff5a5a" />
      </g>
      {/* Signpost, pointing home */}
      <g transform="translate(60 84)">
        <rect x="-1.5" y="0" width="3" height="34" fill={INK} opacity="0.7" />
        <path d="M-24 4 H14 L20 10 L14 16 H-24 Z" fill="#ffffff" stroke="#c9d3e6" strokeWidth="1.2" />
        <Mark x={-13} y={10} size={11} />
        <rect x="-3" y="7" width="14" height="2.2" rx="1.1" fill={BRAND_SOFT} />
        <rect x="-3" y="11" width="9" height="2.2" rx="1.1" fill={BRAND_SOFT} />
      </g>
    </>
  ),

  /* Offline: a pin with the signal arcs, the last one missing. */
  signal: () => (
    <>
      <Hatchback x={70} y={100} empty={false} />
      <g transform="translate(160 66)">
        <path d="M0 30 C-18 12 -18 -6 0 -6 C18 -6 18 12 0 30 Z" fill={BRAND} />
        <circle cx="0" cy="6" r="6" fill="#ffffff" />
        <path d="M-14 -16 A22 22 0 0 1 14 -16" fill="none" stroke={BRAND_SOFT} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        <path d="M-24 -26 A36 36 0 0 1 24 -26" fill="none" stroke={BRAND_SOFT} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" opacity="0.5" className="anim-blink" />
        <path d="M-32 -36 A46 46 0 0 1 32 -36" fill="none" stroke="#c9d3e6" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" opacity="0.6" />
      </g>
    </>
  ),

  /* Search: a magnifier over the road, a route drawn under it. */
  search: () => (
    <>
      <path d="M20 106 C60 92 90 118 130 100 C160 88 180 100 205 90" fill="none" stroke={BRAND_SOFT} strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" className="anim-dash" />
      <circle cx="20" cy="106" r="5" fill={BRAND} />
      <circle cx="205" cy="90" r="5" fill="#ffffff" stroke={BRAND} strokeWidth="3" />
      <g transform="translate(118 70)"><g className="anim-bob">
        <circle cx="0" cy="0" r="22" fill="#ffffff" stroke={INK} strokeWidth="4" opacity="0.95" />
        <circle cx="0" cy="0" r="16" fill="#eaf1ff" />
        <path d="M16 16 L32 32" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        <Mark x={0} y={0} size={18} />
      </g></g>
    </>
  ),

  /* Notifications: a bell resting, and a moon — nothing needs you. */
  bell: () => (
    <>
      <Hatchback x={62} y={100} empty={false} />
      <g transform="translate(160 74)"><g className="anim-bob">
        <path d="M-18 14 C-18 -8 18 -8 18 14 L22 20 H-22 Z" fill="#ffffff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="0" cy="-12" r="3.5" fill={INK} />
        <path d="M-6 24 Q0 30 6 24" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g></g>
      <path d="M182 30 A10 10 0 1 0 192 42 A8 8 0 0 1 182 30 Z" fill={BRAND_SOFT} opacity="0.9" />
      <text x="196" y="70" fontSize="10" fontWeight="800" fill={BRAND_SOFT} fontFamily="var(--font-sans)">z</text>
      <text x="204" y="60" fontSize="8" fontWeight="800" fill={BRAND_SOFT} opacity="0.7" fontFamily="var(--font-sans)">z</text>
    </>
  ),

  /* Error: a parcel with a dented corner and a strip of warning tape. */
  broken: () => (
    <>
      <Hatchback x={62} y={100} empty />
      <g className="anim-bob" style={{ animationDelay: '0.4s' }}>
        <Parcel x={150} y={98} size={34} dented />
        <rect x="128" y="86" width="44" height="6" rx="3" fill={SUN} transform="rotate(-12 150 89)" />
        <path d="M130 89 H170" stroke={INK} strokeWidth="2" strokeDasharray="4 4" transform="rotate(-12 150 89)" opacity="0.6" />
      </g>
      <g transform="translate(176 58)">
        <path d="M0 -12 L12 10 H-12 Z" fill="#ffffff" stroke="#ff5a5a" strokeWidth="3" strokeLinejoin="round" />
        <rect x="-1.4" y="-3" width="2.8" height="7" rx="1.4" fill="#ff5a5a" />
        <circle cx="0" cy="6.5" r="1.6" fill="#ff5a5a" />
      </g>
    </>
  ),

  /* Wallet: a receipt on the passenger seat, so to speak. */
  wallet: () => (
    <>
      <Hatchback x={70} y={100} empty={false} />
      <g transform="translate(160 78)"><g className="anim-bob">
        <rect x="-22" y="-16" width="44" height="32" rx="6" fill={BRAND} />
        <rect x="-22" y="-8" width="44" height="6" fill="#0c2f92" opacity="0.5" />
        <rect x="6" y="-2" width="16" height="10" rx="3" fill="#ffffff" />
        <circle cx="14" cy="3" r="2.5" fill={BRAND} />
      </g></g>
      <circle cx="196" cy="50" r="6" fill={SUN} className="anim-ping" opacity="0.6" />
      <circle cx="196" cy="50" r="6" fill={SUN} />
    </>
  ),

  /* Messages: two bubbles over the road, one from each side. */
  chat: () => (
    <>
      <Hatchback x={62} y={100} empty={false} />
      <g transform="translate(140 64)"><g className="anim-bob">
        <path d="M-26 -14 H14 Q22 -14 22 -6 V6 Q22 14 14 14 H-12 L-22 22 V14 Q-26 14 -26 6 Z" fill={BRAND} />
        <rect x="-16" y="-6" width="26" height="3" rx="1.5" fill="#ffffff" opacity="0.9" />
        <rect x="-16" y="1" width="18" height="3" rx="1.5" fill="#ffffff" opacity="0.6" />
      </g></g>
      <g transform="translate(184 92)"><g className="anim-bob" style={{ animationDelay: '0.7s' }}>
        <path d="M-20 -12 H20 Q26 -12 26 -6 V4 Q26 10 20 10 H-2 L8 18 V10 H-20 Q-26 10 -26 4 V-6 Q-26 -12 -20 -12 Z" fill="#ffffff" stroke="#c9d3e6" strokeWidth="1.4" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={-9 + i * 9} cy="-1" r="2.4" fill={BRAND_SOFT} className="anim-blink" style={{ animationDelay: `${i * 0.25}s` }} />
        ))}
      </g></g>
    </>
  ),

  /* Maintenance: cones on the road, a sign, the car waiting patiently. */
  cones: () => (
    <>
      <Hatchback x={54} y={100} empty={false} />
      {[124, 150, 176].map((x, i) => (
        <g key={x} transform={`translate(${x} 118)`}>
          <ellipse cx="0" cy="0" rx="10" ry="2.5" fill={INK} opacity="0.12" />
          <path d="M-8 0 L-3 -22 H3 L8 0 Z" fill={SUN} />
          <rect x="-5.5" y="-14" width="11" height="4" fill="#ffffff" opacity="0.9" />
          <rect x="-10" y="-1" width="20" height="3" rx="1.5" fill="#e59a3c" />
          {i === 1 && <circle cx="0" cy="-30" r="4" fill="#ff5a5a" className="anim-blink" />}
        </g>
      ))}
      <g transform="translate(196 74)">
        <rect x="-1.5" y="0" width="3" height="44" fill={INK} opacity="0.7" />
        <rect x="-16" y="-14" width="32" height="24" rx="4" fill="#ffffff" stroke="#c9d3e6" strokeWidth="1.4" />
        <path d="M-7 -2 L0 -9 L7 -2 M0 -9 V6" stroke={BRAND} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </g>
    </>
  ),

  /* Camera permission: a viewfinder that cannot see. */
  camera: () => (
    <>
      <Parcel x={62} y={104} size={30} />
      <g transform="translate(150 78)"><g className="anim-bob">
        <rect x="-30" y="-18" width="60" height="40" rx="8" fill="#ffffff" stroke={INK} strokeWidth="3" />
        <rect x="-10" y="-25" width="20" height="8" rx="3" fill={INK} />
        <circle cx="0" cy="2" r="13" fill="#eaf1ff" stroke={INK} strokeWidth="3" />
        <circle cx="0" cy="2" r="6" fill={BRAND_SOFT} />
        <path d="M-24 -12 L24 16" stroke="#ff5a5a" strokeWidth="3.5" strokeLinecap="round" />
      </g></g>
    </>
  ),

  /* Location permission: a pin with a question. */
  pin: () => (
    <>
      <Hatchback x={62} y={100} empty={false} />
      <g transform="translate(160 64)"><g className="anim-bob">
        <path d="M0 40 C-24 16 -24 -8 0 -8 C24 -8 24 16 0 40 Z" fill={BRAND} />
        <circle cx="0" cy="8" r="9" fill="#ffffff" />
        <text x="0" y="12.5" textAnchor="middle" fontSize="13" fontWeight="800" fill={BRAND} fontFamily="var(--font-sans)">?</text>
      </g></g>
      <ellipse cx="160" cy="108" rx="16" ry="4" fill={BRAND_SOFT} opacity="0.35" className="anim-ping" />
    </>
  ),

  /* No rides: a bus-stop pole with nobody at it, and a car a long way off. */
  seat: () => (
    <>
      <g transform="translate(60 76)">
        <rect x="-1.5" y="0" width="3" height="42" fill={INK} opacity="0.7" />
        <rect x="-16" y="-14" width="32" height="20" rx="4" fill="#ffffff" stroke="#c9d3e6" strokeWidth="1.4" />
        <Mark x={0} y={-4} size={14} />
      </g>
      <rect x="40" y="110" width="40" height="8" rx="2" fill="#ffffff" stroke="#c9d3e6" strokeWidth="1.2" />
      <g transform="translate(184 106)"><g className="anim-bob">
        <rect x="-16" y="-8" width="32" height="12" rx="4" fill="#ffffff" stroke="#c9d3e6" strokeWidth="1.2" />
        <path d="M-10 -8 L-6 -14 H6 L10 -8" fill="#eef2fa" stroke="#c9d3e6" strokeWidth="1.2" />
        <circle cx="-9" cy="5" r="3" fill={INK} />
        <circle cx="9" cy="5" r="3" fill={INK} />
        <circle cx="-16" cy="0" r="2" fill={SUN} className="anim-blink" />
      </g></g>
    </>
  ),

  /* Empty shelves at the hub. */
  shelf: () => (
    <>
      <g transform="translate(110 70)">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${i * 20})`}>
            <rect x="-56" y="0" width="112" height="3" rx="1.5" fill={ROAD_DARK} />
            <rect x="-56" y="3" width="3" height="17" fill={ROAD_DARK} />
            <rect x="53" y="3" width="3" height="17" fill={ROAD_DARK} />
          </g>
        ))}
        <rect x="-56" y="60" width="112" height="3" rx="1.5" fill={ROAD_DARK} />
        <g className="anim-bob">
          <Parcel x={-30} y={-12} size={18} />
        </g>
        <path d="M-6 -12 h30 M-6 -6 h20" stroke={ROAD_DARK} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
      </g>
    </>
  ),
}

export function StateArt({ kind, className }: { kind: StateArtKind; className?: string }) {
  return <Stage className={className}>{SCENES[kind]()}</Stage>
}

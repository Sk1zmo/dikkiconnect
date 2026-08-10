import { useEffect, useState } from 'react'
import { Navigation, Plus, Minus, Layers } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from '@/components/ui'

/* ═══════════════════════════════════════════════════════════════════════════
   Vector map surfaces. Deliberately synthetic — they read as a real map
   without shipping a tile provider or an API key, and they animate.

   Two orientations, because the same landscape canvas cannot serve both a
   150px card strip and a full-bleed navigation screen: `slice` cropping would
   zoom the portrait case ~3× and cut the route out of frame entirely.
   ═══════════════════════════════════════════════════════════════════════════ */

const W = 430

/** Route geometry per orientation, kept clear of the crop margins. */
const GEO = {
  landscape: {
    h: 300,
    path: 'M60 198 C 110 198 120 162 170 152 C 226 141 248 118 330 116',
    origin: [50, 188] as const,
    dest: [318, 84] as const,
  },
  portrait: {
    h: 860,
    path: 'M70 760 C 136 700 112 600 188 524 C 264 448 242 344 324 250',
    origin: [60, 750] as const,
    dest: [312, 218] as const,
  },
}

/**
 * Procedural basemap. Legibility comes from hierarchy, not detail: two road
 * weights with casings, buildings offset from their footprints to suggest
 * height, and green/blue kept desaturated so the route stays the loudest mark.
 */
function MapBase({ dark, h }: { dark?: boolean; h: number }) {
  const land = dark ? '#0d1730' : '#eef2fb'
  const arterial = dark ? '#243356' : '#ffffff'
  const casing = dark ? '#101a33' : '#dde5f5'
  const local = dark ? '#1b2949' : '#f8fafe'
  const block = dark ? '#16224a' : '#dde5f4'
  const roof = dark ? '#1d2c5c' : '#ccd7ee'
  const water = dark ? '#0b1c44' : '#cfe0fa'
  const park = dark ? '#12291f' : '#d8eee0'

  const vArt = [8, 96, 174, 246, 324, 424]
  const hArt: number[] = []
  for (let y = 8; y < h + 70; y += 70) hArt.push(y)

  const blocks: Array<[number, number, number, number]> = []
  for (let i = 0; i < vArt.length - 1; i++) {
    for (let j = 0; j < hArt.length - 1; j++) {
      const x = vArt[i] + 7
      const y = hArt[j] + 7
      const bw = vArt[i + 1] - vArt[i] - 14
      const bh = hArt[j + 1] - hArt[j] - 14
      // Punch a few gaps so the grid doesn't read as wallpaper
      if ((i * 3 + j * 5) % 7 === 0) continue
      if (bw > 8 && bh > 8) blocks.push([x, y, bw, bh])
    }
  }

  return (
    <g>
      <rect width={W} height={h} fill={land} />

      {/* Water across the lower third */}
      <path
        d={`M0 ${h - 54}c58-26 96 10 148-6 44-13 74-40 122-30 34 7 60 34 160 22v68H0v-54Z`}
        fill={water}
      />
      <path
        d={`M0 ${h - 54}c58-26 96 10 148-6 44-13 74-40 122-30 34 7 60 34 160 22`}
        fill="none"
        stroke={dark ? '#1b3565' : '#b9d0f3'}
        strokeWidth="1.5"
        opacity="0.8"
      />

      {/* Park */}
      <ellipse cx="330" cy={h * 0.2} rx="62" ry="46" fill={park} />

      {/* Footprint, then roof offset up-left — reads as extruded */}
      {blocks.map(([x, y, bw, bh], i) => (
        <g key={i}>
          <rect x={x} y={y} width={bw} height={bh} rx={4} fill={block} />
          <rect
            x={x + 2}
            y={y - 2}
            width={bw - 4}
            height={bh - 4}
            rx={3}
            fill={roof}
            opacity={dark ? 0.55 : 0.85}
          />
        </g>
      ))}

      {/* Local streets — thin, no casing */}
      {hArt.map((y) => (
        <line key={`lh${y}`} x1="0" y1={y + 35} x2={W} y2={y + 35} stroke={local} strokeWidth="2.5" />
      ))}
      {[50, 138, 210, 288, 372].map((x) => (
        <line key={`lv${x}`} x1={x} y1="0" x2={x} y2={h} stroke={local} strokeWidth="2.5" />
      ))}

      {/* Arterials — casing under fill so junctions read cleanly */}
      {hArt.map((y, i) => (
        <g key={`h${y}`}>
          <line x1="0" y1={y} x2={W} y2={y} stroke={casing} strokeWidth={i % 3 === 1 ? 10 : 6.5} />
          <line x1="0" y1={y} x2={W} y2={y} stroke={arterial} strokeWidth={i % 3 === 1 ? 7 : 4} />
        </g>
      ))}
      {vArt.map((x) => (
        <g key={`v${x}`}>
          <line x1={x} y1="0" x2={x} y2={h} stroke={casing} strokeWidth={x === 246 ? 9 : 6.5} />
          <line x1={x} y1="0" x2={x} y2={h} stroke={arterial} strokeWidth={x === 246 ? 6 : 4} />
        </g>
      ))}
    </g>
  )
}

/** Static route preview — origin pin, destination pin, the highway between. */
export function RouteMap({
  height = 190,
  dark,
  className,
  fromLabel,
  toLabel,
  progress,
  portrait,
}: {
  /** Number for a fixed strip, or "100%" to fill an absolutely-placed parent. */
  height?: number | string
  dark?: boolean
  className?: string
  fromLabel?: string
  toLabel?: string
  /** 0–1 along the route; renders a vehicle puck when provided. */
  progress?: number
  /** Use the tall canvas — required for full-bleed navigation screens. */
  portrait?: boolean
}) {
  const geo = portrait ? GEO.portrait : GEO.landscape
  const { path, h } = { path: geo.path, h: geo.h }
  const [len, setLen] = useState(0)
  const [puck, setPuck] = useState<{ x: number; y: number } | null>(null)

  // Walk the path to place the puck — cheap and exact.
  useEffect(() => {
    if (progress == null) return
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    el.setAttribute('d', path)
    const total = el.getTotalLength()
    setLen(total)
    const p = el.getPointAtLength(total * Math.min(1, Math.max(0, progress)))
    setPuck({ x: p.x, y: p.y })
  }, [progress, path])

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="xMidYMid slice" className="size-full">
        <MapBase dark={dark} h={h} />

        {/* Glow, casing, then the line itself. With `progress` the full path is
            muted and the travelled part overlaid bright, so the colour break
            sits exactly at the vehicle. */}
        <path d={path} stroke="#1650e0" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.14" />
        <path d={path} stroke={dark ? '#0b1020' : '#ffffff'} strokeWidth="11" fill="none" strokeLinecap="round" />

        {progress == null ? (
          <path
            d={path}
            stroke="#1650e0"
            strokeWidth="5.5"
            fill="none"
            strokeLinecap="round"
            className="anim-draw"
            style={{ ['--len' as string]: 1200, ['--dur' as string]: '1.1s' }}
          />
        ) : (
          <>
            <path d={path} stroke="#a9c6ff" strokeWidth="5.5" fill="none" strokeLinecap="round" />
            {len > 0 && (
              <path
                d={path}
                stroke="#1650e0"
                strokeWidth="5.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - progress)}
              />
            )}
          </>
        )}

        {/* origin */}
        <g transform={`translate(${geo.origin[0]}, ${geo.origin[1]})`}>
          <circle cx="10" cy="10" r="14" fill="#1650e0" opacity="0.16" className="anim-breathe" />
          <circle cx="10" cy="10" r="8.5" fill="#ffffff" />
          <circle cx="10" cy="10" r="5.5" fill="#1650e0" />
        </g>

        {/* destination — pin tip lands on the end of the route */}
        <g transform={`translate(${geo.dest[0]}, ${geo.dest[1]})`} className="anim-bob">
          <ellipse cx="12" cy="32" rx="7" ry="2.6" fill="#091a4a" opacity="0.2" />
          <path
            d="M12 0C5.4 0 0 5.3 0 11.8 0 20.5 12 32 12 32s12-11.5 12-20.2C24 5.3 18.6 0 12 0Z"
            fill="#1650e0"
          />
          <path d="M12 0C5.4 0 0 5.3 0 11.8h24C24 5.3 18.6 0 12 0Z" fill="#4c7ef5" />
          <circle cx="12" cy="11.6" r="4.8" fill="#ffffff" />
        </g>

        {/* moving vehicle */}
        {puck && (
          <g transform={`translate(${puck.x - 14}, ${puck.y - 14})`}>
            <circle cx="14" cy="14" r="14" fill="#1650e0" opacity="0.22" className="anim-breathe" />
            <circle cx="14" cy="14" r="10" fill="#ffffff" />
            <circle cx="14" cy="14" r="6.5" fill="#1650e0" />
          </g>
        )}
      </svg>

      {(fromLabel || toLabel) && (
        <>
          {fromLabel && (
            <span className="absolute bottom-4 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-ink-700 shadow-(--shadow-e1) backdrop-blur">
              {fromLabel}
            </span>
          )}
          {toLabel && (
            <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-ink-700 shadow-(--shadow-e1) backdrop-blur">
              {toLabel}
            </span>
          )}
        </>
      )}
    </div>
  )
}

/** Live tracking map — animated puck, controls, dark option for navigation. */
export function LiveMap({
  height = 320,
  dark,
  className,
  children,
  portrait,
}: {
  /** Number for a fixed strip, or "100%" to fill an absolutely-placed parent. */
  height?: number | string
  dark?: boolean
  className?: string
  children?: React.ReactNode
  portrait?: boolean
}) {
  const [t, setT] = useState(0.34)

  useEffect(() => {
    const id = setInterval(() => setT((v) => (v >= 0.94 ? 0.06 : v + 0.004)), 220)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <RouteMap height={height} dark={dark} progress={t} portrait={portrait} />

      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <IconButton icon={<Plus size={16} />} label="Zoom in" tone="glass" size={36} />
        <IconButton icon={<Minus size={16} />} label="Zoom out" tone="glass" size={36} />
        <IconButton icon={<Layers size={16} />} label="Map layers" tone="glass" size={36} />
      </div>
      <div className="absolute right-3 bottom-3">
        <IconButton
          icon={<Navigation size={16} className="fill-current" />}
          label="Recentre"
          tone="solid"
          size={40}
        />
      </div>

      {children}
    </div>
  )
}

/** Compact hub locator — several pins, one highlighted. */
export function HubMap({
  height = 160,
  count = 4,
  activeIndex = 0,
  className,
}: {
  height?: number
  count?: number
  activeIndex?: number
  className?: string
}) {
  // Same safe band as RouteMap — pins sit between y≈88 and y≈212.
  const spots = [
    [86, 106],
    [216, 88],
    [292, 160],
    [136, 180],
    [348, 118],
    [48, 172],
  ].slice(0, count)

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <svg viewBox="0 0 430 300" preserveAspectRatio="xMidYMid slice" className="size-full">
        <MapBase h={300} />
        {/* you-are-here */}
        <g transform="translate(178, 134)">
          <circle cx="10" cy="10" r="26" fill="#1650e0" opacity="0.12" className="anim-ping" />
          <circle cx="10" cy="10" r="11" fill="#ffffff" />
          <circle cx="10" cy="10" r="7" fill="#1650e0" />
        </g>
        {spots.map(([x, y], i) => (
          <g key={i} transform={`translate(${x}, ${y})`} className={i === activeIndex ? 'anim-bob' : undefined}>
            <ellipse cx="11" cy="30" rx="6" ry="2.4" fill="#091a4a" opacity="0.18" />
            <path
              d="M11 0C4.9 0 0 4.9 0 10.9 0 19 11 30 11 30s11-11 11-19.1C22 4.9 17.1 0 11 0Z"
              fill={i === activeIndex ? '#1650e0' : '#96b8ff'}
            />
            <circle cx="11" cy="10.8" r="4.4" fill="#ffffff" />
          </g>
        ))}
      </svg>
    </div>
  )
}

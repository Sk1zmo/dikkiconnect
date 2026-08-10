// Decorative city-map SVG for logistics app

export function MapView({ height = 200, showRoute = true }: { height?: number; showRoute?: boolean }) {
  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
      <svg width="100%" height={height} viewBox="0 0 430 240" preserveAspectRatio="xMidYMid slice">
        {/* Base */}
        <rect width="430" height="240" fill="#E8EEF8" />

        {/* Grid roads */}
        {[0, 60, 120, 180, 240].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="430" y2={y} stroke="#fff" strokeWidth="2" />
        ))}
        {[0, 80, 160, 240, 320, 400].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="240" stroke="#fff" strokeWidth="2" />
        ))}

        {/* City blocks */}
        {[
          [10, 10, 60, 45], [90, 10, 60, 45], [170, 10, 60, 45], [250, 10, 60, 45], [330, 10, 90, 45],
          [10, 65, 60, 50], [90, 65, 140, 50], [250, 65, 60, 50], [330, 65, 90, 50],
          [10, 130, 60, 45], [90, 130, 60, 45], [170, 130, 60, 45], [250, 130, 60, 45], [330, 130, 90, 45],
          [10, 185, 140, 50], [170, 185, 60, 50], [250, 185, 170, 50],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={3} fill="#D4DCF0" />
        ))}

        {/* Highlight blocks (buildings) */}
        {[
          [18, 18, 20, 28, '#C8D4EC'], [48, 18, 12, 20, '#BEC8E0'],
          [98, 18, 24, 38, '#C0CDE8'], [136, 18, 14, 28, '#BEC8E0'],
          [258, 18, 32, 38, '#C8D4EC'], [298, 18, 8, 20, '#BEC8E0'],
          [98, 72, 52, 38, '#C8D4EC'], [158, 72, 62, 38, '#C0CDE8'],
        ].map(([x, y, w, h, fill], i) => (
          <rect key={`b${i}`} x={x} y={y} width={w} height={h} rx={2} fill={fill as string} />
        ))}

        {showRoute && (
          <>
            {/* Route path */}
            <path
              d="M 80 200 Q 80 160 130 155 Q 200 148 220 120 Q 240 95 310 80"
              stroke="#1B44E8"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 5"
              opacity="0.85"
            />
            {/* Route glow */}
            <path
              d="M 80 200 Q 80 160 130 155 Q 200 148 220 120 Q 240 95 310 80"
              stroke="#3B6EF8"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              opacity="0.2"
            />

            {/* Origin pin */}
            <g transform="translate(73, 192)">
              <circle cx="7" cy="7" r="9" fill="#1B44E8" opacity="0.2" />
              <circle cx="7" cy="7" r="5.5" fill="#1B44E8" />
              <circle cx="7" cy="7" r="2.5" fill="#fff" />
            </g>

            {/* Destination pin */}
            <g transform="translate(302, 62)">
              <ellipse cx="8" cy="24" rx="3" ry="1.5" fill="rgba(27,68,232,0.25)" />
              <path d="M8 0 C3.58 0 0 3.58 0 8 C0 14 8 24 8 24 C8 24 16 14 16 8 C16 3.58 12.42 0 8 0Z" fill="#1B44E8" />
              <circle cx="8" cy="8.5" r="3.5" fill="#fff" />
            </g>

            {/* Moving vehicle dot */}
            <circle cx="185" cy="132" r="8" fill="#fff" />
            <circle cx="185" cy="132" r="5.5" fill="#1B44E8" />
          </>
        )}
      </svg>

      {/* Top gradient fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        background: 'linear-gradient(to top, var(--bg), transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// Blue hero map for home screens
export function HeroMap({ height = 260 }: { height?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(145deg, #1B44E8 0%, #0F2AA6 60%, #0A1F80 100%)',
      }} />

      {/* Network dots */}
      <svg style={{ position: 'absolute', inset: 0 }} width="100%" height={height} viewBox="0 0 430 260">
        {[
          [80, 120], [180, 80], [300, 100], [150, 180], [260, 150], [350, 60],
          [60, 60], [340, 200], [200, 220],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="rgba(255,255,255,0.3)" />
        ))}
        {[
          [80,120,180,80], [180,80,300,100], [80,120,150,180], [180,80,260,150],
          [300,100,260,150], [300,100,350,60], [150,180,260,150], [150,180,200,220],
          [260,150,340,200], [350,60,300,100],
        ].map(([x1,y1,x2,y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        ))}

        {/* Origin pin */}
        <g transform="translate(136,166)">
          <circle cx="14" cy="14" r="20" fill="rgba(255,255,255,0.1)" />
          <circle cx="14" cy="14" r="12" fill="rgba(255,255,255,0.2)" />
          <path d="M14 2 C8 2 3 7 3 13 C3 21 14 30 14 30 C14 30 25 21 25 13 C25 7 20 2 14 2Z" fill="#2563EB" />
          <path d="M14 2 C8 2 3 7 3 13 C3 21 14 30 14 30 C14 30 25 21 25 13 C25 7 20 2 14 2Z" fill="white" fillOpacity="0.9" />
          <circle cx="14" cy="13" r="5" fill="#1B44E8" />
        </g>

        {/* Destination pin */}
        <g transform="translate(287,86)">
          <circle cx="14" cy="14" r="16" fill="rgba(255,255,255,0.1)" />
          <path d="M14 2 C8 2 3 7 3 13 C3 21 14 30 14 30 C14 30 25 21 25 13 C25 7 20 2 14 2Z" fill="#3B6EF8" />
          <circle cx="14" cy="13" r="5" fill="white" />
        </g>

        {/* Route */}
        <path
          d="M150 190 Q 180 170 200 150 Q 230 125 300 105"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />

        {/* Package */}
        <g transform="translate(210, 140)">
          <rect x="0" y="0" width="24" height="22" rx="3" fill="#F59E0B" />
          <rect x="0" y="0" width="24" height="8" rx="3" fill="#D97706" />
          <line x1="12" y1="0" x2="12" y2="22" stroke="#D97706" strokeWidth="1" />
        </g>
      </svg>
    </div>
  )
}

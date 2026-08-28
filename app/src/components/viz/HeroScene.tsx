import { cn } from '@/lib/cn'

/**
 * The launch-screen hero: a dusk highway heading into the city with the whole
 * fleet on it — bike, van, bus, car — and a courier loading parcels at a hub.
 *
 * Vector rather than photographic on purpose: it ships inside the bundle, is
 * pin-sharp at any density (no 2x/3x raster to pick between), needs no licence,
 * and stays exactly on-palette.
 *
 * Depth comes from three things, in order of importance:
 *   1. Atmospheric perspective — distant layers are hazed toward the sky colour
 *      and blurred, near ones are crisp and dark. This does most of the work.
 *   2. Rim light — every object catches the sun on its sun-facing edge.
 *   3. Ground contact — soft shadows and wet reflections tie objects down.
 *
 * Canvas is 390×844 (a stock phone) so `slice` crops almost nothing. Budget:
 *   0–400   sky, skyline, flyover, gantry
 *   400     horizon
 *   400–620 road and the fleet — everything that must stay visible
 *   620–844 empty tarmac, sits behind the white sheet
 */
export function HeroScene({
  className,
  /** Crop anchor. Short banners want `xMidYMin` so the sky and skyline survive
   *  instead of the frame landing on the middle of the road. */
  align = 'xMidYMid',
}: {
  className?: string
  align?: 'xMidYMin' | 'xMidYMid' | 'xMidYMax'
}) {
  return (
    <svg
      viewBox="0 0 390 844"
      preserveAspectRatio={`${align} slice`}
      className={cn('size-full', className)}
      aria-hidden
    >
      <defs>
        {/* The road covers everything below y=400 (47.4%), so the whole
            night→ember ramp has to resolve above that line. */}
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#030715" />
          <stop offset="14%" stopColor="#050e28" />
          <stop offset="26%" stopColor="#0b1c48" />
          <stop offset="35%" stopColor="#1d2f66" />
          <stop offset="40%" stopColor="#3c4179" />
          <stop offset="43.5%" stopColor="#6d4f78" />
          <stop offset="45.5%" stopColor="#a85f6b" />
          <stop offset="47%" stopColor="#dd7f4c" />
          <stop offset="48.5%" stopColor="#ffb46a" />
          <stop offset="50%" stopColor="#ffd79c" />
          <stop offset="100%" stopColor="#ffe3b8" />
        </linearGradient>

        <radialGradient id="hs-sunglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff4d8" stopOpacity="0.95" />
          <stop offset="26%" stopColor="#ffcf8c" stopOpacity="0.5" />
          <stop offset="62%" stopColor="#f08a52" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#e0704a" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="hs-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a5068" />
          <stop offset="12%" stopColor="#453a58" />
          <stop offset="40%" stopColor="#241f36" />
          <stop offset="100%" stopColor="#0d0c16" />
        </linearGradient>

        <linearGradient id="hs-reflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc078" stopOpacity="0.62" />
          <stop offset="35%" stopColor="#ff9a55" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ff8a4a" stopOpacity="0" />
        </linearGradient>

        {/* Towers pick up the sky at their base — cheap aerial perspective */}
        <linearGradient id="hs-tower-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#26305c" />
          <stop offset="100%" stopColor="#6a5a80" />
        </linearGradient>
        <linearGradient id="hs-tower-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141d40" />
          <stop offset="100%" stopColor="#3d3660" />
        </linearGradient>

        <linearGradient id="hs-van-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#37507f" />
          <stop offset="55%" stopColor="#22315c" />
          <stop offset="100%" stopColor="#111935" />
        </linearGradient>
        <linearGradient id="hs-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cfe0ff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#7ba5ff" stopOpacity="0.3" />
        </linearGradient>

        {/* Headlight / taillight cones */}
        <linearGradient id="hs-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff0c4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd08a" stopOpacity="0" />
        </linearGradient>

        {/* Distance blur — the single biggest depth cue in the frame */}
        <filter id="hs-haze" x="-12%" y="-12%" width="124%" height="124%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id="hs-haze-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
        <filter id="hs-bloom" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        <radialGradient id="hs-vignette" cx="0.5" cy="0.46" r="0.78">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#030715" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* ══ Sky ═════════════════════════════════════════════════════════════ */}
      <rect width="390" height="844" fill="url(#hs-sky)" />

      {/* Stars, each on its own twinkle period */}
      <g>
        {[
          [30, 40, 0.6], [78, 22, 0.45], [126, 58, 0.55], [172, 30, 0.4],
          [220, 68, 0.5], [266, 26, 0.6], [312, 62, 0.35], [356, 34, 0.5],
          [52, 92, 0.4], [200, 104, 0.32], [338, 116, 0.3], [104, 126, 0.28],
          [244, 140, 0.24], [22, 150, 0.26], [150, 86, 0.42], [292, 96, 0.36],
        ].map(([cx, cy, o], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i % 3 === 0 ? 1.5 : 0.9}
            fill="#fff"
            className="anim-twinkle"
            style={{ ['--o' as string]: o, ['--dur' as string]: `${3 + (i % 5) * 0.9}s` }}
          />
        ))}
      </g>

      {/* Sun — bloom, disc, and a hot core */}
      <g className="anim-glow">
        <ellipse cx="232" cy="390" rx="150" ry="96" fill="url(#hs-sunglow)" />
      </g>
      <circle cx="232" cy="386" r="30" fill="#ffcf8c" opacity="0.4" filter="url(#hs-bloom)" />
      <circle cx="232" cy="386" r="20" fill="#fff3d2" />

      {/* Thin cloud bars catching the last light */}
      <g filter="url(#hs-haze-soft)" opacity="0.5">
        <rect x="130" y="330" width="150" height="5" rx="2.5" fill="#ffb877" />
        <rect x="60" y="352" width="120" height="4" rx="2" fill="#ff9f68" opacity="0.8" />
        <rect x="250" y="344" width="110" height="4" rx="2" fill="#ffc890" opacity="0.7" />
      </g>

      {/* Vapour trail + plane, looping across */}
      <g className="anim-fly">
        <path
          d="M150 186 C 196 176 232 164 272 150"
          stroke="#ffe9c8"
          strokeWidth="1.4"
          opacity="0.3"
          strokeLinecap="round"
          fill="none"
        />
        <g transform="translate(268 142)" fill="#eef2fc">
          <path d="M0 6 L14 4 L19 0 L21 4 L28 3.4 L20 8 L21 12 L18 9 L14 9.6 Z" />
        </g>
      </g>

      {/* ══ Skyline — two hazed depth bands ═════════════════════════════════ */}
      <g filter="url(#hs-haze-soft)" opacity="0.75">
        {[
          [196, 322, 15, 78], [252, 300, 19, 100], [292, 330, 14, 70],
          [334, 312, 18, 88], [372, 336, 16, 64],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="url(#hs-tower-far)" />
        ))}
      </g>

      <g filter="url(#hs-haze)">
        {[
          [214, 296, 17, 104], [234, 262, 21, 138], [258, 310, 16, 90],
          [277, 244, 23, 156], [303, 288, 18, 112], [324, 266, 21, 134],
          [348, 306, 16, 94], [367, 276, 23, 124],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill="url(#hs-tower-near)" />
            {/* sun-facing edge */}
            <rect x={x} y={y} width="1.6" height={h} fill="#ffb877" opacity="0.34" />
            {Array.from({ length: Math.floor(h / 17) }).map((_, r) =>
              Array.from({ length: Math.max(1, Math.floor(w / 8)) }).map((__, c) => {
                if ((i + r * 3 + c * 5) % 4 !== 0) return null
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={x + 3 + c * 8}
                    y={y + 8 + r * 17}
                    width="2.8"
                    height="4.2"
                    fill="#ffd79a"
                    className="anim-flicker"
                    style={{ animationDelay: `${(i + r + c) * 0.7}s` }}
                  />
                )
              }),
            )}
          </g>
        ))}
        <rect x="0" y="384" width="390" height="16" fill="#5b4a72" opacity="0.4" />
      </g>

      {/* ══ Flyover + metro ═════════════════════════════════════════════════ */}
      <g>
        <rect x="0" y="356" width="390" height="8" fill="#141d3a" />
        <rect x="0" y="356" width="390" height="1.6" fill="#ffb877" opacity="0.3" />
        <rect x="0" y="364" width="390" height="3.5" fill="#0b1128" />
        {[14, 74, 134, 194, 254, 314, 374].map((x) => (
          <rect key={x} x={x} y="367" width="8" height="33" fill="#101734" opacity="0.92" />
        ))}
        <g transform="translate(30 338)">
          <rect width="112" height="18" rx="5" fill="#2b3c6a" />
          <rect x="0" y="0" width="112" height="2" rx="1" fill="#ffb877" opacity="0.35" />
          <rect x="5" y="4" width="102" height="7" rx="3" fill="#8fb2ff" opacity="0.45" />
          {[9, 31, 53, 75].map((x, i) => (
            <rect
              key={x}
              x={x}
              y="5"
              width="13"
              height="5"
              rx="2"
              fill="#ffe3b0"
              className="anim-flicker"
              style={{ animationDelay: `${i * 0.9}s` }}
            />
          ))}
        </g>
      </g>

      {/* Trees, hazed */}
      <g fill="#0c1428" filter="url(#hs-haze)">
        <ellipse cx="18" cy="378" rx="30" ry="30" />
        <ellipse cx="56" cy="386" rx="23" ry="23" />
        <ellipse cx="90" cy="382" rx="18" ry="19" />
      </g>

      {/* ══ Road ════════════════════════════════════════════════════════════ */}
      <path d="M0 844 L0 400 H390 V844 Z" fill="url(#hs-road)" />
      <rect x="0" y="398" width="390" height="3" fill="#c98a6a" opacity="0.4" />

      {/* Wet reflection of the sun, widening toward the viewer */}
      <path d="M214 402 L268 402 L322 844 L162 844 Z" fill="url(#hs-reflect)" />

      {/* Lane dashes rushing toward camera */}
      <g>
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d="M186 404 L193 404 L188 432 L178 432 Z"
            fill="#ffe6bd"
            className="anim-rush"
            style={{ ['--dur' as string]: '3.4s', animationDelay: `${i * -0.85}s` }}
          />
        ))}
      </g>

      {/* Kerb rim light */}
      <path d="M0 402 H390" stroke="#ffb877" strokeWidth="1" opacity="0.18" />

      {/* ══ Gantry sign ═════════════════════════════════════════════════════ */}
      <g>
        <rect x="20" y="300" width="5" height="100" fill="#0d1428" />
        <rect x="20" y="300" width="5" height="100" fill="#ffb877" opacity="0.12" />
        <rect x="20" y="300" width="140" height="5" fill="#0d1428" />
        <g transform="translate(28 308)">
          <rect width="132" height="44" rx="7" fill="#0c2a63" />
          <rect width="132" height="44" rx="7" fill="none" stroke="#8fb2ff" strokeWidth="1.3" opacity="0.75" />
          <rect x="0" y="0" width="132" height="1.6" rx="0.8" fill="#ffffff" opacity="0.18" />
          <text x="12" y="19" fill="#ffffff" fontSize="11.5" fontWeight="700" fontFamily="var(--font-sans)">
            Smarter Logistics
          </text>
          <text x="12" y="34" fill="#ffffff" fontSize="11.5" fontWeight="700" fontFamily="var(--font-sans)">
            Stronger India
          </text>
          <path
            d="M112 22 h9 m-3.5 -3.5 L121 22 l-3.5 3.5"
            stroke="#ffffff"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* ══ Hub canopy + frontage, right ════════════════════════════════════ */}
      <g>
        <path d="M390 0 L390 214 L292 84 L322 0 Z" fill="#080d1e" />
        <path d="M390 0 L390 214 L292 84 L322 0 Z" fill="#1a2444" opacity="0.7" />
        <path d="M322 0 L292 84 L390 214" fill="none" stroke="#7d93d4" strokeWidth="2" opacity="0.55" />
        {/* Recessed downlights. Static — LED fittings don't flicker, and an
            opacity animation here would override the glow's own low alpha. */}
        {[[348, 54], [368, 122]].map(([cx, cy], i) => (
          <g key={i}>
            <ellipse cx={cx} cy={cy + 8} rx="26" ry="16" fill="#ffd08a" opacity="0.11" />
            <ellipse cx={cx} cy={cy} rx="9" ry="4" fill="#1b150f" />
            <ellipse cx={cx} cy={cy} rx="6" ry="2.4" fill="#ffeccb" />
          </g>
        ))}
        <path d="M344 176 L390 226 V400 H344 Z" fill="#131c38" opacity="0.85" />
        <path d="M350 196 L390 240 V318 H350 Z" fill="#ffb877" opacity="0.15" />
        <path d="M344 176 L390 226" stroke="#8fb2ff" strokeWidth="1.4" opacity="0.35" />
      </g>

      {/* ══ Bus, far ════════════════════════════════════════════════════════ */}
      <g transform="translate(288 404)">
        <rect x="0" y="0" width="60" height="38" rx="6" fill="#3d4a72" />
        <path d="M6 0 h48" stroke="#ffb877" strokeWidth="2" opacity="0.55" />
        <rect x="4" y="4" width="52" height="14" rx="3" fill="url(#hs-glass)" />
        <rect x="4" y="23" width="18" height="9" rx="2" fill="#ffe3b0" opacity="0.75" />
        <rect x="38" y="23" width="18" height="9" rx="2" fill="#ffe3b0" opacity="0.75" />
        <circle cx="15" cy="40" r="5.5" fill="#12172b" />
        <circle cx="47" cy="40" r="5.5" fill="#12172b" />
      </g>

      {/* ══ Car, mid ════════════════════════════════════════════════════════ */}
      <g transform="translate(206 430)">
        <ellipse cx="25" cy="37" rx="30" ry="4" fill="#080b16" opacity="0.5" />
        <path d="M2 17 L10 5 h28 l9 12 z" fill="#3a4877" />
        <path d="M10 5 h28 l9 12" fill="none" stroke="#ffb877" strokeWidth="1.6" opacity="0.5" />
        <rect x="0" y="16" width="49" height="13" rx="6" fill="#1e2848" />
        <rect x="12" y="8" width="24" height="8" rx="2" fill="url(#hs-glass)" />
        <circle cx="12" cy="30" r="5" fill="#0e1326" />
        <circle cx="38" cy="30" r="5" fill="#0e1326" />
        <rect x="0" y="20" width="4" height="5" rx="1.5" fill="#ff6b5a" />
        <ellipse cx="25" cy="35" rx="27" ry="3" fill="#ff9f5a" opacity="0.2" />
      </g>

      {/* ══ Delivery van — the hero vehicle ═════════════════════════════════ */}
      <g transform="translate(56 424)">
        <ellipse cx="70" cy="114" rx="86" ry="10" fill="#06090f" opacity="0.55" />

        {/* body */}
        <path d="M6 24 h92 l28 24 v50 H6 Z" fill="url(#hs-van-body)" />
        {/* panel line */}
        <path d="M6 74 H126" stroke="#0d1427" strokeWidth="1.4" opacity="0.6" />
        {/* sun on the roofline and nose */}
        <path d="M6 24 h92 l28 24" fill="none" stroke="#ffc78e" strokeWidth="2.4" opacity="0.7" />
        <path d="M126 48 v50" fill="none" stroke="#ffb877" strokeWidth="1.8" opacity="0.4" />
        {/* windscreen */}
        <path d="M99 31 h15 l12 14 h-27 Z" fill="url(#hs-glass)" />

        {/* livery panel */}
        <rect x="15" y="37" width="74" height="44" rx="4" fill="#26386a" />
        <rect x="15" y="37" width="74" height="1.5" rx="0.75" fill="#ffffff" opacity="0.14" />
        <g transform="translate(24 49)">
          <path d="M0 4.5h4.4L9 10l-4.6 5.5H0L4.4 10Z" fill="#7ba5ff" />
          <path d="M8.6 1.5h5.4L19.8 10l-5.8 8.5H8.6L14.4 10Z" fill="#ffffff" />
          <text x="25" y="14" fill="#ffffff" fontSize="11.5" fontWeight="800" fontFamily="var(--font-sans)">
            DikkiConnect
          </text>
        </g>

        {/* wheels — hub caps roll */}
        <g>
          <circle cx="34" cy="98" r="14" fill="#0b1020" />
          <g className="anim-roll" style={{ ['--dur' as string]: '2.2s', transformOrigin: '34px 98px' }}>
            <circle cx="34" cy="98" r="5.5" fill="#5a6690" />
            <rect x="33" y="90" width="2" height="16" rx="1" fill="#2f3a5c" />
            <rect x="26" y="97" width="16" height="2" rx="1" fill="#2f3a5c" />
          </g>
          <circle cx="112" cy="98" r="14" fill="#0b1020" />
          <g className="anim-roll" style={{ ['--dur' as string]: '2.2s', transformOrigin: '112px 98px' }}>
            <circle cx="112" cy="98" r="5.5" fill="#5a6690" />
            <rect x="111" y="90" width="2" height="16" rx="1" fill="#2f3a5c" />
            <rect x="104" y="97" width="16" height="2" rx="1" fill="#2f3a5c" />
          </g>
        </g>

        {/* taillight + wet smear */}
        <rect x="6" y="54" width="6" height="13" rx="2" fill="#ff6b5a" />
        <rect x="6" y="54" width="6" height="13" rx="2" fill="#ff6b5a" filter="url(#hs-bloom)" />
        <ellipse cx="9" cy="114" rx="7" ry="16" fill="#ff6b5a" opacity="0.3" />
      </g>

      {/* ══ Bike courier, foreground ════════════════════════════════════════ */}
      <g transform="translate(6 496)">
        <ellipse cx="58" cy="88" rx="60" ry="7" fill="#06090f" opacity="0.55" />

        {/* headlight wash on the tarmac ahead */}
        <path d="M104 66 L168 44 L172 78 L106 76 Z" fill="url(#hs-beam)" opacity="0.5" />

        {/* delivery box */}
        <rect x="9" y="28" width="32" height="28" rx="5" fill="#243360" />
        <path d="M9 33 a5 5 0 0 1 5-5 h22" fill="none" stroke="#ffc78e" strokeWidth="1.8" opacity="0.6" />
        <g transform="translate(16 37)">
          <path d="M0 3h3.2L6.6 7 3.2 11H0L3.4 7Z" fill="#7ba5ff" />
          <path d="M6.2 1h4L14.4 7l-4.2 6h-4L10.4 7Z" fill="#ffffff" />
        </g>

        {/* rider */}
        <circle cx="64" cy="22" r="8.5" fill="#1b2444" />
        <path d="M56 32 h17 l6.5 23 h-29 Z" fill="#232f55" />
        <path d="M73 41 l15 9 -4 6 -17 -10 Z" fill="#232f55" />
        <path d="M57 18 a8.5 8.5 0 0 1 12 -2" fill="none" stroke="#ffc78e" strokeWidth="2.1" opacity="0.7" />
        <path d="M56 32 h17 l3 11" fill="none" stroke="#ffc78e" strokeWidth="1.8" opacity="0.5" />

        {/* frame + wheels */}
        <path d="M42 55 h42 l9 11 H48 Z" fill="#2e3b66" />
        <circle cx="32" cy="74" r="13" fill="#0b1020" />
        <g className="anim-roll" style={{ ['--dur' as string]: '1.1s', transformOrigin: '32px 74px' }}>
          <circle cx="32" cy="74" r="4.5" fill="#57648c" />
          <rect x="31.2" y="66" width="1.6" height="16" rx="0.8" fill="#2f3a5c" />
        </g>
        <circle cx="94" cy="74" r="13" fill="#0b1020" />
        <g className="anim-roll" style={{ ['--dur' as string]: '1.1s', transformOrigin: '94px 74px' }}>
          <circle cx="94" cy="74" r="4.5" fill="#57648c" />
          <rect x="93.2" y="66" width="1.6" height="16" rx="0.8" fill="#2f3a5c" />
        </g>
        <ellipse cx="22" cy="76" rx="8" ry="4.5" fill="#ff6b5a" opacity="0.55" />
        <ellipse cx="22" cy="76" rx="5" ry="3" fill="#ff8f7a" filter="url(#hs-bloom)" />
      </g>

      {/* ══ Courier + parcels at the hub ════════════════════════════════════ */}
      <g>
        <g transform="translate(300 468)">
          <ellipse cx="20" cy="62" rx="26" ry="4" fill="#06090f" opacity="0.5" />
          <circle cx="20" cy="11" r="10" fill="#1b2444" />
          <path d="M10 5 a10 10 0 0 1 20 0 z" fill="#243257" />
          <path d="M11 7 a10 10 0 0 1 9 -6" fill="none" stroke="#ffc78e" strokeWidth="1.8" opacity="0.6" />
          <path d="M9 24 h24 l5.5 36 H3.5 Z" fill="#212c50" />
          <path d="M9 24 h24" stroke="#ffc78e" strokeWidth="1.6" opacity="0.5" />
          <rect x="27" y="31" width="31" height="25" rx="3" fill="#cf8f4d" />
          <rect x="27" y="31" width="31" height="7" rx="3" fill="#a96d34" />
          <path d="M27 31 h31" stroke="#ffd9a6" strokeWidth="1.4" opacity="0.55" />
          <path d="M31 27 h6 v7 h-6 z" fill="#212c50" />
        </g>

        <g transform="translate(292 536)">
          <ellipse cx="42" cy="74" rx="48" ry="6" fill="#06090f" opacity="0.5" />
          <rect x="0" y="30" width="54" height="42" rx="3" fill="#cf8f4d" />
          <rect x="0" y="30" width="54" height="11" rx="3" fill="#ab7038" />
          <path d="M0 30 h54" stroke="#ffd9a6" strokeWidth="1.4" opacity="0.5" />
          <rect x="24" y="30" width="6" height="42" fill="#96602c" opacity="0.75" />
          <g transform="translate(10 50)" opacity="0.9">
            <path d="M0 3h3.2L6.6 7 3.2 11H0L3.4 7Z" fill="#7ba5ff" />
            <path d="M6.2 1h4L14.4 7l-4.2 6h-4L10.4 7Z" fill="#ffffff" />
          </g>
          <rect x="42" y="0" width="42" height="32" rx="3" fill="#dd9f5c" />
          <rect x="42" y="0" width="42" height="9" rx="3" fill="#b87b3f" />
          <path d="M42 0 h42" stroke="#ffe3b8" strokeWidth="1.4" opacity="0.55" />
        </g>
      </g>

      {/* ══ Grade ═══════════════════════════════════════════════════════════ */}
      <rect width="390" height="844" fill="url(#hs-vignette)" />
      <rect x="0" y="648" width="390" height="196" fill="#080c18" opacity="0.34" />
    </svg>
  )
}

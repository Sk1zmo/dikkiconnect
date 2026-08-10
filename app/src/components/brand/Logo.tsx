import { cn } from '@/lib/cn'

/**
 * The DikkiConnect mark — a forward double-chevron. The trailing arm is lighter
 * and set back, so the pair reads as motion rather than as a static arrow, and
 * echoes the route arrows used across tracking and trip cards.
 */
export function LogoMark({
  size = 36,
  tone = 'gradient',
  className,
}: {
  size?: number
  tone?: 'gradient' | 'white' | 'brand'
  className?: string
}) {
  const id = `dkc-mark-${tone}`
  const lead = tone === 'white' ? '#ffffff' : tone === 'brand' ? '#1650e0' : `url(#${id})`
  const trail = tone === 'white' ? '#ffffff' : tone === 'brand' ? '#1650e0' : '#7ba5ff'

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="20" y1="5" x2="45" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7ba5ff" />
          <stop offset="46%" stopColor="#1650e0" />
          <stop offset="100%" stopColor="#0c2f92" />
        </linearGradient>
      </defs>

      {/* Trailing arm — set back and lighter, so it reads as a motion trail */}
      <path
        d="M3 11.5h9.8L23 24 12.8 36.5H3L13.2 24Z"
        fill={trail}
        opacity={tone === 'gradient' ? 1 : 0.5}
      />

      {/* Leading arm */}
      <path d="M21.5 6h11.9L45.5 24 33.4 42H21.5L33.6 24Z" fill={lead} />
    </svg>
  )
}

export function Logo({
  size = 'md',
  tone = 'gradient',
  markTone,
  tagline,
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'gradient' | 'white' | 'brand'
  /** Paint the mark differently from the wordmark — e.g. a blue mark beside
   *  white type on a dark hero. Defaults to `tone`. */
  markTone?: 'gradient' | 'white' | 'brand'
  /** Small letterspaced line under the wordmark, e.g. "MOVE MORE. TOGETHER." */
  tagline?: string
  className?: string
}) {
  const dims = { sm: 22, md: 30, lg: 40, xl: 50 }[size]
  const text = { sm: 'text-[17px]', md: 'text-[23px]', lg: 'text-[31px]', xl: 'text-[38px]' }[size]
  const tag = { sm: 'text-[8px]', md: 'text-[9px]', lg: 'text-[10px]', xl: 'text-[11px]' }[size]

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className="inline-flex items-center gap-2.5">
        <LogoMark size={dims} tone={markTone ?? tone} />
        <span
          className={cn(
            'text-display font-extrabold',
            text,
            tone === 'white' ? 'text-white' : 'text-ink-900',
          )}
        >
          DikkiConnect
        </span>
      </span>
      {tagline && (
        <span
          className={cn(
            'mt-2 font-bold tracking-[0.32em] uppercase',
            tag,
            tone === 'white' ? 'text-brand-300' : 'text-brand-500',
          )}
          style={{ marginLeft: dims + 10 }}
        >
          {tagline}
        </span>
      )}
    </span>
  )
}

/** App-icon treatment — near-black squircle with the blue mark, like the icon. */
export function LogoTile({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center bg-action shadow-(--shadow-action)',
        className,
      )}
      style={{ width: size, height: size, borderRadius: size * 0.29 }}
    >
      <LogoMark size={size * 0.58} tone="gradient" />
    </span>
  )
}

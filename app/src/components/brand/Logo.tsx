import { useId } from 'react'
import { cn } from '@/lib/cn'
import { BRAND } from '@/lib/brand'

/* ════════════════════════════════════════════════════════════════════════════
   The WayPool mark — one road, dipping through two pools, rising out again.

   The mark it replaces was a switchback road that spelled an S. That S was
   Stowza's, and it survived the rename because a logo is the one asset a
   find-and-replace cannot touch: every string said WayPool while the drawing
   still said the old name to anyone who knew to look.

   This one is a W, which is the initial, drawn as a route rather than a
   letter — two rounded basins where the line gathers and a peak between them.
   That is the product in one stroke: ways pooling, then carrying on. It is a
   single continuous path, which is what lets it hold at 16px in a tab bar and
   at 432px on a launcher, and what lets the launch animation draw it in one
   movement rather than assemble it from parts.

   There is no accent dot any more. The old mark needed one to say "where to";
   this one ends on a rise, which says the same thing with less.

   The path is shared with `public/icon.svg`, the launcher icons and the
   native launch assets — regenerate those (scripts/brand-icons.mjs) if it
   ever changes here.
   ════════════════════════════════════════════════════════════════════════════ */

export const MARK_PATH =
  'M6 12 L12.6 29.5 a5 5 0 0 0 9.3 0 L24 20.5 L26.1 29.5 a5 5 0 0 0 9.3 0 L42 12'

/** The stroke weight the mark is drawn at, everywhere it appears. */
export const MARK_STROKE = 7.5

export function LogoMark({
  size = 36,
  tone = 'gradient',
  className,
}: {
  size?: number
  tone?: 'gradient' | 'white' | 'brand'
  className?: string
}) {
  /* One gradient per instance, not per tone: two marks of the same tone on a
     page would otherwise share an id and the second silently paints black. */
  const id = useId()
  const stroke = tone === 'white' ? '#ffffff' : tone === 'brand' ? '#1650e0' : `url(#${id})`

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      {tone === 'gradient' && (
        <defs>
          <linearGradient id={id} x1="6" y1="12" x2="42" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7ba5ff" />
            <stop offset="50%" stopColor="#1650e0" />
            <stop offset="100%" stopColor="#0c2f92" />
          </linearGradient>
        </defs>
      )}
      <path
        d={MARK_PATH}
        fill="none"
        stroke={stroke}
        strokeWidth={MARK_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
            'text-display font-extrabold tracking-[-0.045em]',
            text,
            tone === 'white' ? 'text-white' : 'text-ink-900',
          )}
        >
          {BRAND.name}
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

/** App-icon treatment — near-black squircle with the mark, like the launcher icon. */
export function LogoTile({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center bg-action shadow-(--shadow-action)',
        className,
      )}
      style={{ width: size, height: size, borderRadius: size * 0.29 }}
    >
      <LogoMark size={size * 0.6} tone="white" />
    </span>
  )
}

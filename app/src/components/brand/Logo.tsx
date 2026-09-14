import { useId } from 'react'
import { cn } from '@/lib/cn'
import { BRAND } from '@/lib/brand'

/* ═══════════════════════════════════════════════════════════════════════════
   The Stowza mark — a switchback road that spells an S, and the dot it is
   heading for.

   Three straight runs joined by two hairpins: a route drawn the way a map
   draws one, with the parcel's destination sitting just past the last bend.
   It is one stroke and one circle, which is what lets it hold up at 16px in a
   tab bar and at 432px on a launcher. The stroke is the heavy part; the dot
   is the accent, always the lighter blue, so it reads as "where to" and not
   as a full stop.

   The path is shared with `public/icon.svg`, the launcher icons and the
   native launch assets — regenerate those (scripts/brand-icons.mjs) if it
   ever changes here.
   ═══════════════════════════════════════════════════════════════════════════ */

export const MARK_PATH = 'M36 9.5H14.5a5.75 5.75 0 0 0 0 11.5h17a5.75 5.75 0 0 1 0 11.5H9'
export const MARK_DOT = { cx: 39.5, cy: 38.5, r: 4.25 }

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
  const dot = tone === 'white' ? '#96b8ff' : tone === 'brand' ? '#3a68f5' : '#3a68f5'

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
          <linearGradient id={id} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
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
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill={dot} />
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

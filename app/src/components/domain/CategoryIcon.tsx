import {
  Archive,
  Cube,
  FileText,
  Gift,
  Package,
  Pill,
  TShirt,
  DeviceMobile,
  ForkKnife,
  Wrench,
  type Icon as LucideIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { CategoryArt, CATEGORY_TINT, SizeArt } from './ParcelArt'

/* ═══════════════════════════════════════════════════════════════════════════
   Category and size pictograms.

   These were emoji. Emoji are the fastest way to make a product look like a
   prototype: they render differently on every platform, they carry a colour
   palette nobody chose, and at 11px they are unreadable noise. Worse, a
   parcel category rendered as a bento-box glyph stands in for
   "sealed, non-perishable food" — funny once, useless in a hub at 9pm.

   One stroked line icon, one weight, inheriting `currentColor`, so the whole
   set takes the colour of whatever chip it sits in and never fights it.
   ═══════════════════════════════════════════════════════════════════════════ */

const CATEGORY: Record<string, LucideIcon> = {
  documents: FileText,
  electronics: DeviceMobile,
  clothing: TShirt,
  food: ForkKnife,
  medicine: Pill,
  gifts: Gift,
  spares: Wrench,
  other: Package,
}

/** Size is one idea — how much volume — so it reads as one glyph growing. */
const SIZE: Record<string, LucideIcon> = {
  S: Cube,
  M: Package,
  L: Archive,
}

export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = CATEGORY[id] ?? Package
  return <Icon aria-hidden className={cn('size-[19px]', className)} />
}

export function SizeIcon({ id, className }: { id: string; className?: string }) {
  const Icon = SIZE[id] ?? Package
  return <Icon aria-hidden className={cn('size-[21px]', className)} />
}

/* ═══════════════════════════════════════════════════════════════════════════
   The mark.

   The drawn object (ParcelArt) on its own tinted square — what stands in for
   a parcel in a list row, a review line or a handover screen. The line icons
   above are still the right answer inside a dense chip, where the glyph is a
   label and has to take the chip's colour; this is the answer everywhere the
   parcel is the subject of the row rather than an attribute of it.

   The tint is the category's own, so a list of parcels is scannable by
   colour before a single word is read.
   ═══════════════════════════════════════════════════════════════════════════ */

export function CategoryMark({
  id,
  size = 44,
  className,
}: {
  id: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-(--radius-md) ring-1 ring-ink-900/5',
        CATEGORY_TINT[id] ?? 'bg-tile-other',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <CategoryArt id={id} size={Math.round(size * 0.82)} />
    </span>
  )
}

/** The same treatment for a parcel size — used where size is the subject. */
export function SizeMark({
  id,
  size = 44,
  className,
}: {
  id: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-(--radius-md) bg-brand-50 ring-1 ring-brand-900/5',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <SizeArt id={id} size={Math.round(size * 0.82)} />
    </span>
  )
}

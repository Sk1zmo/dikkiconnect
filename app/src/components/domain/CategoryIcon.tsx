import {
  Archive,
  Box,
  FileText,
  Gift,
  Package,
  Pill,
  Shirt,
  Smartphone,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

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
  electronics: Smartphone,
  clothing: Shirt,
  food: UtensilsCrossed,
  medicine: Pill,
  gifts: Gift,
  spares: Wrench,
  other: Package,
}

/** Size is one idea — how much volume — so it reads as one glyph growing. */
const SIZE: Record<string, LucideIcon> = {
  S: Box,
  M: Package,
  L: Archive,
}

export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = CATEGORY[id] ?? Package
  return <Icon aria-hidden strokeWidth={1.75} className={cn('size-[19px]', className)} />
}

export function SizeIcon({ id, className }: { id: string; className?: string }) {
  const Icon = SIZE[id] ?? Package
  return <Icon aria-hidden strokeWidth={1.75} className={cn('size-[21px]', className)} />
}

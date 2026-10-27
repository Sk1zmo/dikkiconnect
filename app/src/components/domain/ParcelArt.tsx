/* ═══════════════════════════════════════════════════════════════════════════
   Parcel artwork.

   Eleven drawn objects — one per parcel category, one per size — replacing
   the stroked line glyphs that stood in for them. A line icon is the right
   answer in a dense row where the glyph is a label; it is the wrong answer
   on a category tile, where the object IS the choice being made and a 19px
   outline gives the eye nothing to land on.

   Rules that make eleven separate drawings read as one set:

     · One viewBox, 0 0 48 48. Every object is drawn to the same grid.
     · Objects sit. The baseline is y=38 for all of them, so a row of tiles
       has a shared floor rather than eleven things floating at eleven
       heights.
     · Flat fill only. No gradients, no strokes except where the stroke is
       the object (a tiffin handle, a shirt collar). Gradients at this size
       turn to mud and cost a paint.
     · Three colours each, at most: a body, a shadow one step darker, and a
       highlight. Each set is pitched to its own tile tint, so the object
       and the wash behind it are the same hue family.
     · Corners are round. A 2.5px radius on a 28px box is the difference
       between a product illustration and a wireframe.

   These are inline SVG rather than files: eleven sprites is eleven requests
   or one build step, and at this size the markup is smaller than the
   `<img>` tags that would point at it. They also inherit nothing — the
   colours are deliberate and must not take `currentColor` the way the line
   icons do.
   ═══════════════════════════════════════════════════════════════════════════ */

import { cn } from '@/lib/cn'

type ArtProps = { size?: number; className?: string }

const box = (size: number, className?: string) => ({
  viewBox: '0 0 48 48',
  width: size,
  height: size,
  className,
  'aria-hidden': true,
  role: 'presentation' as const,
})

/* ── Documents — a stack, the top sheet's corner turned ───────────────────── */
function Documents({ size = 44, className }: ArtProps) {
  return (
    <svg {...box(size, className)}>
      <rect x="12" y="10" width="19" height="28" rx="2.5" fill="#bcd0f2" />
      <path
        d="M16 6h13l7 7v22.5A2.5 2.5 0 0 1 33.5 38H16a2.5 2.5 0 0 1-2.5-2.5V8.5A2.5 2.5 0 0 1 16 6Z"
        fill="#ffffff"
      />
      {/* The turned corner. Drawn as its own darker triangle rather than a
          fold line, so it reads at 24px as well as at 64px. */}
      <path d="M29 6l7 7h-7V6Z" fill="#8fb0e8" />
      <rect x="18" y="20" width="13" height="2.4" rx="1.2" fill="#9db8e8" />
      <rect x="18" y="26" width="13" height="2.4" rx="1.2" fill="#c3d4f2" />
      <rect x="18" y="32" width="8" height="2.4" rx="1.2" fill="#c3d4f2" />
    </svg>
  )
}

/* ── Electronics — a phone, face on ───────────────────────────────────────── */
function Electronics({ size = 44, className }: ArtProps) {
  return (
    <svg {...box(size, className)}>
      <rect x="15" y="7" width="18" height="31" rx="4" fill="#2a8fa8" />
      <rect x="17.4" y="11" width="13.2" height="21" rx="1.8" fill="#d5f0f7" />
      <rect x="21.4" y="8.6" width="5.2" height="1.3" rx="0.65" fill="#8fd3e4" />
      <circle cx="24" cy="35" r="1.5" fill="#8fd3e4" />
    </svg>
  )
}

/* ── Clothing — a t-shirt ─────────────────────────────────────────────────── */
function Clothing({ size = 44, className }: ArtProps) {
  return (
    <svg {...box(size, className)}>
      <path
        d="M18.6 8.5 9 14.2l4 6.6 3.6-2.1V38h14.8V18.7l3.6 2.1 4-6.6-9.6-5.7a5.8 5.8 0 0 1-10.8 0Z"
        fill="#ef8a3f"
      />
      {/* The collar. The one stroke in the set that earns itself: without it
          the shape reads as a bag. */}
      <path
        d="M18.9 8.8a5.9 5.9 0 0 0 10.2 0"
        fill="none"
        stroke="#c96a23"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ── Food — a tiffin, because that is what actually gets sent ─────────────── */
function Food({ size = 44, className }: ArtProps) {
  return (
    <svg {...box(size, className)}>
      <path
        d="M19 12a5 5 0 0 1 10 0"
        fill="none"
        stroke="#b8862b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="13" y="12.5" width="22" height="6.5" rx="2.2" fill="#f5b731" />
      <rect x="14.5" y="19.5" width="19" height="8.6" rx="1.8" fill="#e09a1e" />
      <rect x="14.5" y="28.6" width="19" height="9.4" rx="2.2" fill="#f5b731" />
    </svg>
  )
}

/* ── Medicine — a bottle, cross forward ───────────────────────────────────── */
function Medicine({ size = 44, className }: ArtProps) {
  return (
    <svg {...box(size, className)}>
      <rect x="18" y="8" width="12" height="6" rx="1.6" fill="#2c8552" />
      <rect x="14.5" y="14" width="19" height="24" rx="3" fill="#3fa86a" />
      <rect x="22.4" y="19.5" width="3.2" height="13" rx="1.4" fill="#ffffff" />
      <rect x="17.5" y="24.4" width="13" height="3.2" rx="1.4" fill="#ffffff" />
    </svg>
  )
}

/* ── Gifts — box, ribbon, bow ─────────────────────────────────────────────── */
function Gifts({ size = 44, className }: ArtProps) {
  return (
    <svg {...box(size, className)}>
      <ellipse cx="19.4" cy="11.6" rx="4.2" ry="3.4" fill="#ffc2d1" />
      <ellipse cx="28.6" cy="11.6" rx="4.2" ry="3.4" fill="#ffc2d1" />
      <rect x="11" y="20" width="26" height="18" rx="2.5" fill="#ef6a8a" />
      <rect x="9.5" y="14.5" width="29" height="6.5" rx="2.2" fill="#e2557a" />
      <rect x="21.8" y="14.5" width="4.4" height="23.5" fill="#ffd0dc" />
    </svg>
  )
}

/* ── Spares — a gear. Teeth placed by rotation, not by hand ───────────────── */
function Spares({ size = 44, className }: ArtProps) {
  return (
    <svg {...box(size, className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x="21.4"
          y="6.5"
          width="5.2"
          height="8"
          rx="1.6"
          fill="#8b95ad"
          transform={`rotate(${i * 45} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="12" fill="#6b7896" />
      <circle cx="24" cy="24" r="4.8" fill="#eceef4" />
    </svg>
  )
}

/* ── Other — the parcel itself, the brand's own object ────────────────────── */
function Other({ size = 44, className }: ArtProps) {
  return (
    <svg {...box(size, className)}>
      <rect x="9" y="17" width="30" height="21" rx="2.5" fill="#8b6cf0" />
      {/* The lid, as its own darker band with a seam down the middle. Without
          the seam this read as a book rather than a box. */}
      <rect x="9" y="17" width="30" height="7" rx="2.2" fill="#7250d8" />
      <rect x="22.8" y="17" width="2.4" height="21" fill="#ddd2fb" />
    </svg>
  )
}

/* ── Sizes — one box, three volumes ───────────────────────────────────────────
   These are deliberately the same drawing at three scales rather than three
   different objects. The question a size picker asks is "how much room does
   this need", and three unrelated glyphs make the reader translate; one box
   getting bigger answers it directly. The stacked count is the second
   signal, for anyone scanning rather than comparing. */

function SizeBox({
  size = 44,
  className,
  w,
  h,
  stacks,
}: ArtProps & { w: number; h: number; stacks: number }) {
  const x = 24 - w / 2
  const y = 38 - h
  return (
    <svg {...box(size, className)}>
      {/* Ghosted siblings behind, one per extra unit of volume. brand-300
          rather than brand-200: these sit on a brand-50 tile, and at 200 the
          ghosts were within a few percent of the background — the three
          sizes rendered as one blue square in three widths, which is exactly
          the comparison the picker exists to make. */}
      {Array.from({ length: stacks }).map((_, i) => (
        <rect
          key={i}
          x={x + (i + 1) * 3}
          y={y - (i + 1) * 3}
          width={w}
          height={h}
          rx="2.5"
          fill="#96b8ff"
        />
      ))}
      <rect x={x} y={y} width={w} height={h} rx="2.5" fill="#1650e0" />
      {/* Lid only. The first cut had a tape band down the middle as well, and
          at 38px the two together split the box into a 2x2 grid that read as
          four rectangles rather than one object. The ghosted stack behind is
          already carrying the volume, so the box itself can be plain. */}
      <rect x={x} y={y} width={w} height={Math.min(5.5, h * 0.28)} rx="2.2" fill="#103fc0" />
    </svg>
  )
}

/* ── The registry ─────────────────────────────────────────────────────────── */

const CATEGORY_ART: Record<string, (p: ArtProps) => React.ReactElement> = {
  documents: Documents,
  electronics: Electronics,
  clothing: Clothing,
  food: Food,
  medicine: Medicine,
  gifts: Gifts,
  spares: Spares,
  other: Other,
}

/* The three volumes. They have to differ enough to be told apart at 38px
   inside a list row — the first cut used 15/19/23 and all three read as the
   same small blob. The ratios below are roughly the real ones (3kg / 10kg /
   20kg by volume), which is also what makes them legible. */
const SIZE_ART: Record<string, (p: ArtProps) => React.ReactElement> = {
  S: (p) => <SizeBox {...p} w={21} h={17} stacks={0} />,
  M: (p) => <SizeBox {...p} w={27} h={22} stacks={1} />,
  L: (p) => <SizeBox {...p} w={33} h={27} stacks={2} />,
}

/** The wash behind each category's object. Keyed to match CATEGORY_ART. */
export const CATEGORY_TINT: Record<string, string> = {
  documents: 'bg-tile-documents',
  electronics: 'bg-tile-electronics',
  clothing: 'bg-tile-clothing',
  food: 'bg-tile-food',
  medicine: 'bg-tile-medicine',
  gifts: 'bg-tile-gifts',
  spares: 'bg-tile-spares',
  other: 'bg-tile-other',
}

export function CategoryArt({ id, size = 44, className }: ArtProps & { id: string }) {
  const Art = CATEGORY_ART[id] ?? Other
  return <Art size={size} className={className} />
}

export function SizeArt({ id, size = 44, className }: ArtProps & { id: string }) {
  const Art = SIZE_ART[id] ?? SIZE_ART.M
  return <Art size={size} className={className} />
}

/* ═══════════════════════════════════════════════════════════════════════════
   The tile.

   A tinted, rounded surface with the object sitting on it and a label
   underneath. This is the shape the category grid is built from, and it is
   the most recognisable single form in the reference: a soft square of
   colour that is obviously a thing you press.

   Selection is a ring, not a fill swap. Swapping the fill would throw away
   the per-category tint that makes the grid scannable in the first place —
   the whole point is that "food" is always the amber one, whether or not it
   is chosen.

   The ring is `ring-2 ring-brand-600` with no offset, which is the same
   selected state the role picker, the signup picker, the help-centre filter
   and the tip tiles all use. It briefly had a two-pixel offset, which read
   well on its own and meant this was the one control in the product whose
   selection looked different from every other.
   ═══════════════════════════════════════════════════════════════════════════ */

export function ArtTile({
  id,
  label,
  sub,
  kind = 'category',
  selected,
  onClick,
  className,
}: {
  id: string
  label: string
  sub?: string
  kind?: 'category' | 'size'
  selected?: boolean
  onClick?: () => void
  className?: string
}) {
  const Art = kind === 'size' ? SizeArt : CategoryArt
  const tint = kind === 'size' ? 'bg-brand-50' : (CATEGORY_TINT[id] ?? 'bg-tile-other')

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'springy focus-ring group flex w-full flex-col items-center gap-2 text-center',
        className,
      )}
    >
      <span
        className={cn(
          /* Shorter than it is wide. A square tile at four-across is ~85px tall,
             which pushed the size picker below the fold on a small phone for no
             gain — the object needs the width, not the height. */
          'relative grid h-[70px] w-full place-items-center rounded-(--radius-tile) transition-shadow duration-200',
          tint,
          selected
            ? 'ring-2 ring-brand-600'
            : 'ring-1 ring-ink-900/5',
        )}
      >
        <Art id={id} size={46} />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate text-[12.5px] leading-tight font-bold',
            selected ? 'text-brand-700' : 'text-ink-800',
          )}
        >
          {label}
        </span>
        {sub && <span className="mt-0.5 block truncate text-[11px] text-ink-600">{sub}</span>}
      </span>
    </button>
  )
}

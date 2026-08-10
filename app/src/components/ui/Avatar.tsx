import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { initials as toInitials } from '@/lib/format'

/** Deterministic gradient per person so avatars stay recognisable across screens. */
const TONES = [
  'from-brand-500 to-brand-700',
  'from-accent-500 to-brand-600',
  'from-success-500 to-brand-600',
  'from-warn-500 to-danger-500',
  'from-brand-400 to-accent-600',
  'from-ink-600 to-ink-900',
]

function toneFor(name: string, explicit?: number) {
  if (explicit != null) return TONES[explicit % TONES.length]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997
  return TONES[h % TONES.length]
}

export function Avatar({
  name,
  size = 40,
  tone,
  ring,
  onBrand,
  className,
}: {
  name: string
  size?: number
  tone?: number
  ring?: boolean
  onBrand?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white select-none',
        onBrand ? 'bg-white/20 bg-none' : toneFor(name, tone),
        ring && 'ring-2 ring-white',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-label={name}
    >
      {toInitials(name)}
    </span>
  )
}

/** Avatar + name + rating — the recurring "who is carrying this" block. */
export function PersonChip({
  name,
  meta,
  rating,
  trips,
  size = 40,
  tone,
  trailing,
  className,
}: {
  name: string
  meta?: string
  rating?: number
  trips?: number
  size?: number
  tone?: number
  trailing?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar name={name} size={size} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-bold text-ink-900">{name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
          {rating != null && (
            <span className="inline-flex items-center gap-1 font-semibold text-ink-700">
              <Star size={11} className="fill-warn-500 text-warn-500" />
              {rating.toFixed(1)}
            </span>
          )}
          {rating != null && (meta || trips != null) && <span className="text-ink-300">·</span>}
          {trips != null && <span>{trips} trips</span>}
          {meta && <span className="truncate">{meta}</span>}
        </div>
      </div>
      {trailing}
    </div>
  )
}

/** Star row for rating displays and inputs. */
export function Stars({
  value,
  size = 15,
  onChange,
  className,
}: {
  value: number
  size?: number
  onChange?: (v: number) => void
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center', onChange ? 'gap-2' : 'gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value)
        const star = (
          <Star
            size={size}
            className={cn(
              'transition-colors duration-150',
              filled ? 'fill-warn-500 text-warn-500' : 'fill-ink-200 text-ink-200',
            )}
          />
        )
        return onChange ? (
          <button
            key={i}
            type="button"
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
            onClick={() => onChange(i)}
            className="pressable-sm"
          >
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        )
      })}
    </span>
  )
}

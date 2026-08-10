import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The white sheet that rides over a hero image. Big top radius, soft lift, and
 * it owns the safe-area padding so screens don't each re-solve that.
 */
export function HeroSheet({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'pb-safe-5 relative z-10 shrink-0 rounded-t-[30px] bg-white px-5 pt-5 shadow-(--shadow-sheet)',
        className,
      )}
    >
      {children}
    </div>
  )
}

export interface Feature {
  icon: LucideIcon
  label: string
  detail: string
}

/**
 * Three-up trust strip: circular tonal badge, bold label, one line of detail,
 * hairline dividers between. Used on the launch screen and role landings.
 */
export function FeatureRow({
  items,
  className,
}: {
  items: Feature[]
  className?: string
}) {
  return (
    <ul
      className={cn(
        'grid',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ icon: Icon, label, detail }, i) => (
        <li
          key={label}
          className={cn(
            'flex flex-col items-center px-1.5 text-center',
            i > 0 && 'border-l border-ink-100',
          )}
        >
          <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Icon size={19} strokeWidth={2} />
          </span>
          <span className="mt-2.5 text-[12.5px] leading-tight font-bold text-ink-900">{label}</span>
          <span className="mt-1 text-[10.5px] leading-snug text-ink-500">{detail}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Display headline with a coloured full stop — the mockup's signature.
 * Pass lines; the accent lands on the last one.
 */
export function HeroHeadline({
  lines,
  className,
}: {
  lines: string[]
  className?: string
}) {
  return (
    <h1
      className={cn(
        'text-display text-[42px] leading-[1.04] font-extrabold text-white',
        className,
      )}
    >
      {lines.map((line, i) => (
        <span key={line} className="block">
          {line}
          <span className={i === lines.length - 1 ? 'text-brand-400' : undefined}>.</span>
        </span>
      ))}
    </h1>
  )
}

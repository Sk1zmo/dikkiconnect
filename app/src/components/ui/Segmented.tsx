import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Sliding-pill segmented control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: Array<{ value: T; label: string; badge?: number }>
  value: T
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  return (
    <div
      className={cn(
        'relative grid rounded-full bg-ink-100 p-1',
        size === 'sm' ? 'h-9' : 'h-11',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        className="absolute top-1 bottom-1 rounded-full bg-white shadow-(--shadow-e1) transition-transform duration-300 ease-(--ease-out-expo)"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          left: 4,
          transform: `translateX(calc(${index} * 100%))`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'relative z-1 flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors duration-200',
            size === 'sm' ? 'text-[12.5px]' : 'text-[13.5px]',
            o.value === value ? 'text-ink-900' : 'text-ink-500',
          )}
        >
          {o.label}
          {o.badge != null && o.badge > 0 && (
            <span
              className={cn(
                'grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10px] font-bold',
                o.value === value ? 'bg-brand-600 text-white' : 'bg-ink-300 text-white',
              )}
            >
              {o.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Horizontally scrolling filter chips. */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode; count?: number }>
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'pressable-sm inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors duration-200',
              active
                ? 'border-brand-600 bg-brand-600 text-white shadow-(--shadow-brand-sm)'
                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
            )}
          >
            {o.icon}
            {o.label}
            {o.count != null && (
              <span
                className={cn(
                  'tabular text-[11px] font-bold',
                  active ? 'text-white/75' : 'text-ink-400',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Underlined tab bar for content-heavy screens. */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar flex gap-6 overflow-x-auto border-b border-ink-200', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'relative shrink-0 pb-3 text-[14px] font-semibold transition-colors',
              active ? 'text-brand-700' : 'text-ink-500 hover:text-ink-700',
            )}
          >
            {o.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-brand-600" />
            )}
          </button>
        )
      })}
    </div>
  )
}

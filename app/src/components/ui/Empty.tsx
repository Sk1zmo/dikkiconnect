import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

/** Empty / error state. Illustration slot keeps these from feeling like errors. */
export function EmptyState({
  art,
  icon,
  title,
  body,
  actionLabel,
  onAction,
  actionTo,
  secondaryLabel,
  onSecondary,
  className,
  compact,
}: {
  art?: ReactNode
  icon?: ReactNode
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
  actionTo?: string
  secondaryLabel?: string
  onSecondary?: () => void
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-8 text-center',
        compact ? 'py-10' : 'py-16',
        className,
      )}
    >
      {art ?? (
        <div className="anim-pop mb-5 grid size-16 place-items-center rounded-(--radius-xl) bg-brand-50 text-brand-500">
          {icon}
        </div>
      )}
      <h3 className="text-display text-[17px] font-bold text-ink-900">{title}</h3>
      {body && <p className="mt-2 max-w-[280px] text-[13.5px] leading-[1.6] text-ink-500">{body}</p>}
      {(actionLabel || secondaryLabel) && (
        <div className="mt-6 flex w-full max-w-[260px] flex-col gap-2">
          {actionLabel && (
            <Button onClick={onAction} to={actionTo} block>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button variant="ghost" onClick={onSecondary} block>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

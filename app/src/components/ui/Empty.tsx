import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { EMPTY, ERROR, type EmptyKind, type ErrorKind } from '@/lib/copy'
import { StateArt, type StateArtKind } from '@/components/viz/StateArt'
import { Button } from './Button'

/* ═══════════════════════════════════════════════════════════════════════════
   Empty and error states.

   Every one answers the same three questions, in order: what happened, what
   to do next, and — through the picture and the line — why this is not a
   dead end. The copy lives in lib/copy so it reads in one voice; a screen
   names a `kind` and gets the right scene, title and body, and can override
   any of them when it knows better.
   ═══════════════════════════════════════════════════════════════════════════ */

const EMPTY_ART: Record<EmptyKind, StateArtKind> = {
  parcels: 'empty-boot',
  'parcels-done': 'empty-boot',
  rides: 'seat',
  'rides-done': 'seat',
  trips: 'seat',
  jobs: 'search',
  search: 'search',
  'search-results': 'search',
  notifications: 'bell',
  messages: 'chat',
  wallet: 'wallet',
  inventory: 'shelf',
  history: 'shelf',
  places: 'pin',
  articles: 'search',
  generic: 'empty-boot',
}

export function EmptyState({
  kind = 'generic',
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
  /** Picks the scene and the default copy. */
  kind?: EmptyKind
  art?: ReactNode
  icon?: ReactNode
  title?: string
  body?: string
  actionLabel?: string
  onAction?: () => void
  actionTo?: string
  secondaryLabel?: string
  onSecondary?: () => void
  className?: string
  compact?: boolean
}) {
  const copy = EMPTY[kind]
  const heading = title ?? copy.title
  const text = body ?? copy.body
  const primary = actionLabel ?? (onAction || actionTo ? copy.action : undefined)

  return (
    <div
      className={cn(
        'anim-fade-up flex flex-col items-center justify-center px-8 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      {art ??
        (icon ? (
          <div className="anim-pop mb-5 grid size-16 place-items-center rounded-(--radius-xl) bg-brand-50 text-brand-500">
            {icon}
          </div>
        ) : (
          <StateArt kind={EMPTY_ART[kind]} className={compact ? 'w-[160px]' : undefined} />
        ))}
      <h3 className="text-display text-[17px] font-bold text-ink-900">{heading}</h3>
      {text && <p className="mt-2 max-w-[290px] text-[13.5px] leading-[1.6] text-ink-500">{text}</p>}
      {(primary || secondaryLabel) && (
        <div className="mt-6 flex w-full max-w-[260px] flex-col gap-2">
          {primary && (
            <Button onClick={onAction} to={actionTo} block>
              {primary}
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

const ERROR_ART: Record<ErrorKind, StateArtKind> = {
  crash: 'broken',
  chunk: 'cones',
  network: 'signal',
  server: 'broken',
  timeout: 'signal',
  payment: 'wallet',
  action: 'broken',
  'permission-camera': 'camera',
  'permission-location': 'pin',
  maintenance: 'cones',
  notfound: 'road-end',
}

/**
 * Something failed. Plain title, a body that says whose fault it was and
 * whether anything was lost, and the way out as the button.
 */
export function ErrorState({
  kind,
  title,
  body,
  onAction,
  actionTo,
  actionLabel,
  onSecondary,
  secondaryTo,
  secondaryLabel,
  detail,
  className,
  compact,
}: {
  kind: ErrorKind
  title?: string
  body?: string
  onAction?: () => void
  actionTo?: string
  actionLabel?: string
  onSecondary?: () => void
  secondaryTo?: string
  secondaryLabel?: string
  /** The technical message, for whoever is debugging. Folded away. */
  detail?: string
  className?: string
  compact?: boolean
}) {
  const copy = ERROR[kind]
  return (
    <div
      role="alert"
      className={cn(
        'anim-fade-up flex flex-col items-center justify-center px-8 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      <StateArt kind={ERROR_ART[kind]} className={compact ? 'w-[160px]' : undefined} />
      <h3 className="text-display text-[18px] font-bold text-ink-900">{title ?? copy.title}</h3>
      <p className="mt-2 max-w-[300px] text-[13.5px] leading-[1.6] text-ink-500">{body ?? copy.body}</p>
      <div className="mt-6 flex w-full max-w-[260px] flex-col gap-2">
        {(onAction || actionTo) && (
          <Button onClick={onAction} to={actionTo} block>
            {actionLabel ?? copy.action}
          </Button>
        )}
        {(onSecondary || secondaryTo) && (
          <Button variant="ghost" onClick={onSecondary} to={secondaryTo} block>
            {secondaryLabel ?? copy.secondary}
          </Button>
        )}
      </div>
      {detail && (
        <details className="mt-6 max-w-[300px] text-left">
          <summary className="cursor-pointer text-[11.5px] font-bold tracking-wide text-ink-400 uppercase">
            Technical details
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-(--radius-sm) bg-ink-100 p-3 text-[11px] leading-snug whitespace-pre-wrap text-ink-600">
            {detail}
          </pre>
        </details>
      )}
    </div>
  )
}

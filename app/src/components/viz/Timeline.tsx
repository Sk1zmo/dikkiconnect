import { Camera, Check, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { dateTime } from '@/lib/format'
import type { TrackingEvent } from '@/lib/types'
import { Skeleton } from '@/components/ui'

/**
 * Custody chain view. Each completed node that involved a physical handoff
 * shows its OTP + photo evidence, which is the whole trust argument of the
 * product (PRD §6 and §9).
 */
export function Timeline({
  events,
  className,
}: {
  events: TrackingEvent[]
  className?: string
}) {
  const activeIndex = events.findIndex((e) => !e.done)
  const currentIndex = activeIndex === -1 ? events.length - 1 : activeIndex - 1

  return (
    <ol className={cn('relative', className)}>
      {events.map((e, i) => {
        const isCurrent = i === currentIndex
        const isNext = i === activeIndex
        const last = i === events.length - 1

        return (
          <li key={e.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {/* rail */}
            {!last && (
              <span
                className={cn(
                  'absolute top-7 left-[13px] w-[2px] rounded-full',
                  e.done ? 'bg-brand-500' : 'bg-ink-200',
                )}
                style={{ bottom: 0 }}
              />
            )}

            {/* node */}
            <span
              className={cn(
                'relative z-1 grid size-7 shrink-0 place-items-center rounded-full transition-colors',
                e.done
                  ? 'bg-brand-600 text-white shadow-(--shadow-brand-sm)'
                  : isNext
                    ? 'border-2 border-dashed border-brand-300 bg-white'
                    : 'border-2 border-ink-200 bg-white',
              )}
            >
              {e.done ? (
                <Check size={14} strokeWidth={3.4} />
              ) : (
                <span className={cn('size-2 rounded-full', isNext ? 'bg-brand-400' : 'bg-ink-300')} />
              )}
              {isCurrent && (
                <span className="anim-ping absolute inset-0 rounded-full bg-brand-500/40" />
              )}
            </span>

            {/* body */}
            <div className={cn('min-w-0 flex-1 pt-0.5', !e.done && 'opacity-55')}>
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    'text-[14px] font-bold',
                    isCurrent ? 'text-brand-700' : 'text-ink-900',
                  )}
                >
                  {e.title}
                </p>
                {e.at && (
                  <time className="shrink-0 text-[11px] font-medium text-ink-400">
                    {dateTime(e.at)}
                  </time>
                )}
              </div>
              <p className="mt-0.5 text-[12.5px] leading-[1.5] text-ink-500">{e.detail}</p>

              {(e.location || e.actor) && (
                <p className="mt-1 text-[11.5px] font-semibold text-ink-600">
                  {[e.actor, e.location].filter(Boolean).join(' · ')}
                </p>
              )}

              {(e.otpVerified || e.photos) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.otpVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[10.5px] font-bold text-success-700">
                      <ShieldCheck size={11} />
                      OTP verified
                    </span>
                  )}
                  {e.photos ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10.5px] font-bold text-ink-600">
                      <Camera size={11} />
                      {e.photos} photo{e.photos > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function TimelineSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="relative">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3.5 pb-5">
          <Skeleton w={28} h={28} radius={999} />
          <div className="flex-1 pt-1">
            <Skeleton h={12} w="52%" radius={6} className="mb-2" />
            <Skeleton h={9} w="82%" radius={5} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Condensed horizontal version for cards. */
export function MiniTimeline({
  events,
  className,
}: {
  events: TrackingEvent[]
  className?: string
}) {
  const doneCount = events.filter((e) => e.done).length
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {events.map((e, i) => (
        <div key={e.id} className="flex flex-1 items-center gap-1">
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              e.done ? 'bg-brand-600' : 'bg-ink-200',
              i === doneCount - 1 && 'ring-3 ring-brand-600/20',
            )}
          />
          {i < events.length - 1 && (
            <span className={cn('h-[2px] flex-1 rounded-full', e.done ? 'bg-brand-500' : 'bg-ink-200')} />
          )}
        </div>
      ))}
    </div>
  )
}

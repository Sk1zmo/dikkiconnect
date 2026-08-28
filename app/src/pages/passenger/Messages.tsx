import { useNavigate } from 'react-router-dom'
import { Headphones, MessageCircle } from 'lucide-react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import { Avatar, Card, EmptyState, SkeletonRow } from '@/components/ui'
import { RIDE_CHAT, SUPPORT_THREAD, TRIPS, travelerById } from '@/lib/data'
import { relative } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'
import { cn } from '@/lib/cn'

const THREADS = [
  {
    id: TRIPS[0].id,
    kind: 'driver' as const,
    travelerId: TRIPS[0].travelerId,
    last: RIDE_CHAT.at(-1)!,
    unread: 1,
  },
  {
    id: TRIPS[1].id,
    kind: 'driver' as const,
    travelerId: TRIPS[1].travelerId,
    last: { text: 'See you at the pickup point.', at: RIDE_CHAT[0].at },
    unread: 0,
  },
  {
    id: 'support',
    kind: 'support' as const,
    travelerId: null,
    last: SUPPORT_THREAD.at(-1)!,
    unread: 0,
  },
]

export default function Messages() {
  const navigate = useNavigate()
  const { loading } = useLoaded(THREADS, 850)

  return (
    <Screen>
      <LargeTitle title="Messages" subtitle="Drivers and DikkiConnect support" className="pt-safe" />

      <ScreenBody>
        {loading ? (
          <Card padded={false} className="px-4">
            {[0, 1, 2].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </Card>
        ) : THREADS.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={26} />}
            title="No conversations yet"
            body="Once you book a ride you can message the driver here."
            actionLabel="Find a ride"
            actionTo="/passenger"
          />
        ) : (
          <Card padded={false}>
            {THREADS.map((t, i) => {
              const driver = travelerById(t.travelerId ?? undefined)
              const name = t.kind === 'support' ? 'DikkiConnect Support' : (driver?.name ?? 'Driver')
              return (
                <button
                  key={t.id}
                  onClick={() => navigate(`/passenger/messages/${t.id}`)}
                  className={cn(
                    'pressable flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink-50',
                    i > 0 && 'border-t border-ink-100',
                  )}
                >
                  {t.kind === 'support' ? (
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                      <Headphones size={19} />
                    </span>
                  ) : (
                    <Avatar name={name} size={44} tone={driver?.avatarTone} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-[14.5px] font-bold text-ink-900">{name}</p>
                      <span className="ml-auto shrink-0 text-[11px] text-ink-400">
                        {relative(t.last.at)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'mt-0.5 truncate text-[12.5px]',
                        t.unread ? 'font-semibold text-ink-800' : 'text-ink-500',
                      )}
                    >
                      {t.last.text}
                    </p>
                  </div>
                  {t.unread > 0 && (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10.5px] font-bold text-white">
                      {t.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </Card>
        )}
      </ScreenBody>
    </Screen>
  )
}

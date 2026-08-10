import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellOff,
  CheckCheck,
  CreditCard,
  Package,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { Card, ChipRow, EmptyState, SkeletonRow, useToast } from '@/components/ui'
import { useApp } from '@/lib/store'
import { relative } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'
import type { NotificationItem } from '@/lib/types'
import { cn } from '@/lib/cn'

const KIND_META: Record<
  NotificationItem['kind'],
  { icon: typeof Package; tone: string }
> = {
  parcel: { icon: Package, tone: 'bg-brand-50 text-brand-600' },
  ride: { icon: Users, tone: 'bg-accent-50 text-accent-600' },
  payment: { icon: CreditCard, tone: 'bg-success-50 text-success-600' },
  kyc: { icon: ShieldCheck, tone: 'bg-warn-50 text-warn-600' },
  promo: { icon: Sparkles, tone: 'bg-accent-50 text-accent-600' },
  alert: { icon: TriangleAlert, tone: 'bg-danger-50 text-danger-600' },
}

type Filter = 'all' | 'parcel' | 'payment' | 'promo'

export default function Notifications() {
  const navigate = useNavigate()
  const toast = useToast()
  const { notifications, unread, markAllRead, markRead } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const { loading } = useLoaded(notifications, 750)

  const visible = useMemo(() => {
    if (filter === 'all') return notifications
    return notifications.filter((n) => n.kind === filter)
  }, [notifications, filter])

  return (
    <Screen>
      <TopBar
        back
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
        action={
          unread > 0 ? (
            <button
              onClick={() => {
                markAllRead()
                toast.success('Marked all as read')
              }}
              className="pressable-sm inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600"
            >
              <CheckCheck size={15} />
              Read all
            </button>
          ) : undefined
        }
      />

      <div className="shrink-0 px-5 pb-3">
        <ChipRow
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: notifications.length },
            { value: 'parcel', label: 'Parcels' },
            { value: 'payment', label: 'Payments' },
            { value: 'promo', label: 'Offers' },
          ]}
        />
      </div>

      <ScreenBody>
        {loading ? (
          <Card padded={false} className="px-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </Card>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<BellOff size={26} />}
            title="Nothing here"
            body={
              filter === 'all'
                ? "You're all caught up. We'll ping you when something moves."
                : 'No notifications in this category yet.'
            }
            actionLabel={filter !== 'all' ? 'Show all' : undefined}
            onAction={() => setFilter('all')}
          />
        ) : (
          <div className="stagger flex flex-col gap-2.5">
            {visible.map((n) => {
              const meta = KIND_META[n.kind]
              const Icon = meta.icon
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id)
                    if (n.href) navigate(n.href)
                  }}
                  className={cn(
                    'pressable relative flex w-full items-start gap-3.5 rounded-(--radius-lg) border p-4 text-left transition-colors',
                    n.read
                      ? 'border-ink-100 bg-white'
                      : 'border-brand-200 bg-brand-50/50 shadow-(--shadow-e1)',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-(--radius-sm)',
                      meta.tone,
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'truncate text-[14px]',
                          n.read ? 'font-semibold text-ink-800' : 'font-bold text-ink-900',
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-ink-400">
                        {relative(n.at)}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-[1.5] text-ink-500">
                      {n.body}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="absolute top-4 right-3 size-2 rounded-full bg-brand-600" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </ScreenBody>
    </Screen>
  )
}

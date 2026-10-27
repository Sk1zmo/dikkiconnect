import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Checks,
  CreditCard,
  Package,
  ShieldCheck,
  Sparkle,
  Warning,
  Users,
} from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { Badge, Card, ChipRow, EmptyState, SkeletonRow, useToast } from '@/components/ui'
import { useApp } from '@/lib/store'
import { relative } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'
import {
  BUCKET_LABEL,
  TIER_META,
  bucketOf,
  tierOf,
  type Bucket,
  type NotificationTier,
} from '@/lib/notifications'
import type { NotificationItem } from '@/lib/types'
import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   The inbox.

   Grouped by day, because "when" is the first thing you scan for; each item
   carries its tier as a small word so custody and money read as louder than
   an offer without shouting. Unread is a left rule and a dot, not a colour
   wash over the whole card. Filters are by tier, which is how people think
   about these ("only the ones that matter"), not by the internal kind.
   ═══════════════════════════════════════════════════════════════════════════ */

const KIND_META: Record<NotificationItem['kind'], { icon: typeof Package; tone: string }> = {
  parcel: { icon: Package, tone: 'bg-brand-50 text-brand-600' },
  ride: { icon: Users, tone: 'bg-accent-50 text-accent-600' },
  payment: { icon: CreditCard, tone: 'bg-success-50 text-success-600' },
  kyc: { icon: ShieldCheck, tone: 'bg-warn-50 text-warn-600' },
  promo: { icon: Sparkle, tone: 'bg-accent-50 text-accent-600' },
  alert: { icon: Warning, tone: 'bg-danger-50 text-danger-600' },
}

/* Tier → the Badge tone that already means the same thing, rather than the
   hand-rolled pill this used to draw. Same three colours, one less bespoke
   shape on a screen made of repeated rows.

   Not `signal`, tempting as a marketing row is: the rationed yellow is for a
   thing that expires or saves money, and a tier is a category. A discount
   notification is still, on this line, a label saying what kind of message it
   is — and if yellow starts meaning "offer" here it is no longer available
   when something is genuinely about to run out. */
const TIER_TONE: Record<NotificationTier, 'brand' | 'neutral' | 'accent'> = {
  critical: 'brand',
  contextual: 'neutral',
  marketing: 'accent',
}

type Filter = 'all' | NotificationTier

export default function Notifications() {
  const navigate = useNavigate()
  const toast = useToast()
  const { notifications, unread, markAllRead, markRead } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const { loading } = useLoaded(notifications, 600)

  const groups = useMemo(() => {
    const visible = filter === 'all' ? notifications : notifications.filter((n) => tierOf(n) === filter)
    const by: Record<Bucket, NotificationItem[]> = { today: [], yesterday: [], earlier: [] }
    for (const n of visible) by[bucketOf(n.at)].push(n)
    return (Object.keys(by) as Bucket[]).filter((b) => by[b].length > 0).map((b) => ({ bucket: b, items: by[b] }))
  }, [notifications, filter])

  const count = (t: NotificationTier) => notifications.filter((n) => tierOf(n) === t).length

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
                toast.success('All read', 'Nothing is waiting on you.')
              }}
              className="pressable-sm inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600"
            >
              <Checks size={15} />
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
            { value: 'critical', label: TIER_META.critical.label, count: count('critical') },
            { value: 'contextual', label: TIER_META.contextual.label, count: count('contextual') },
            { value: 'marketing', label: TIER_META.marketing.label, count: count('marketing') },
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
        ) : groups.length === 0 ? (
          <EmptyState
            kind="notifications"
            title={filter === 'all' ? undefined : `No ${TIER_META[filter].label.toLowerCase()} updates`}
            body={filter === 'all' ? undefined : TIER_META[filter].hint}
            actionLabel={filter !== 'all' ? 'Show everything' : undefined}
            onAction={() => setFilter('all')}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(({ bucket, items }) => (
              <section key={bucket}>
                <p className="mb-2 px-1 text-[11.5px] font-bold tracking-wide text-ink-400 uppercase">
                  {BUCKET_LABEL[bucket]}
                </p>
                <div className="stagger flex flex-col gap-2.5">
                  {items.map((n) => {
                    const meta = KIND_META[n.kind]
                    const tier = tierOf(n)
                    const Icon = meta.icon
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          markRead(n.id)
                          if (n.href) navigate(n.href)
                        }}
                        className={cn(
                          'pressable relative flex w-full items-start gap-3.5 rounded-(--radius-lg) border bg-white p-4 text-left transition-colors',
                          /* Unread was a dead shadow token (--shadow-e1 is
                             `none`), so it separated from read rows by nothing
                             at all except the left rule. It is a darker
                             hairline now — the same way every other surface in
                             the app separates. */
                          n.read ? 'border-ink-100' : 'border-ink-300',
                        )}
                      >
                        {!n.read && (
                          <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-brand-600" aria-hidden />
                        )}
                        <span className={cn('grid size-10 shrink-0 place-items-center rounded-(--radius-sm)', meta.tone)}>
                          <Icon size={18} weight={n.read ? 'regular' : 'fill'} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                'truncate text-[14px]',
                                n.read ? 'font-semibold text-ink-800' : 'font-bold text-ink-900',
                              )}
                            >
                              {n.title}
                            </span>
                            <span className="ml-auto shrink-0 text-[11px] text-ink-400">{relative(n.at)}</span>
                          </span>
                          <span className="mt-1 block text-[12.5px] leading-[1.5] text-ink-500">{n.body}</span>
                          <Badge
                            tone={TIER_TONE[tier]}
                            size="sm"
                            className="mt-2 tracking-wide uppercase"
                          >
                            {TIER_META[tier].label}
                          </Badge>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </ScreenBody>
    </Screen>
  )
}

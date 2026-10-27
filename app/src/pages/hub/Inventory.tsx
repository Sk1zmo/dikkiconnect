import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warning, Package } from '@phosphor-icons/react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  ChipRow,
  EmptyState,
  SearchField,
  SkeletonList,
} from '@/components/ui'
import { InventoryRow } from '@/components/domain/Cards'
import { cn } from '@/lib/cn'
import { isStale } from '@/lib/format'
import { useDebounced, useLoaded } from '@/lib/hooks'
import { useHubInventory } from '@/lib/store'
import type { HubInventoryItem } from '@/lib/types'

type Filter = 'all' | 'waiting' | 'assigned' | 'delayed'

/** Shelf slots are assigned deterministically from the parcel ID. */
function shelfFor(parcelId: string) {
  let h = 0
  for (let i = 0; i < parcelId.length; i++) h = (h * 31 + parcelId.charCodeAt(i)) % 9973
  return `${'ABCD'[h % 4]}-${String((h % 12) + 1).padStart(2, '0')}`
}

export default function HubInventory() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query, 200)

  // Live ledger, not a fixture: whatever senders booked and this hub took in.
  const held = useHubInventory()
  const { loading } = useLoaded(held, 700)

  const items: HubInventoryItem[] = useMemo(
    () =>
      held.map((p) => ({
        parcelId: p.id,
        shelf: shelfFor(p.id),
        intakeAt: p.timeline.find((e) => e.status === 'at_origin_hub')?.at ?? p.bookedAt,
        state: p.travelerId ? 'assigned' : isStale(p.bookedAt) ? 'delayed' : 'waiting',
        assignedTravelerId: p.travelerId,
      })),
    [held],
  )

  const counts = useMemo(
    () => ({
      all: items.length,
      waiting: items.filter((i) => i.state === 'waiting').length,
      assigned: items.filter((i) => i.state === 'assigned').length,
      delayed: items.filter((i) => i.state === 'delayed').length,
    }),
    [items],
  )

  const visible = useMemo(() => {
    let list = items
    if (filter !== 'all') list = list.filter((i) => i.state === filter)
    const q = debounced.trim().toLowerCase()
    if (q)
      list = list.filter(
        (i) => i.parcelId.toLowerCase().includes(q) || i.shelf.toLowerCase().includes(q),
      )
    return list
  }, [items, filter, debounced])

  const aging = items.filter((i) => isStale(i.intakeAt)).length

  return (
    <Screen>
      <LargeTitle
        title="Inventory"
        subtitle={`${counts.all} parcels on your shelves`}
        className="pt-safe"
      />

      <div className="shrink-0 px-5 pb-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search parcel ID or shelf"
          className="mb-3"
        />
        <ChipRow
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'waiting', label: 'Waiting', count: counts.waiting },
            { value: 'assigned', label: 'Assigned', count: counts.assigned },
            { value: 'delayed', label: 'Delayed', count: counts.delayed },
          ]}
        />
      </div>

      <ScreenBody>
        {/* ═══════════════════════════════════════════════════════════════════
            Three counts, one strip.

            These were three separate Stat tiles. Each tile spent most of its
            height on padding and its own border, which left the numbers — the
            only thing a worker at the counter actually reads here — at the same
            weight as the words underneath them. One bordered strip divided by
            hairlines gives the digits the whole cell: big, tabular, and set on
            a shared baseline so three counts compare at a glance instead of
            being read one at a time.

            Deliberately not tappable. Making a count set the filter below would
            be the obvious next move, but it invents an interaction the rest of
            the app does not have, and the chip row directly above already does
            that job.
            ═══════════════════════════════════════════════════════════════════ */}
        {!loading && (
          <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-(--radius-lg) border border-ink-200 bg-white">
            {[
              { label: 'Waiting', value: counts.waiting, tone: 'text-ink-900' },
              { label: 'Assigned', value: counts.assigned, tone: 'text-accent-600' },
              {
                label: 'Over 24h',
                value: aging,
                tone: aging ? 'text-warn-600' : 'text-success-600',
              },
            ].map((c, i) => (
              <div
                key={c.label}
                className={cn('px-3 py-4 text-center', i > 0 && 'border-l border-ink-100')}
              >
                <p
                  className={cn(
                    'tabular text-display text-[27px] leading-none font-extrabold tracking-title',
                    c.tone,
                  )}
                >
                  {c.value}
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-ink-500">{c.label}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && aging > 0 && filter === 'all' && (
          <Card className="mb-4 flex items-center gap-3 border-warn-100 bg-warn-50">
            <Warning size={18} className="shrink-0 text-warn-600" />
            <p className="text-[12.5px] font-semibold text-warn-800">
              <span className="tabular text-[14px] font-extrabold">{aging}</span> parcels have been
              here over 24 hours. Ops escalation triggers at 48.
            </p>
          </Card>
        )}

        {loading ? (
          <SkeletonList count={5} />
        ) : visible.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              kind={debounced ? 'search-results' : 'inventory'}
              title={debounced ? `No match for “${debounced}”` : 'Nothing on the shelves'}
              body={
                debounced
                  ? 'Try a parcel ID like WYP-4796 or a shelf like A-04.'
                  : 'Parcels appear here after you complete intake.'
              }
              actionLabel={debounced ? 'Clear search' : 'Start intake'}
              onAction={debounced ? () => setQuery('') : () => navigate('/hub/scan')}
            />
          </Card>
        ) : (
          <Card padded={false}>
            {visible.map((item, i) => (
              <div key={item.parcelId} className={i > 0 ? 'border-t border-ink-100' : ''}>
                <InventoryRow {...item} onClick={() => navigate(`/hub/intake/${item.parcelId}`)} />
              </div>
            ))}
          </Card>
        )}
      </ScreenBody>

      {/* Releasing to a traveler is the one committing action on this screen, and
          it used to sit under the last row — on a full shelf that is a long
          scroll away from a worker who already knows they want it. Pinned, it is
          always under the thumb, and it picks up the same sticky bar every other
          committing screen in the app uses rather than a second shape. */}
      {!loading && visible.length > 0 && (
        <ActionBar>
          <Button
            block
            size="lg"
            onClick={() => navigate('/hub/handoff')}
            icon={<Package size={18} />}
          >
            Release parcels to a traveler
          </Button>
        </ActionBar>
      )}
    </Screen>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Package, Search } from 'lucide-react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  Card,
  ChipRow,
  EmptyState,
  SearchField,
  SkeletonList,
  Stat,
} from '@/components/ui'
import { InventoryRow } from '@/components/domain/Cards'
import { EmptyBoxArt } from '@/components/viz/Illustrations'
import { HUB_INVENTORY } from '@/lib/data'
import { isStale } from '@/lib/format'
import { useDebounced, useLoaded } from '@/lib/hooks'

type Filter = 'all' | 'waiting' | 'assigned' | 'delayed' | 'lost'

export default function HubInventory() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query, 200)
  const { loading } = useLoaded(HUB_INVENTORY, 900)

  const counts = useMemo(
    () => ({
      all: HUB_INVENTORY.length,
      waiting: HUB_INVENTORY.filter((i) => i.state === 'waiting').length,
      assigned: HUB_INVENTORY.filter((i) => i.state === 'assigned').length,
      delayed: HUB_INVENTORY.filter((i) => i.state === 'delayed').length,
      lost: HUB_INVENTORY.filter((i) => i.state === 'lost').length,
    }),
    [],
  )

  const visible = useMemo(() => {
    let list = HUB_INVENTORY
    if (filter !== 'all') list = list.filter((i) => i.state === filter)
    const q = debounced.trim().toLowerCase()
    if (q)
      list = list.filter(
        (i) => i.parcelId.toLowerCase().includes(q) || i.shelf.toLowerCase().includes(q),
      )
    return [...list].sort((a, b) => new Date(a.intakeAt).getTime() - new Date(b.intakeAt).getTime())
  }, [filter, debounced])

  const aging = HUB_INVENTORY.filter((i) => isStale(i.intakeAt)).length

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
            { value: 'lost', label: 'Lost', count: counts.lost },
          ]}
        />
      </div>

      <ScreenBody>
        {!loading && (
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <Stat label="Waiting" value={counts.waiting} />
            <Stat label="Assigned" value={counts.assigned} tone="accent" />
            <Stat label="Over 24h" value={aging} tone={aging ? 'warn' : 'success'} />
          </div>
        )}

        {!loading && aging > 0 && filter === 'all' && (
          <Card className="mb-4 flex items-center gap-3 border-warn-100 bg-warn-50">
            <AlertTriangle size={18} className="shrink-0 text-warn-600" />
            <p className="text-[12.5px] font-semibold text-warn-800">
              {aging} parcels have been here over 24 hours. Ops escalation triggers at 48.
            </p>
          </Card>
        )}

        {loading ? (
          <SkeletonList count={5} />
        ) : visible.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              art={debounced ? undefined : <EmptyBoxArt />}
              icon={debounced ? <Search size={26} /> : undefined}
              title={debounced ? `No match for “${debounced}”` : 'Nothing on the shelves'}
              body={
                debounced
                  ? 'Try a parcel ID like DKC-4796 or a shelf like A-04.'
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

        {!loading && visible.length > 0 && (
          <button
            onClick={() => navigate('/hub/handoff')}
            className="pressable mt-4 flex w-full items-center justify-center gap-2 rounded-(--radius-md) bg-action py-3.5 text-[14px] font-bold text-white shadow-(--shadow-action) hover:bg-action-hover"
          >
            <Package size={16} />
            Release parcels to a traveler
          </button>
        )}
      </ScreenBody>
    </Screen>
  )
}

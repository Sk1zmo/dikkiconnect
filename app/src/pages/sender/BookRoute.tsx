import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  Clock,
  Home,
  MapPin,
  Repeat,
  Search,
  Zap,
} from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { ActionBar, Button, Card, Note, SearchField, Sheet, Stepper } from '@/components/ui'
import { CITIES, corridorKm } from '@/lib/data'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/cn'

export const BOOK_STEPS = ['Route', 'Parcel', 'Hubs', 'Review', 'Pay']

const RECENT_ROUTES = [
  { from: 'blr', to: 'mys' },
  { from: 'blr', to: 'che' },
  { from: 'mys', to: 'blr' },
]

/** Step 1 — origin and destination city. */
export default function BookRoute() {
  const navigate = useNavigate()
  const { draft, patchDraft } = useApp()
  const [picking, setPicking] = useState<'from' | 'to' | null>(null)
  const [query, setQuery] = useState('')

  const from = CITIES.find((c) => c.id === draft.fromCityId)!
  const to = CITIES.find((c) => c.id === draft.toCityId)!
  const km = corridorKm(from.id, to.id)
  const sameCity = from.id === to.id

  const filtered = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.state.toLowerCase().includes(query.toLowerCase()),
  )

  const swap = () =>
    patchDraft({ fromCityId: draft.toCityId, toCityId: draft.fromCityId, originHubId: null, destinationHubId: null })

  const pick = (cityId: string) => {
    if (picking === 'from') patchDraft({ fromCityId: cityId, originHubId: null })
    else patchDraft({ toCityId: cityId, destinationHubId: null })
    setPicking(null)
    setQuery('')
  }

  return (
    <Screen>
      <TopBar back backTo="/sender" title="Book a parcel" subtitle="Step 1 of 5" />

      <div className="shrink-0 px-5 pb-4">
        <Stepper steps={BOOK_STEPS} current={0} />
      </div>

      <ScreenBody>
        <h2 className="text-display text-[24px] leading-[1.18] font-extrabold text-ink-900">
          Where is it going?
        </h2>
        <p className="mt-2 text-[13.5px] text-ink-500">
          Pick how it should travel, then the two cities.
        </p>

        {/* ── Delivery mode ─────────────────────────────────────────────── */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {(
            [
              {
                id: 'hub' as const,
                icon: Building2,
                label: 'Hub to hub',
                blurb: 'Drop at a hub, receiver collects',
                meta: 'Cheapest · 4 OTP checkpoints',
              },
              {
                id: 'p2p' as const,
                icon: Home,
                label: 'Door to door',
                blurb: 'Traveler collects from your address',
                meta: 'Fastest · 2 OTP checkpoints',
              },
            ] as const
          ).map((m) => {
            const active = draft.mode === m.id
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => patchDraft({ mode: m.id })}
                className={cn(
                  'springy focus-ring rounded-(--radius-md) border-2 bg-white p-3.5 text-left',
                  active
                    ? 'border-brand-600 bg-brand-50/60 shadow-(--shadow-brand-sm)'
                    : 'border-ink-200 hover:border-ink-300',
                )}
              >
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-(--radius-sm)',
                    active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
                  )}
                >
                  <Icon size={17} />
                </span>
                <span className="mt-2.5 block text-[14px] font-bold text-ink-900">{m.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-500">
                  {m.blurb}
                </span>
                <span
                  className={cn(
                    'mt-1.5 block text-[10.5px] font-bold',
                    active ? 'text-brand-700' : 'text-ink-400',
                  )}
                >
                  {m.meta}
                </span>
              </button>
            )
          })}
        </div>

        {/* From / To */}
        <Card className="relative mt-6" padded={false}>
          <button
            onClick={() => setPicking('from')}
            className="pressable flex w-full items-center gap-3.5 p-4 text-left"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50">
              <span className="size-3 rounded-full bg-brand-600 ring-4 ring-brand-600/20" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                Pick up from
              </span>
              <span className="mt-0.5 block truncate text-[16px] font-bold text-ink-900">
                {from.name}
              </span>
              <span className="text-[12px] text-ink-500">
                {from.state} · {from.hubCount} hubs
              </span>
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-x-4 h-px bg-ink-100" />
            <span className="absolute top-1/2 left-[35px] h-9 w-px -translate-y-1/2 border-l-2 border-dashed border-ink-200" />
            <button
              onClick={swap}
              aria-label="Swap cities"
              className="pressable-sm absolute top-1/2 right-4 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-(--shadow-e1)"
            >
              <ArrowUpDown size={15} />
            </button>
          </div>

          <button
            onClick={() => setPicking('to')}
            className="pressable flex w-full items-center gap-3.5 p-4 text-left"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50">
              <MapPin size={17} className="text-brand-600" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                Deliver to
              </span>
              <span className="mt-0.5 block truncate text-[16px] font-bold text-ink-900">
                {to.name}
              </span>
              <span className="text-[12px] text-ink-500">
                {to.state} · {to.hubCount} hubs
              </span>
            </span>
          </button>
        </Card>

        {sameCity && (
          <Note tone="warn" className="mt-3">
            Origin and destination are the same city. DikkiConnect is built for intercity moves — pick a
            different destination.
          </Note>
        )}

        {!sameCity && (
          <Card className="mt-3 flex items-center gap-3 border-brand-100 bg-brand-50">
            <Zap size={17} className="shrink-0 text-brand-600" />
            <p className="text-[12.5px] font-semibold text-brand-800">
              {km} km corridor · typically{' '}
              {km < 200 ? 'same-day delivery' : 'next-day delivery'}
            </p>
          </Card>
        )}

        {/* Recent routes */}
        <div className="mt-7">
          <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            Recent routes
          </p>
          <div className="flex flex-col gap-2">
            {RECENT_ROUTES.map((r) => {
              const f = CITIES.find((c) => c.id === r.from)!
              const t = CITIES.find((c) => c.id === r.to)!
              return (
                <button
                  key={`${r.from}-${r.to}`}
                  onClick={() =>
                    patchDraft({
                      fromCityId: r.from,
                      toCityId: r.to,
                      originHubId: null,
                      destinationHubId: null,
                    })
                  }
                  className={cn(
                    'pressable flex items-center gap-3 rounded-(--radius-md) border bg-white px-4 py-3 text-left transition-colors',
                    draft.fromCityId === r.from && draft.toCityId === r.to
                      ? 'border-brand-500 bg-brand-50/60'
                      : 'border-ink-200 hover:border-ink-300',
                  )}
                >
                  <Repeat size={15} className="shrink-0 text-ink-400" />
                  <span className="flex-1 text-[13.5px] font-semibold text-ink-800">
                    {f.name} → {t.name}
                  </span>
                  <span className="tabular text-[12px] font-bold text-ink-400">
                    {corridorKm(r.from, r.to)} km
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <Note tone="neutral" icon={<Clock size={15} />} className="mt-6">
          {draft.mode === 'p2p'
            ? 'Door to door skips the hub entirely: a traveler already driving your route collects from your address and hands it over at the receiver’s. You pay for the convenience and the detour.'
            : 'Hub to hub is the cheapest way to move a parcel — you drop it at a counter near you and the receiver collects from one near them, with a custody checkpoint at every step.'}
        </Note>
      </ScreenBody>

      <ActionBar>
        <Button
          block
          size="lg"
          disabled={sameCity}
          onClick={() => navigate('/sender/book/parcel')}
          iconRight={<ArrowRight size={18} />}
        >
          Continue
        </Button>
      </ActionBar>

      {/* City picker */}
      <Sheet
        open={picking !== null}
        onClose={() => {
          setPicking(null)
          setQuery('')
        }}
        title={picking === 'from' ? 'Pick up city' : 'Delivery city'}
        subtitle="We currently operate across Karnataka and neighbouring states"
        fullHeight
      >
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search city or state"
          autoFocus
          className="mb-4"
        />
        <div className="flex flex-col">
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Search size={26} className="mx-auto mb-3 text-ink-300" />
              <p className="text-[14px] font-semibold text-ink-700">No city matches “{query}”</p>
              <p className="mt-1 text-[12.5px] text-ink-500">
                Tell us where you need DikkiConnect next from Settings.
              </p>
            </div>
          )}
          {filtered.map((c) => {
            const selected =
              picking === 'from' ? c.id === draft.fromCityId : c.id === draft.toCityId
            return (
              <button
                key={c.id}
                onClick={() => pick(c.id)}
                className={cn(
                  'pressable flex items-center gap-3.5 rounded-(--radius-md) px-3 py-3.5 text-left transition-colors',
                  selected ? 'bg-brand-50' : 'hover:bg-ink-50',
                )}
              >
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-(--radius-sm)',
                    selected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
                  )}
                >
                  <MapPin size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-bold text-ink-900">
                    {c.name}
                  </span>
                  <span className="text-[12px] text-ink-500">
                    {c.state} · {c.hubCount} hub{c.hubCount > 1 ? 's' : ''}
                  </span>
                </span>
                {selected && <span className="text-[12px] font-bold text-brand-600">Selected</span>}
              </button>
            )
          })}
        </div>
      </Sheet>
    </Screen>
  )
}

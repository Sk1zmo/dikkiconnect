import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowsDownUp,
  Buildings,
  Clock,
  Crosshair,
  House,
  MapPin,
  MapPinLine,
  Repeat,
  MagnifyingGlass,
  Lightning,
  Warning,
} from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { ActionBar, Button, Card, Note, SearchField, Sheet, Spinner, Stepper } from '@/components/ui'
import { CITIES, cityName, corridorKm } from '@/lib/data'
import {
  SERVICE_RADIUS_KM,
  currentPosition,
  geocode,
  nearestCity,
  reverseGeocode,
  type LngLat,
  type Place,
} from '@/lib/geo'
import { useDebounced } from '@/lib/hooks'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/cn'

export const BOOK_STEPS = ['Route', 'Parcel', 'Hubs', 'Review', 'Pay']
/** Same flow, but step 3 collects door addresses rather than hubs. */
export const BOOK_STEPS_P2P = ['Route', 'Parcel', 'Pickup', 'Review', 'Pay']
export const bookSteps = (mode: 'hub' | 'p2p') =>
  mode === 'p2p' ? BOOK_STEPS_P2P : BOOK_STEPS

/**
 * Every step after this one needs both ends of the route. With no default
 * route any more, a deep link or a refresh into step 3 would otherwise be
 * pricing a corridor between two empty strings — so it comes back here.
 */
export function RequireRoute({ children }: { children: ReactNode }) {
  const { draft } = useApp()
  if (!draft.fromCityId || !draft.toCityId) return <Navigate to="/sender/book" replace />
  return <>{children}</>
}

const POPULAR_ROUTES = [
  { from: 'blr', to: 'mys' },
  { from: 'blr', to: 'che' },
  { from: 'mys', to: 'blr' },
]

/**
 * Step 1 — where it leaves from and where it is going.
 *
 * Nothing is chosen for you. The old default of Bangalore → Mysore was
 * convenient for demos and wrong for everyone else: a preselected route is a
 * route somebody books by accident. Both ends start empty and the button
 * stays off until they are filled.
 *
 * Either end can be one of the cities on the network, the device's own
 * position, or any place typed into the search — a town, a street, a
 * landmark. A place that is not a network city is snapped to the nearest one
 * (that is what prices the corridor and picks the hubs) and kept as the exact
 * address, so the door-to-door step already knows the street and the hub
 * step already knows which hubs are near.
 */
export default function BookRoute() {
  const navigate = useNavigate()
  const { draft, patchDraft } = useApp()
  const [picking, setPicking] = useState<'from' | 'to' | null>(null)
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locateFailed, setLocateFailed] = useState(false)
  /* A place off the network: how far, and from which city we measured. */
  const [offNetwork, setOffNetwork] = useState<{ side: 'from' | 'to'; km: number; cityId: string } | null>(null)

  const from = CITIES.find((c) => c.id === draft.fromCityId)
  const to = CITIES.find((c) => c.id === draft.toCityId)
  const both = Boolean(from && to)
  const sameCity = both && from!.id === to!.id
  const km = both ? corridorKm(from!.id, to!.id) : 0

  const filtered = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.state.toLowerCase().includes(query.toLowerCase()),
  )

  /* Any place, not only our cities: after three characters the query also
     goes to the geocoder, debounced so a phone keyboard does not fire one
     request per key. Network cities always list first. */
  const debounced = useDebounced(query, 350)
  useEffect(() => {
    if (debounced.trim().length < 3) {
      setPlaces([])
      setSearching(false)
      return
    }
    let alive = true
    setSearching(true)
    geocode(debounced, 5).then((found) => {
      if (!alive) return
      setPlaces(found)
      setSearching(false)
    })
    return () => {
      alive = false
    }
  }, [debounced])

  const close = () => {
    setPicking(null)
    setQuery('')
    setPlaces([])
    setLocateFailed(false)
  }

  const swap = () =>
    patchDraft({
      fromCityId: draft.toCityId,
      toCityId: draft.fromCityId,
      pickupAddress: draft.dropAddress,
      dropAddress: draft.pickupAddress,
      pickupCoord: draft.dropCoord,
      dropCoord: draft.pickupCoord,
      originHubId: null,
      destinationHubId: null,
    })

  /** A city on the network, chosen by name. Clears any exact address for that end. */
  const pick = (cityId: string) => {
    if (picking === 'from') patchDraft({ fromCityId: cityId, originHubId: null, pickupAddress: '', pickupCoord: null })
    else patchDraft({ toCityId: cityId, destinationHubId: null, dropAddress: '', dropCoord: null })
    setOffNetwork((o) => (o?.side === picking ? null : o))
    close()
  }

  /** An exact point — typed or located — snapped to the nearest network city. */
  const pickPlace = (side: 'from' | 'to', at: LngLat, line: string) => {
    const near = nearestCity(at)
    if (side === 'from') {
      patchDraft({ fromCityId: near.cityId, originHubId: null, pickupAddress: line, pickupCoord: at })
    } else {
      patchDraft({ toCityId: near.cityId, destinationHubId: null, dropAddress: line, dropCoord: at })
    }
    setOffNetwork(near.serviced ? (o) => (o?.side === side ? null : o) : { side, km: Math.round(near.km), cityId: near.cityId })
    close()
  }

  const locate = async () => {
    if (!picking) return
    const side = picking
    setLocating(true)
    setLocateFailed(false)
    const at = await currentPosition()
    if (!at) {
      setLocating(false)
      setLocateFailed(true)
      return
    }
    const line = (await reverseGeocode(at)) ?? 'My current location'
    setLocating(false)
    pickPlace(side, at, line)
  }

  /** The address shown under a city when the end is an exact place. */
  const detail = (side: 'from' | 'to') => {
    const line = side === 'from' ? draft.pickupAddress : draft.dropAddress
    const city = side === 'from' ? from : to
    if (line) return line.split(',').slice(0, 2).join(',')
    return city ? `${city.state} · ${city.hubCount} hubs` : 'City, town or exact address'
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
                icon: Buildings,
                label: 'Hub to hub',
                blurb: 'Drop at a hub, receiver collects',
                meta: 'Cheapest · 4 OTP checkpoints',
              },
              {
                id: 'p2p' as const,
                icon: House,
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
              <span
                className={cn(
                  'mt-0.5 block truncate text-[16px] font-bold',
                  from ? 'text-ink-900' : 'text-ink-400',
                )}
              >
                {from ? from.name : 'Choose where it leaves from'}
              </span>
              <span className="block truncate text-[12px] text-ink-500">{detail('from')}</span>
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
              <ArrowsDownUp size={15} />
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
              <span
                className={cn(
                  'mt-0.5 block truncate text-[16px] font-bold',
                  to ? 'text-ink-900' : 'text-ink-400',
                )}
              >
                {to ? to.name : 'Choose where it is going'}
              </span>
              <span className="block truncate text-[12px] text-ink-500">{detail('to')}</span>
            </span>
          </button>
        </Card>

        {sameCity && (
          <Note tone="warn" className="mt-3">
            Origin and destination are the same city. WayPool is built for intercity moves — pick a
            different destination.
          </Note>
        )}

        {offNetwork && (
          <Note tone="neutral" icon={<Warning size={15} />} className="mt-3">
            That spot is about {offNetwork.km} km from {cityName(offNetwork.cityId)}, the nearest city on
            the network — we serve up to {SERVICE_RADIUS_KM} km out. The corridor is priced from{' '}
            {cityName(offNetwork.cityId)}; a traveler on that route may still collect from your
            address.
          </Note>
        )}

        {both && !sameCity && (
          <Card className="mt-3 flex items-center gap-3 border-brand-100 bg-brand-50">
            <Lightning size={17} className="shrink-0 text-brand-600" />
            {/* The corridor length is the fact being reported and the delivery
                promise hangs off it, so the distance leads and the promise
                reads as its label rather than as the other half of a sentence. */}
            <p className="flex items-baseline gap-1.5">
              <span className="tabular text-[20px] leading-none font-extrabold tracking-title text-brand-800">
                {km}
              </span>
              <span className="text-[11.5px] font-semibold text-brand-800/85">
                km corridor · typically {km < 200 ? 'same-day delivery' : 'next-day delivery'}
              </span>
            </p>
          </Card>
        )}

        {/* The corridors most parcels travel — a shortcut, never a default. */}
        <div className="mt-7">
          <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            Popular corridors
          </p>
          <div className="flex flex-col gap-2">
            {POPULAR_ROUTES.map((r) => {
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
                      pickupAddress: '',
                      dropAddress: '',
                      pickupCoord: null,
                      dropCoord: null,
                    })
                  }
                  className={cn(
                    /* Two pixels of border in both states, so picking a corridor
                       changes the colour and never the layout — and so these read
                       as the same class of object as the mode cards above. */
                    'pressable flex min-h-12 items-center gap-3 rounded-(--radius-md) border-2 bg-white px-4 py-3 text-left transition-colors',
                    draft.fromCityId === r.from && draft.toCityId === r.to
                      ? 'border-brand-600 bg-brand-50/60'
                      : 'border-ink-200 hover:border-ink-300',
                  )}
                >
                  <Repeat size={15} className="shrink-0 text-ink-400" />
                  <span className="flex-1 text-[13.5px] font-semibold text-ink-800">
                    {f.name} → {t.name}
                  </span>
                  <span className="flex shrink-0 items-baseline gap-1">
                    <span className="tabular text-[15px] font-extrabold tracking-title text-ink-800">
                      {corridorKm(r.from, r.to)}
                    </span>
                    <span className="text-[11px] font-semibold text-ink-400">km</span>
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
          disabled={!both || sameCity}
          onClick={() => navigate('/sender/book/parcel')}
          iconRight={<ArrowRight size={18} />}
        >
          Continue
        </Button>
      </ActionBar>

      {/* City picker — a network city, the device's position, or any place. */}
      <Sheet
        open={picking !== null}
        onClose={close}
        title={picking === 'from' ? 'Where does it leave from?' : 'Where is it going?'}
        subtitle="A city on the network, your location, or any address"
        fullHeight
      >
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="City, town, street or landmark"
          autoFocus
          className="mb-3"
        />

        <button
          onClick={locate}
          disabled={locating}
          className="pressable mb-2 flex w-full items-center gap-3.5 rounded-(--radius-md) px-3 py-3.5 text-left hover:bg-ink-50 disabled:opacity-70"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-600 text-white">
            {locating ? <Spinner size={16} tone="light" /> : <Crosshair size={17} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-bold text-ink-900">
              {locating ? 'Finding you…' : 'Use my current location'}
            </span>
            <span className="text-[12px] text-ink-500">
              {locateFailed
                ? 'We couldn’t get a fix — allow location, or type the address instead'
                : 'Snapped to the nearest city on the network'}
            </span>
          </span>
        </button>

        <div className="flex flex-col">
          {filtered.length > 0 && (
            <p className="mt-2 mb-1 px-3 text-[11px] font-bold tracking-wide text-ink-400 uppercase">
              Cities we serve
            </p>
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

          {/* Anywhere else — the geocoder's answers, snapped on pick. */}
          {(places.length > 0 || searching) && (
            <p className="mt-4 mb-1 px-3 text-[11px] font-bold tracking-wide text-ink-400 uppercase">
              Places
            </p>
          )}
          {searching && places.length === 0 && (
            <div className="flex items-center gap-3 px-3 py-3.5 text-[13px] text-ink-500">
              <Spinner size={16} /> Looking up “{debounced}”…
            </div>
          )}
          {places.map((pl) => {
            const near = nearestCity({ lng: pl.lng, lat: pl.lat })
            return (
              <button
                key={`${pl.lat},${pl.lng}`}
                onClick={() => picking && pickPlace(picking, { lng: pl.lng, lat: pl.lat }, pl.label)}
                className="pressable flex items-center gap-3.5 rounded-(--radius-md) px-3 py-3.5 text-left transition-colors hover:bg-ink-50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-ink-500">
                  <MapPinLine size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-bold text-ink-900">{pl.name}</span>
                  <span className="block truncate text-[12px] text-ink-500">
                    {near.serviced
                      ? `Near ${cityName(near.cityId)} · ${pl.label.split(',').slice(1, 3).join(',').trim()}`
                      : `${Math.round(near.km)} km from ${cityName(near.cityId)}, our nearest city`}
                  </span>
                </span>
              </button>
            )
          })}

          {filtered.length === 0 && places.length === 0 && !searching && (
            <div className="py-12 text-center">
              <MagnifyingGlass size={26} className="mx-auto mb-3 text-ink-300" />
              <p className="text-[14px] font-semibold text-ink-700">Nothing called “{query}” yet</p>
              <p className="mt-1 text-[12.5px] text-ink-500">
                {query.trim().length < 3
                  ? 'Keep typing — we search every town and street after three letters.'
                  : 'Try the nearest town, a landmark, or a pin code.'}
              </p>
            </div>
          )}
        </div>
      </Sheet>
    </Screen>
  )
}

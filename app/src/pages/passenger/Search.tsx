import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, Calendar, MapPin, Search as SearchIcon, Sparkles, Users } from 'lucide-react'
import { Screen, ScreenBody, BrandHeader } from '@/components/layout/Screen'
import { PortalSwitcher } from '@/components/layout/PortalSwitcher'
import {
  Avatar,
  Button,
  Card,
  Counter,
  Note,
  SectionHeader,
  Select,
  SkeletonList,
} from '@/components/ui'
import { TripCard } from '@/components/domain/Cards'
import { CITIES, TRAVELERS, TRIPS, corridorKm } from '@/lib/data'
import { inr } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'
import { useApp } from '@/lib/store'

const POPULAR = [
  { from: 'blr', to: 'mys', price: 399, badge: 'Most booked' },
  { from: 'blr', to: 'che', price: 899, badge: 'Weekend' },
  { from: 'mys', to: 'blr', price: 419, badge: null },
]

export default function PassengerSearch() {
  const navigate = useNavigate()
  const { user } = useApp()

  const [from, setFrom] = useState('blr')
  const [to, setTo] = useState('mys')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [seats, setSeats] = useState(1)
  const [searching, setSearching] = useState(false)

  const suggested = TRIPS.slice(0, 2)
  const { loading } = useLoaded(suggested, 1200)

  const cityOptions = CITIES.map((c) => ({ value: c.id, label: `${c.name}, ${c.state}` }))
  const sameCity = from === to

  const search = () => {
    setSearching(true)
    setTimeout(
      () => navigate(`/passenger/results?from=${from}&to=${to}&date=${date}&seats=${seats}`),
      800,
    )
  }

  return (
    <Screen>
      <BrandHeader className="pt-safe">
        <div className="mb-4">
          <PortalSwitcher />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white/65">Where to today?</p>
            <p className="text-display truncate text-[21px] font-extrabold">
              Find a ride, {user.name.split(' ')[0]}
            </p>
          </div>
          <Avatar name={user.name} size={40} onBrand />
        </div>
      </BrandHeader>

      <ScreenBody className="-mt-5 pt-0">
        {/* Search card */}
        <Card elevation={3}>
          <div className="relative">
            <Select label="From" value={from} onChange={setFrom} options={cityOptions} />
            <button
              onClick={() => {
                setFrom(to)
                setTo(from)
              }}
              aria-label="Swap cities"
              className="pressable-sm absolute top-[62px] right-11 z-1 grid size-9 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-(--shadow-e2)"
            >
              <ArrowUpDown size={15} />
            </button>
            <div className="mt-4">
              <Select label="To" value={to} onChange={setTo} options={cityOptions} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[12.5px] font-semibold text-ink-700">Date</p>
              <div className="flex h-[50px] items-center gap-2.5 rounded-(--radius-md) border border-ink-200 bg-white px-3.5">
                <Calendar size={15} className="shrink-0 text-ink-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-ink-900"
                />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[12.5px] font-semibold text-ink-700">Seats</p>
              <Counter value={seats} onChange={setSeats} min={1} max={4} />
            </div>
          </div>

          {sameCity && (
            <Note tone="warn" className="mt-3">
              Pick two different cities to search.
            </Note>
          )}

          <Button
            block
            size="lg"
            className="mt-4"
            loading={searching}
            disabled={sameCity}
            onClick={search}
            icon={!searching ? <SearchIcon size={18} /> : undefined}
          >
            {searching ? 'Finding rides…' : 'Search rides'}
          </Button>
        </Card>

        {/* Cost-sharing disclosure — required framing per PRD §10 */}
        <Note tone="brand" icon={<Users size={15} />} className="mt-4" title="Cost-sharing, not a taxi">
          DikkiConnect rides are private cars sharing fuel and toll costs between people already making the
          trip. Drivers are not commercial operators and fares are capped at cost.
        </Note>

        {/* Popular routes */}
        <div className="mt-7">
          <SectionHeader title="Popular routes" subtitle="Live corridors right now" />
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {POPULAR.map((r) => {
              const f = CITIES.find((c) => c.id === r.from)!
              const t = CITIES.find((c) => c.id === r.to)!
              return (
                <button
                  key={`${r.from}-${r.to}`}
                  onClick={() => {
                    setFrom(r.from)
                    setTo(r.to)
                  }}
                  className="pressable w-[210px] shrink-0 rounded-(--radius-lg) border border-ink-100 bg-white p-4 text-left shadow-(--shadow-e1)"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-9 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
                      <MapPin size={17} />
                    </span>
                    {r.badge && (
                      <span className="rounded-full bg-warn-50 px-2 py-0.5 text-[10px] font-bold text-warn-700">
                        {r.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 truncate text-[14.5px] font-bold text-ink-900">
                    {f.name} → {t.name}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ink-500">
                    {corridorKm(r.from, r.to)} km · ~{Math.round(corridorKm(r.from, r.to) / 45)}h
                  </p>
                  <p className="tabular mt-2.5 text-[15px] font-extrabold text-brand-700">
                    from {inr(r.price)}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Suggested rides */}
        <div className="mt-7">
          <SectionHeader
            title="Leaving soon"
            subtitle="Verified drivers on your usual corridor"
            action="See all"
            onAction={search}
          />
          {loading ? (
            <SkeletonList count={2} />
          ) : (
            <div className="stagger flex flex-col gap-3">
              {suggested.map((t) => (
                <TripCard key={t.id} trip={t} to={`/passenger/ride/${t.id}`} />
              ))}
            </div>
          )}
        </div>

        {/* Trust */}
        <Card className="mt-5">
          <div className="flex items-center gap-2.5">
            <Sparkles size={17} className="shrink-0 text-brand-600" />
            <p className="text-[13.5px] font-bold text-ink-900">Every driver is verified</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2.5">
              {TRAVELERS.slice(0, 4).map((t) => (
                <Avatar key={t.id} name={t.name} size={30} tone={t.avatarTone} ring />
              ))}
            </div>
            <p className="text-[12px] text-ink-500">
              Aadhaar, licence and RC checked against government registries before their first ride.
            </p>
          </div>
        </Card>
      </ScreenBody>
    </Screen>
  )
}

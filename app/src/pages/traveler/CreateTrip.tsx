import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpDown, Calendar, Car, Check, Package, Users } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  Counter,
  Field,
  KeyValue,
  Note,
  Select,
  Stepper,
  Switch,
  useToast,
} from '@/components/ui'
import { RouteMap } from '@/components/viz/Map'
import { CITIES, TRAVELERS, corridorKm } from '@/lib/data'
import { inr } from '@/lib/format'

const STEPS = ['Route', 'Capacity', 'Publish']
const ME = TRAVELERS[0]

export default function CreateTrip() {
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState(0)
  const [from, setFrom] = useState('blr')
  const [to, setTo] = useState('mys')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [depart, setDepart] = useState('14:30')
  const [seats, setSeats] = useState(3)
  const [bootSlots, setBootSlots] = useState(2)
  const [maxSize, setMaxSize] = useState<'S' | 'M' | 'L'>('M')
  const [carryParcels, setCarryParcels] = useState(true)
  const [carryPassengers, setCarryPassengers] = useState(true)
  const [fare, setFare] = useState(449)
  const [publishing, setPublishing] = useState(false)

  const km = corridorKm(from, to)
  const fuelShare = Math.round((km * 7.2) / Math.max(1, seats + 1))
  const sameCity = from === to

  const publish = () => {
    setPublishing(true)
    setTimeout(() => {
      toast.success('Trip published', 'Matching parcels and passengers on your route now.')
      navigate('/traveler/trips', { replace: true })
    }, 1300)
  }

  const cityOptions = CITIES.map((c) => ({ value: c.id, label: `${c.name}, ${c.state}` }))

  return (
    <Screen>
      <TopBar
        back={step === 0}
        backTo="/traveler"
        title="Publish a trip"
        subtitle={`Step ${step + 1} of 3`}
        action={
          step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="pressable-sm text-[13px] font-bold text-ink-500"
            >
              Back
            </button>
          ) : undefined
        }
      />

      <div className="shrink-0 px-5 pb-4">
        <Stepper steps={STEPS} current={step} />
      </div>

      <ScreenBody>
        {/* ── Step 1: route ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="anim-fade-up">
            <Card padded={false} className="mb-4 overflow-hidden">
              <RouteMap
                height={140}
                fromLabel={CITIES.find((c) => c.id === from)?.name}
                toLabel={CITIES.find((c) => c.id === to)?.name}
              />
            </Card>

            <div className="relative">
              <Select label="Starting from" value={from} onChange={setFrom} options={cityOptions} />
              <button
                onClick={() => {
                  setFrom(to)
                  setTo(from)
                }}
                aria-label="Swap cities"
                className="pressable-sm absolute top-[62px] right-12 z-1 grid size-9 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-(--shadow-e2)"
              >
                <ArrowUpDown size={15} />
              </button>
              <div className="mt-4">
                <Select label="Heading to" value={to} onChange={setTo} options={cityOptions} />
              </div>
            </div>

            {sameCity && (
              <Note tone="warn" className="mt-4">
                Pick two different cities — DikkiConnect only matches intercity trips.
              </Note>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                prefix={<Calendar size={15} />}
              />
              <Field
                label="Departure"
                type="time"
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
              />
            </div>

            <Card className="mt-2 flex items-center gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
                <Car size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink-900">{ME.vehicle.model}</p>
                <p className="mt-0.5 truncate text-[12px] text-ink-500">
                  {ME.vehicle.plate} · {ME.vehicle.colour} · boot {ME.vehicle.bootCapacityKg} kg
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-bold text-success-700">
                RC verified
              </span>
            </Card>

            <Note tone="brand" className="mt-3">
              {km} km · roughly {Math.round(km / 45)}h {Math.round(((km / 45) % 1) * 60)}m of driving.
              We&apos;ll surface parcels waiting at hubs along this corridor.
            </Note>
          </div>
        )}

        {/* ── Step 2: capacity ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="anim-fade-up">
            <Card className="mb-4">
              <Switch
                checked={carryParcels}
                onChange={setCarryParcels}
                label="Carry parcels"
                description="Earn from the boot space that's travelling empty anyway"
              />
              <div className="my-4 h-px bg-ink-100" />
              <Switch
                checked={carryPassengers}
                onChange={setCarryPassengers}
                label="Offer seats"
                description="Cost-sharing only — fuel and tolls split between riders"
              />
            </Card>

            {carryParcels && (
              <div className="anim-fade-up mb-5">
                <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
                  Boot space
                </p>
                <p className="mb-2 text-[12.5px] font-semibold text-ink-700">
                  How many parcel slots?
                </p>
                <Counter value={bootSlots} onChange={setBootSlots} min={0} max={6} suffix="slots" />

                <p className="mt-4 mb-2.5 text-[12.5px] font-semibold text-ink-700">
                  Largest size you can take
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['S', 'M', 'L'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setMaxSize(s)}
                      className={`pressable rounded-(--radius-md) border-2 py-3 text-center transition-all ${
                        maxSize === s
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-ink-200 bg-white text-ink-600'
                      }`}
                    >
                      <span className="block text-[18px] font-extrabold">{s}</span>
                      <span className="mt-0.5 block text-[10.5px] font-semibold">
                        {s === 'S' ? '≤3 kg' : s === 'M' ? '≤10 kg' : '≤25 kg'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {carryPassengers && (
              <div className="anim-fade-up">
                <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
                  Passenger seats
                </p>
                <p className="mb-2 text-[12.5px] font-semibold text-ink-700">Seats available</p>
                <Counter value={seats} onChange={setSeats} min={0} max={ME.vehicle.seats} suffix="seats" />

                <p className="mt-4 mb-2 text-[12.5px] font-semibold text-ink-700">
                  Cost share per seat
                </p>
                <Counter value={fare} onChange={setFare} min={0} max={2000} step={25} suffix="₹" />

                <Note tone="warn" className="mt-3" title="Keep it cost-sharing">
                  Karnataka treats profit-making pooling as unlicensed transport. Our suggested share
                  for this route is <span className="font-bold">{inr(fuelShare)}</span> — fuel and
                  tolls split evenly. Pricing above that is your call and your liability.
                </Note>
              </div>
            )}

            {!carryParcels && !carryPassengers && (
              <Note tone="danger" className="mt-4">
                Turn on at least one — otherwise there is nothing to publish.
              </Note>
            )}
          </div>
        )}

        {/* ── Step 3: review ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="anim-fade-up">
            <Card padded={false} className="mb-4 overflow-hidden">
              <RouteMap
                height={150}
                fromLabel={CITIES.find((c) => c.id === from)?.name}
                toLabel={CITIES.find((c) => c.id === to)?.name}
              />
            </Card>

            <Card>
              <p className="mb-2 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
                Trip summary
              </p>
              <KeyValue
                label="Route"
                value={`${CITIES.find((c) => c.id === from)?.name} → ${CITIES.find((c) => c.id === to)?.name}`}
              />
              <KeyValue label="Distance" value={`${km} km`} />
              <KeyValue label="Departs" value={`${date} · ${depart}`} />
              <KeyValue label="Vehicle" value={`${ME.vehicle.model} · ${ME.vehicle.plate}`} />
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue
                label="Parcel slots"
                value={carryParcels ? `${bootSlots} · up to ${maxSize}` : 'Not offered'}
                tone={carryParcels ? 'default' : 'muted'}
              />
              <KeyValue
                label="Passenger seats"
                value={carryPassengers ? `${seats} @ ${inr(fare)}` : 'Not offered'}
                tone={carryPassengers ? 'default' : 'muted'}
              />
            </Card>

            <Card className="mt-3 border-success-100 bg-success-50">
              <p className="text-[12px] font-semibold text-success-700">Estimated earnings</p>
              <p className="tabular text-display mt-1 text-[30px] leading-none font-extrabold text-success-700">
                {inr(
                  (carryPassengers ? seats * fare : 0) + (carryParcels ? bootSlots * 110 : 0),
                )}
              </p>
              <div className="mt-3 space-y-1 border-t border-success-500/20 pt-3">
                {carryPassengers && (
                  <p className="flex items-center gap-2 text-[12px] font-semibold text-success-700">
                    <Users size={12} /> {seats} seats × {inr(fare)}
                  </p>
                )}
                {carryParcels && (
                  <p className="flex items-center gap-2 text-[12px] font-semibold text-success-700">
                    <Package size={12} /> {bootSlots} parcels × ~{inr(110)} average
                  </p>
                )}
              </div>
            </Card>

            <Note tone="neutral" className="mt-3">
              Once published, travelers can book seats immediately and we start matching parcels at
              hubs on your corridor. You can edit or cancel until departure.
            </Note>
          </div>
        )}
      </ScreenBody>

      <ActionBar>
        {step < 2 ? (
          <Button
            block
            size="lg"
            disabled={(step === 0 && sameCity) || (step === 1 && !carryParcels && !carryPassengers)}
            onClick={() => setStep((s) => s + 1)}
            iconRight={<ArrowRight size={18} />}
          >
            Continue
          </Button>
        ) : (
          <Button block size="lg" loading={publishing} onClick={publish} icon={<Check size={18} />}>
            {publishing ? 'Publishing…' : 'Publish trip'}
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}

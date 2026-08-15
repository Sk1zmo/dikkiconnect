import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CreditCard, Lock, Phone, Smartphone, Users, Wallet as WalletIcon } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Button,
  Card,
  Counter,
  Divider,
  Field,
  KeyValue,
  Note,
  RadioCard,
  Switch,
  useToast,
} from '@/components/ui'
import { cityName, travelerById } from '@/lib/data'
import { dayDate, inr, time } from '@/lib/format'
import { useApp, useTrip } from '@/lib/store'
import { useFakeProgress } from '@/lib/hooks'

export default function RideCheckout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { balance, bookSeats, spend } = useApp()

  const [seats, setSeats] = useState(1)
  const [method, setMethod] = useState<'upi' | 'wallet' | 'card'>('upi')
  const [shareTrip, setShareTrip] = useState(true)
  const [emergency, setEmergency] = useState('9845098450')
  const [paying, setPaying] = useState(false)
  const progress = useFakeProgress(2000, paying)

  const trip = useTrip(id)
  if (!trip) return <Navigate to="/passenger" replace />

  const driver = travelerById(trip.travelerId)!
  const subtotal = trip.farePerSeat * seats
  const platformFee = Math.round(subtotal * 0.06)
  const total = subtotal + platformFee
  const walletShort = balance < total

  const pay = () => {
    setPaying(true)
    setTimeout(() => {
      // Decrements the driver's seat count on the shared ledger, so the ride
      // shows as filling up in their portal and to every other passenger.
      bookSeats(trip.id, seats, subtotal)
      if (method === 'wallet') spend(total)
      toast.success('Seat confirmed', `${seats} seat${seats > 1 ? 's' : ''} on ${trip.id}`)
      navigate(`/passenger/boarding/${trip.id}`, { replace: true })
    }, 2200)
  }

  if (paying) {
    return (
      <Screen tone="white">
        <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
          <div className="relative mb-8 grid size-20 place-items-center">
            <span className="anim-ping absolute inset-0 rounded-full bg-brand-500/20" />
            <span className="brand-gradient relative grid size-16 place-items-center rounded-(--radius-xl) shadow-(--shadow-brand)">
              <Users size={28} className="text-white" />
            </span>
          </div>
          <h2 className="text-display text-[21px] font-extrabold text-ink-900">
            Confirming your seat
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
            Holding {seats} seat{seats > 1 ? 's' : ''} with {driver.name.split(' ')[0]}…
          </p>
          <div className="mt-8 h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-ink-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar back title="Confirm & pay" subtitle={`${cityName(trip.fromCityId)} → ${cityName(trip.toCityId)}`} />

      <ScreenBody>
        {/* Trip summary */}
        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={driver.name} size={44} tone={driver.avatarTone} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-bold text-ink-900">{driver.name}</p>
              <p className="mt-0.5 truncate text-[12px] text-ink-500">
                {driver.vehicle.model} · {driver.vehicle.plate}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular text-[15px] font-extrabold text-ink-900">
                {time(trip.departAt)}
              </p>
              <p className="text-[11px] text-ink-400">{dayDate(trip.departAt)}</p>
            </div>
          </div>
        </Card>

        {/* Seats */}
        <Card className="mt-3">
          <p className="mb-2.5 text-[12.5px] font-semibold text-ink-700">How many seats?</p>
          <Counter value={seats} onChange={setSeats} min={1} max={trip.seatsLeft} suffix="seats" />
          <p className="mt-2 text-[11.5px] text-ink-400">
            {trip.seatsLeft} available on this trip
          </p>
        </Card>

        {/* Safety */}
        <Card className="mt-3">
          <Switch
            checked={shareTrip}
            onChange={setShareTrip}
            label="Share live trip"
            description="Your emergency contact sees your route and ETA for the whole ride"
          />
          {shareTrip && (
            <div className="anim-fade-up mt-4">
              <Field
                label="Emergency contact"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={emergency}
                onChange={(e) => setEmergency(e.target.value.replace(/[^\d ]/g, ''))}
                prefix={<Phone size={15} />}
              />
            </div>
          )}
        </Card>

        {/* Payment */}
        <p className="mt-6 mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Pay using
        </p>
        <div className="flex flex-col gap-2.5">
          <RadioCard
            selected={method === 'upi'}
            onSelect={() => setMethod('upi')}
            icon={<Smartphone size={18} />}
            title="UPI"
            subtitle="Google Pay, PhonePe, Paytm"
          />
          <RadioCard
            selected={method === 'wallet'}
            onSelect={() => !walletShort && setMethod('wallet')}
            icon={<WalletIcon size={18} />}
            title="DikkiConnect Wallet"
            subtitle={walletShort ? `Balance ${inr(balance)} — not enough` : `Balance ${inr(balance)}`}
            className={walletShort ? 'opacity-55' : undefined}
          />
          <RadioCard
            selected={method === 'card'}
            onSelect={() => setMethod('card')}
            icon={<CreditCard size={18} />}
            title="Card"
            subtitle="HDFC •••• 4412 · Visa"
          />
        </div>

        {/* Breakdown */}
        <Card className="mt-4">
          <KeyValue label={`Cost share × ${seats}`} value={inr(subtotal)} />
          <KeyValue label="Platform fee" value={inr(platformFee)} />
          <Divider className="my-2" />
          <KeyValue label="Total" value={inr(total)} strong />
        </Card>

        <Note tone="brand" icon={<Users size={15} />} className="mt-3" title="This is cost-sharing">
          You are contributing to fuel and tolls on a trip the driver is already making. DikkiConnect is
          not a taxi service and drivers are not commercial operators.
        </Note>

        <Note tone="neutral" icon={<Lock size={15} />} className="mt-3">
          The driver&apos;s phone number and the exact pickup point are revealed immediately after
          payment. Free cancellation up to 2 hours before departure.
        </Note>
      </ScreenBody>

      <ActionBar
        helper={
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-semibold text-ink-500">
              {seats} seat{seats > 1 ? 's' : ''} · {time(trip.departAt)}
            </span>
            <span className="tabular text-display text-[22px] font-extrabold text-ink-900">
              {inr(total)}
            </span>
          </div>
        }
      >
        <Button block size="lg" onClick={pay} icon={<Lock size={17} />}>
          Pay & confirm seat
        </Button>
      </ActionBar>
    </Screen>
  )
}

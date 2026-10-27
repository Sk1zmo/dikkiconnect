import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Car, MapPin, ChatCircle, Phone, ShieldCheck } from '@phosphor-icons/react'
import { Screen, ScreenBody } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  KeyValue,
  Note,
  OtpDisplay,
} from '@/components/ui'
import { Confetti } from '@/components/viz/Illustrations'
import { LottieMark } from '@/components/brand/LottieMark'
import { cityName } from '@/lib/data'
import { useRideForTrip } from '@/lib/store'
import { useTrip } from '@/lib/store'
import { rides } from '@/lib/api'
import { dayDate, inr, phone as fmtPhone, time } from '@/lib/format'

/** Booking confirmed + the single boarding OTP (PRD §6 — one OTP, no drop-off OTP). */
export default function BoardingOtp() {
  const { id } = useParams()
  const navigate = useNavigate()

  const trip = useTrip(id)
  const ride = useRideForTrip(id)
  // The server issues this — never derived on-device, which is the entire
  // point: a code the phone showing it could also compute is not a check.
  const [otp, setOtp] = useState<string | null>(null)

  useEffect(() => {
    if (!ride) return
    let cancelled = false
    rides
      .otp(ride.id)
      .then(({ code }) => {
        if (!cancelled) setOtp(code)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ride])

  if (trip === null) return <Navigate to="/passenger" replace />
  if (!trip) return null

  return (
    <Screen>
      <Confetti pieces={18} />

      <ScreenBody className="pt-safe">
        <div className="flex flex-col items-center pt-8 pb-6 text-center">
          <LottieMark name="otp-verified" size={104} />
          <h1 className="text-display mt-5 text-[25px] font-extrabold text-ink-900">
            Seat confirmed
          </h1>
          <p className="mt-2 text-[14px] text-ink-500">
            {dayDate(trip.departAt)} · departing{' '}
            <span className="tabular font-extrabold tracking-title text-ink-800">
              {time(trip.departAt)}
            </span>
          </p>
        </div>

        {/* Boarding OTP */}
        <Card className="border-brand-100 bg-brand-50/60">
          <OtpDisplay code={otp ?? '······'} label="Show this when you board" />
          <Note tone="brand" className="mt-4">
            {trip.travelerName.split(' ')[0]} enters this in the app at pickup. It is the only OTP
            for your ride — nothing to do at drop-off.
          </Note>
        </Card>

        {/* Driver contact — revealed only now */}
        <Card className="mt-3">
          <div className="flex items-center gap-3.5">
            <Avatar name={trip.travelerName} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink-900">{trip.travelerName}</p>
              <p className="tabular mt-0.5 truncate text-[12.5px] font-semibold text-ink-600">
                {fmtPhone(trip.travelerPhone)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <IconButton
                icon={<ChatCircle size={17} />}
                label="Message driver"
                onClick={() => navigate(`/passenger/messages/${trip.id}`)}
              />
              <IconButton icon={<Phone size={17} />} label="Call driver" tone="solid" />
            </div>
          </div>

          {trip.vehicle && (
            <div className="mt-4 flex items-center gap-3 rounded-(--radius-md) bg-ink-50 p-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-white text-ink-700 shadow-(--shadow-e1)">
                <Car size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-ink-900">{trip.vehicle.model}</p>
                <p className="tabular mt-0.5 truncate text-[11.5px] text-ink-500">
                  {trip.vehicle.colour} · {trip.vehicle.plate}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Pickup */}
        <Card className="mt-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
              <MapPin size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                Pickup point
              </p>
              <p className="mt-0.5 truncate text-[14px] font-bold text-ink-900">
                Central Silk Board Junction
              </p>
              <p className="mt-0.5 text-[12px] text-ink-500">
                Outer Ring Road, opposite the bus bay · {cityName(trip.fromCityId)}
              </p>
              {/* This one stays warn, not signal. Nothing here is running out —
                  it is an instruction about when to stand there, and the yellow
                  has to keep meaning "this will be gone" to be worth anything. */}
              <Badge tone="warn" size="sm" className="mt-2">
                Be there 10 minutes early
              </Badge>
            </div>
          </div>
        </Card>

        {/* Receipt */}
        <Card className="mt-3">
          <p className="mb-2 text-[12px] font-bold tracking-wide text-ink-400 uppercase">Booking</p>
          <KeyValue label="Booking ID" value={trip.id} />
          <KeyValue label="Route" value={`${cityName(trip.fromCityId)} → ${cityName(trip.toCityId)}`} />
          <KeyValue label="Seats" value="1" />
          <div className="my-2 h-px bg-ink-100" />
          <KeyValue label="Paid" value={inr(Math.round(trip.farePerSeat * 1.06))} strong />
        </Card>

        <Note tone="success" icon={<ShieldCheck size={15} />} className="mt-3">
          Live trip sharing is active. Your emergency contact will get a link when the ride starts.
        </Note>
      </ScreenBody>

      <ActionBar>
        <Button block size="lg" to={`/passenger/tracking/${trip.id}`}>
          Track this ride
        </Button>
        <button
          onClick={() => navigate('/passenger/bookings')}
          className="pressable-sm mt-3 w-full text-center text-[13.5px] font-semibold text-ink-500"
        >
          View all my rides
        </button>
      </ActionBar>
    </Screen>
  )
}

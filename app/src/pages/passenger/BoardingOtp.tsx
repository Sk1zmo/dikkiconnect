import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Car, Check, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { Screen, ScreenBody } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Button,
  Card,
  IconButton,
  KeyValue,
  Note,
  OtpDisplay,
} from '@/components/ui'
import { Confetti } from '@/components/viz/Illustrations'
import { cityName, otpFor, travelerById } from '@/lib/data'
import { useTrip } from '@/lib/store'
import { dayDate, inr, phone as fmtPhone, time } from '@/lib/format'

/** Booking confirmed + the single boarding OTP (PRD §6 — one OTP, no drop-off OTP). */
export default function BoardingOtp() {
  const { id } = useParams()
  const navigate = useNavigate()

  const trip = useTrip(id)
  if (!trip) return <Navigate to="/passenger" replace />

  const driver = travelerById(trip.travelerId)!
  const otp = otpFor(trip.id + 'board')

  return (
    <Screen>
      <Confetti pieces={18} />

      <ScreenBody className="pt-safe">
        <div className="flex flex-col items-center pt-8 pb-6 text-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            className="grid size-16 place-items-center rounded-full bg-success-500 shadow-lg shadow-success-500/35"
          >
            <Check size={32} strokeWidth={3.2} className="text-white" />
          </motion.span>
          <h1 className="text-display mt-5 text-[25px] font-extrabold text-ink-900">
            Seat confirmed
          </h1>
          <p className="mt-2 text-[14px] text-ink-500">
            {dayDate(trip.departAt)} · departing {time(trip.departAt)}
          </p>
        </div>

        {/* Boarding OTP */}
        <Card className="border-brand-100 bg-brand-50/60">
          <OtpDisplay code={otp} label="Show this when you board" />
          <Note tone="brand" className="mt-4">
            {driver.name.split(' ')[0]} enters this in the app at pickup. It is the only OTP for
            your ride — nothing to do at drop-off.
          </Note>
        </Card>

        {/* Driver contact — revealed only now */}
        <Card className="mt-3">
          <div className="flex items-center gap-3.5">
            <Avatar name={driver.name} size={48} tone={driver.avatarTone} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink-900">{driver.name}</p>
              <p className="tabular mt-0.5 truncate text-[12.5px] font-semibold text-ink-600">
                {fmtPhone(driver.phone)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <IconButton
                icon={<MessageCircle size={17} />}
                label="Message driver"
                onClick={() => navigate(`/passenger/messages/${trip.id}`)}
              />
              <IconButton icon={<Phone size={17} />} label="Call driver" tone="solid" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-(--radius-md) bg-ink-50 p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-white text-ink-700 shadow-(--shadow-e1)">
              <Car size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold text-ink-900">{driver.vehicle.model}</p>
              <p className="tabular mt-0.5 truncate text-[11.5px] text-ink-500">
                {driver.vehicle.colour} · {driver.vehicle.plate}
              </p>
            </div>
          </div>
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
              <p className="mt-2 inline-block rounded-full bg-warn-50 px-2.5 py-1 text-[11.5px] font-bold text-warn-700">
                Be there 10 minutes early
              </p>
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

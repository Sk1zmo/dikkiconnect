import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Ban, ChevronUp, MessageCircle, Phone, Share2, ShieldAlert } from 'lucide-react'
import { Screen } from '@/components/layout/Screen'
import {
  Avatar,
  Button,
  ConfirmDialog,
  IconButton,
  LiveDot,
  ProgressBar,
  Sheet,
  Stars,
  useToast,
} from '@/components/ui'
import { LiveMap } from '@/components/viz/Map'
import { TRIPS, cityName, otpFor, travelerById } from '@/lib/data'
import { inr, time } from '@/lib/format'
import { useCountdown } from '@/lib/hooks'

const STAGES = ['Driver on the way', 'Boarding', 'On the highway', 'Arriving']

export default function RideTracking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const { label } = useCountdown(2 * 3600 + 48 * 60)

  const trip = TRIPS.find((t) => t.id === id)
  if (!trip) return <Navigate to="/passenger" replace />

  const driver = travelerById(trip.travelerId)!
  const stage = 2
  const progress = ((stage + 1) / STAGES.length) * 100

  return (
    <Screen tone="dark">
      <div className="relative flex-1 overflow-hidden">
        <LiveMap portrait height="100%" className="absolute inset-0" />

        {/* Top bar */}
        <div className="pt-safe-3 absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4">
          <IconButton
            icon={<ChevronUp size={19} className="rotate-[-90deg]" />}
            label="Back"
            tone="glass"
            onClick={() => navigate('/passenger/bookings')}
          />
          <span className="glass rounded-full px-3.5 py-1.5 shadow-(--shadow-e2)">
            <LiveDot label={`Arriving in ${label}`} />
          </span>
          <IconButton
            icon={<Share2 size={17} />}
            label="Share live trip"
            tone="glass"
            onClick={() => toast.success('Trip shared', 'Live link sent to your emergency contact.')}
          />
        </div>

        {/* SOS */}
        <div className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
          <IconButton
            icon={<ShieldAlert size={19} />}
            label="Emergency SOS"
            className="size-12 bg-danger-600 text-white shadow-lg"
            onClick={() => setSosOpen(true)}
          />
        </div>

        {/* Bottom dock */}
        <div className="pb-safe-4 absolute inset-x-0 bottom-0 z-30 px-4">
          <div className="rounded-(--radius-xl) bg-white p-4 shadow-(--shadow-e4)">
            {/* Progress */}
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink-900">{STAGES[stage]}</p>
                <p className="tabular text-[12px] font-semibold text-ink-500">
                  ETA {time(trip.arriveAt)}
                </p>
              </div>
              <ProgressBar value={progress} />
              <div className="mt-2 flex justify-between">
                {STAGES.map((s, i) => (
                  <span
                    key={s}
                    className={`text-[9.5px] font-semibold ${
                      i <= stage ? 'text-brand-600' : 'text-ink-300'
                    }`}
                  >
                    {s.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* Driver */}
            <div className="flex items-center gap-3 border-t border-ink-100 pt-3.5">
              <Avatar name={driver.name} size={44} tone={driver.avatarTone} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold text-ink-900">{driver.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-500">
                  <Stars value={driver.rating} size={10} />
                  <span className="tabular truncate font-semibold">{driver.vehicle.plate}</span>
                </div>
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

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={() => setDetailsOpen(true)}>
                Trip details
              </Button>
              <Button onClick={() => navigate(`/passenger/complete/${trip.id}`)}>
                I&apos;ve arrived
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <Sheet open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Trip details">
        <div className="flex flex-col gap-3">
          <div className="rounded-(--radius-md) bg-brand-50 p-4">
            <p className="text-[11px] font-bold tracking-wide text-brand-700/70 uppercase">
              Boarding OTP
            </p>
            <p className="tabular mt-1 text-[24px] font-extrabold tracking-[0.18em] text-brand-700">
              {otpFor(trip.id + 'board')}
            </p>
          </div>

          <div className="flex gap-3.5 rounded-(--radius-md) border border-ink-100 p-4">
            <span className="mt-1.5 flex flex-col items-center gap-1">
              <span className="size-2.5 rounded-full bg-brand-600 ring-4 ring-brand-600/15" />
              <span className="h-9 w-px border-l-2 border-dashed border-ink-200" />
              <span className="size-2.5 rounded-full bg-success-500 ring-4 ring-success-500/15" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-3.5">
                <p className="tabular text-[15px] font-extrabold text-ink-900">
                  {time(trip.departAt)}
                </p>
                <p className="text-[12.5px] text-ink-500">
                  {cityName(trip.fromCityId)} · Central Silk Board
                </p>
              </div>
              <div>
                <p className="tabular text-[15px] font-extrabold text-ink-900">
                  {time(trip.arriveAt)}
                </p>
                <p className="text-[12.5px] text-ink-500">
                  {cityName(trip.toCityId)} · {trip.viaStops.at(-1)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-(--radius-md) border border-ink-100 p-4">
            <span className="text-[13px] font-semibold text-ink-600">Paid</span>
            <span className="tabular text-[16px] font-extrabold text-ink-900">
              {inr(Math.round(trip.farePerSeat * 1.06))}
            </span>
          </div>

          <Button
            variant="danger"
            block
            icon={<Ban size={17} />}
            onClick={() => {
              setDetailsOpen(false)
              setCancelOpen(true)
            }}
          >
            Cancel this ride
          </Button>
        </div>
      </Sheet>

      {/* SOS */}
      <Sheet
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        title="Emergency"
        subtitle="Your live location and driver details are attached automatically."
      >
        <div className="flex flex-col gap-2.5">
          {[
            { label: 'Call emergency services (112)', tone: 'danger' as const },
            { label: 'Call DikkiConnect safety desk', tone: 'brand' as const },
            { label: 'Alert my emergency contact now', tone: 'neutral' as const },
            { label: 'Report unsafe driving', tone: 'neutral' as const },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => {
                setSosOpen(false)
                toast.info('Safety desk notified', 'An agent will call you within 60 seconds.')
              }}
              className={`pressable rounded-(--radius-md) p-4 text-left text-[14px] font-bold ${
                a.tone === 'danger'
                  ? 'bg-danger-600 text-white'
                  : a.tone === 'brand'
                    ? 'bg-brand-600 text-white'
                    : 'border border-ink-200 bg-white text-ink-800'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </Sheet>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          setCancelOpen(false)
          toast.success('Ride cancelled', 'Refund processed to your original payment method.')
          navigate('/passenger/bookings')
        }}
        tone="danger"
        icon={<Ban size={28} />}
        title="Cancel this ride?"
        body="The ride has already started, so a 50% cancellation charge applies. The driver is compensated for the detour."
        confirmLabel="Cancel anyway"
        cancelLabel="Keep ride"
      />
    </Screen>
  )
}

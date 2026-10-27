import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, House, MapPin, QrCode, ShareNetwork } from '@phosphor-icons/react'
import { Screen, ScreenBody } from '@/components/layout/Screen'
import { ActionBar, Button, Card, KeyValue, Note, OtpDisplay } from '@/components/ui'
import { Confetti } from '@/components/viz/Illustrations'
import { LottieMark } from '@/components/brand/LottieMark'
import { hubById } from '@/lib/data'
import { useCustodyCode } from '@/lib/custody'
import { inr, shortDate } from '@/lib/format'
import { useApp } from '@/lib/store'
import { DropOffCountdown, NotifyAsk } from '@/components/domain/Confirm'

/** Booking receipt + the drop-off OTP (checkpoint 1 of the custody chain). */
export default function BookConfirmed() {
  const navigate = useNavigate()
  const { lastBookedId, parcels, resetDraft } = useApp()
  const [showConfetti, setShowConfetti] = useState(true)

  const parcel = parcels.find((p) => p.id === lastBookedId)

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2200)
    return () => clearTimeout(t)
  }, [])

  const isP2P = parcel?.mode === 'p2p'
  /* The code the other party will type in. It is issued by the server and
     held there: this screen asks for it, it is not computed here. The previous
     version derived it from the parcel id, which meant anyone who knew the id
     could produce the code that releases the parcel.

     Asked for above the early return, because a hook cannot sit behind one. */
  const otp = useCustodyCode(parcel?.id, isP2P ? 'handoff' : 'intake')

  if (!parcel) return <Navigate to="/sender" replace />

  const hub = hubById(parcel.originHubId)

  const done = (to: string) => {
    resetDraft()
    navigate(to, { replace: true })
  }

  return (
    <Screen tone="white">
      {showConfetti && <Confetti />}

      <ScreenBody className="pt-safe">
        <div className="flex flex-col items-center pt-10 pb-6 text-center">
          <LottieMark name="order-confirmed" size={132} />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45 }}
          >
            <h1 className="text-display mt-6 text-[26px] font-extrabold text-ink-900">
              Booking confirmed
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              {isP2P
                ? 'A verified traveler on your route will collect it from your address. Show them the OTP below.'
                : 'Drop your parcel at the hub within 24 hours and show the OTP below.'}
            </p>
            <p className="tabular mt-3 inline-block rounded-full bg-ink-100 px-3.5 py-1.5 text-[13px] font-extrabold text-ink-800">
              {parcel.id}
            </p>
            {!isP2P && <DropOffCountdown bookedAt={parcel.timeline[0]?.at ?? undefined} />}
          </motion.div>
        </div>

        <NotifyAsk />

        {/* Drop-off OTP */}
        <Card className="border-brand-100 bg-brand-50/60">
          <OtpDisplay
            code={otp.code ?? '——————'}
            label={isP2P ? 'Show this to the traveler' : 'Show this at the counter'}
          />
          <Note tone="brand" className="mt-4">
            {isP2P
              ? 'The traveler types this in to confirm they collected exactly this parcel from you. It is the first of two custody checkpoints — the receiver’s OTP closes the second.'
              : 'The hub manager types this in to confirm they received exactly this parcel from you. It is the first of four custody checkpoints.'}
          </Note>
        </Card>

        {/* Where it moves from */}
        <Card className="mt-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
              {isP2P ? <House size={18} /> : <MapPin size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                {isP2P ? 'Collected from' : 'Drop it at'}
              </p>
              {isP2P ? (
                <>
                  <p className="mt-0.5 text-[13.5px] leading-snug font-semibold text-ink-800">
                    {parcel.pickupAddress}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-[11.5px] font-bold text-ink-600">
                    <Clock size={11.5} />
                    Usually collected within a few hours
                  </p>
                </>
              ) : (
                <>
                  <p className="truncate text-[14.5px] font-bold text-ink-900">
                    {hub?.name.split('·').pop()?.trim()}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">{hub?.address}</p>
                  <p className="mt-0.5 text-[12px] text-ink-400">{hub?.landmark}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-[11.5px] font-bold text-ink-600">
                    <Clock size={11.5} />
                    {hub?.openFrom} – {hub?.openTo}
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Receipt */}
        <Card className="mt-3">
          <p className="mb-2 text-[12px] font-bold tracking-wide text-ink-400 uppercase">Receipt</p>
          <KeyValue label="Booked on" value={shortDate(parcel.bookedAt)} />
          <KeyValue label="Estimated delivery" value={shortDate(parcel.etaAt)} />
          <KeyValue label="Receiver" value={parcel.receiverName} />
          <div className="my-2 h-px bg-ink-100" />
          <KeyValue label="Amount paid" value={inr(parcel.price)} strong />
        </Card>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => done(`/sender/qr/${parcel.id}`)} icon={<QrCode size={17} />}>
            Show QR
          </Button>
          <Button variant="outline" icon={<ShareNetwork size={17} />}>
            Share details
          </Button>
        </div>
      </ScreenBody>

      <ActionBar>
        <Button block size="lg" onClick={() => done(`/sender/track/${parcel.id}`)}>
          Track this parcel
        </Button>
        <button
          onClick={() => done('/sender')}
          className="pressable-sm mt-3 w-full text-center text-[13.5px] font-semibold text-ink-500"
        >
          Back to home
        </button>
      </ActionBar>
    </Screen>
  )
}

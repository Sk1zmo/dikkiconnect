import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Receipt } from 'lucide-react'
import { Screen, ScreenBody } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Button,
  Card,
  Divider,
  KeyValue,
  Stars,
  TextArea,
  useToast,
} from '@/components/ui'
import { Confetti, SuccessBurst, SuccessMark } from '@/components/viz/Illustrations'
import { cityName, travelerById } from '@/lib/data'
import { useTrip } from '@/lib/store'
import { inr, time } from '@/lib/format'
import { cn } from '@/lib/cn'

const TAGS = [
  'Punctual',
  'Safe driving',
  'Clean car',
  'Great conversation',
  'Quiet ride',
  'Helped with bags',
]

export default function RideComplete() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [tip, setTip] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const trip = useTrip(id)
  if (!trip) return <Navigate to="/passenger" replace />

  const driver = travelerById(trip.travelerId)!
  const fare = Math.round(trip.farePerSeat * 1.06)

  const toggle = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const submit = () => {
    setSubmitting(true)
    setTimeout(() => {
      toast.success('Thanks for the feedback', tip > 0 ? `${inr(tip)} tip sent to ${driver.name.split(' ')[0]}` : undefined)
      navigate('/passenger', { replace: true })
    }, 1200)
  }

  return (
    <Screen tone="white">
      <Confetti pieces={16} />

      <ScreenBody className="pt-safe">
        <div className="flex flex-col items-center pt-8 text-center">
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="relative grid size-[110px] place-items-center"
          >
            <SuccessBurst />
            <SuccessMark size={78} />
          </motion.div>
          <h1 className="text-display mt-5 text-[24px] font-extrabold text-ink-900">
            You&apos;ve arrived
          </h1>
          <p className="mt-2 text-[13.5px] text-ink-500">
            {cityName(trip.fromCityId)} → {cityName(trip.toCityId)} · arrived {time(trip.arriveAt)}
          </p>
        </div>

        {/* Rating */}
        <Card className="mt-7">
          <div className="flex flex-col items-center">
            <Avatar name={driver.name} size={56} tone={driver.avatarTone} />
            <p className="mt-3 text-[15.5px] font-bold text-ink-900">
              How was your ride with {driver.name.split(' ')[0]}?
            </p>
            <Stars value={rating} size={34} onChange={setRating} className="mt-4" />
            <p className="mt-2 h-4 text-[12.5px] font-semibold text-ink-500">
              {rating === 0
                ? ''
                : ['Poor', 'Not great', 'Fine', 'Good', 'Excellent'][rating - 1]}
            </p>
          </div>

          {rating > 0 && (
            <div className="anim-fade-up mt-5 border-t border-ink-100 pt-5">
              <p className="mb-2.5 text-[12.5px] font-semibold text-ink-700">
                {rating >= 4 ? 'What went well?' : 'What could be better?'}
              </p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggle(t)}
                    className={cn(
                      'pressable-sm rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors',
                      tags.includes(t)
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-200 bg-white text-ink-600',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <TextArea
                  placeholder="Anything else you'd like to add? (only DikkiConnect sees this)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Tip */}
        {rating >= 4 && (
          <Card className="anim-fade-up mt-3">
            <div className="mb-3 flex items-center gap-2">
              <Heart size={16} className="text-danger-500" />
              <p className="text-[13.5px] font-bold text-ink-900">Add a tip?</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 20, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTip(amount)}
                  className={cn(
                    'pressable rounded-(--radius-sm) border-2 py-2.5 text-[13px] font-bold transition-colors',
                    tip === amount
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600',
                  )}
                >
                  {amount === 0 ? 'None' : `₹${amount}`}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px] text-ink-400">
              100% of tips go to the driver. DikkiConnect takes nothing.
            </p>
          </Card>
        )}

        {/* Receipt */}
        <Card className="mt-3">
          <div className="mb-2 flex items-center gap-2">
            <Receipt size={15} className="text-ink-400" />
            <p className="text-[12px] font-bold tracking-wide text-ink-400 uppercase">Receipt</p>
          </div>
          <KeyValue label="Cost share" value={inr(trip.farePerSeat)} />
          <KeyValue label="Platform fee" value={inr(fare - trip.farePerSeat)} />
          {tip > 0 && <KeyValue label="Tip" value={inr(tip)} tone="success" />}
          <Divider className="my-2" />
          <KeyValue label="Total" value={inr(fare + tip)} strong />
        </Card>
      </ScreenBody>

      <ActionBar>
        <Button block size="lg" loading={submitting} disabled={rating === 0} onClick={submit}>
          {submitting ? 'Submitting…' : tip > 0 ? `Submit & tip ${inr(tip)}` : 'Submit rating'}
        </Button>
        <button
          onClick={() => navigate('/passenger', { replace: true })}
          className="pressable-sm mt-3 w-full text-center text-[13.5px] font-semibold text-ink-500"
        >
          Skip for now
        </button>
      </ActionBar>
    </Screen>
  )
}

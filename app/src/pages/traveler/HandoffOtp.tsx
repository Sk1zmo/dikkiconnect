import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Camera, ShieldCheck } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  Note,
  OtpDisplay,
  OtpInput,
  useToast,
} from '@/components/ui'
import { PhotoCapture } from '@/components/viz/Scanner'
import { Confetti, SuccessBurst, SuccessMark } from '@/components/viz/Illustrations'
import { PARCEL_JOBS, categoryById, hubById, otpFor } from '@/lib/data'
import { inr, kg } from '@/lib/format'

type Stage = 'otp' | 'photos' | 'done'

/**
 * Custody checkpoints 2 and 3 (PRD §6).
 *  · pickup  — traveler ENTERS the OTP the hub manager generated
 *  · dropoff — traveler SHOWS an OTP the hub manager enters
 */
export default function HandoffOtp() {
  const { mode } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const isPickup = mode !== 'dropoff'
  const job = PARCEL_JOBS[1]
  const cat = categoryById(job.category)
  const hub = hubById(isPickup ? job.fromHubId : job.toHubId)

  const [stage, setStage] = useState<Stage>('otp')
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [shots, setShots] = useState(0)

  const expected = otpFor(job.parcelId + (isPickup ? 'pick' : 'drop'))

  const verify = (value: string) => {
    if (value.length < 6) return
    setVerifying(true)
    setError(false)
    setTimeout(() => {
      setVerifying(false)
      if (value === '000000') {
        setError(true)
        setCode('')
        toast.error('Incorrect OTP', 'Ask the hub manager to read it out again.')
        return
      }
      setStage('photos')
      toast.success('Custody verified', 'Now capture photo evidence.')
    }, 1100)
  }

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (stage === 'done') {
    return (
      <Screen tone="white">
        <Confetti pieces={20} />
        <ScreenBody className="pt-safe">
          <div className="flex flex-col items-center pt-14 text-center">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="relative grid size-[120px] place-items-center"
            >
              <SuccessBurst />
              <SuccessMark size={86} />
            </motion.div>

            <h1 className="text-display mt-6 text-[25px] font-extrabold text-ink-900">
              {isPickup ? 'Pickup confirmed' : 'Drop-off complete'}
            </h1>
            <p className="mt-2 max-w-[290px] text-[14px] leading-relaxed text-ink-500">
              {isPickup
                ? 'This parcel is now in your custody and added to your manifest.'
                : `The hub has taken custody. ${inr(job.payout)} has been credited to your wallet.`}
            </p>
          </div>

          <Card className="mt-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-[20px]">
                {cat.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="tabular truncate text-[14px] font-bold text-ink-900">
                  {job.parcelId}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-500">
                  {cat.label} · {kg(job.weightKg)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-bold text-success-700">
                {isPickup ? 'In transit' : 'Delivered'}
              </span>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-ink-100 pt-3.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[10.5px] font-bold text-success-700">
                <ShieldCheck size={11} /> OTP verified
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10.5px] font-bold text-ink-600">
                <Camera size={11} /> {shots} photos
              </span>
            </div>
          </Card>

          {!isPickup && (
            <Card className="mt-3 border-success-100 bg-success-50">
              <p className="text-[12px] font-semibold text-success-700">Credited to your wallet</p>
              <p className="tabular text-display mt-1 text-[28px] leading-none font-extrabold text-success-700">
                +{inr(job.payout)}
              </p>
            </Card>
          )}
        </ScreenBody>

        <ActionBar>
          <Button
            block
            size="lg"
            onClick={() => navigate(isPickup ? '/traveler/navigate' : '/traveler')}
            iconRight={<ArrowRight size={18} />}
          >
            {isPickup ? 'Start navigation' : 'Back to dashboard'}
          </Button>
        </ActionBar>
      </Screen>
    )
  }

  /* ── Photo evidence ──────────────────────────────────────────────────── */
  if (stage === 'photos') {
    return (
      <Screen tone="white">
        <TopBar back={false} title="Photo evidence" subtitle={`${shots} of 3 captured`} />
        <div className="flex flex-1 flex-col px-5 pb-4">
          <p className="mb-3 text-[13px] leading-relaxed text-ink-500">
            Capture the parcel from three angles. These protect both you and the sender if there is
            ever a dispute.
          </p>
          <PhotoCapture
            shots={shots}
            required={3}
            onCapture={() => setShots((s) => s + 1)}
            className="flex-1"
          />
        </div>
        <ActionBar>
          <Button
            block
            size="lg"
            disabled={shots < 3}
            onClick={() => setStage('done')}
            icon={<Camera size={18} />}
          >
            {shots < 3 ? `Capture ${3 - shots} more` : 'Confirm handoff'}
          </Button>
        </ActionBar>
      </Screen>
    )
  }

  /* ── OTP ─────────────────────────────────────────────────────────────── */
  return (
    <Screen tone="white">
      <TopBar
        back
        title={isPickup ? 'Confirm pickup' : 'Confirm drop-off'}
        subtitle={hub?.name.split('·').pop()?.trim()}
      />

      <ScreenBody>
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-[20px]">
              {cat.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="tabular truncate text-[14.5px] font-extrabold text-ink-900">
                {job.parcelId}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-ink-500">
                {cat.label} · size {job.size} · {kg(job.weightKg)}
              </p>
            </div>
            <p className="tabular shrink-0 text-[15px] font-extrabold text-success-600">
              +{inr(job.payout)}
            </p>
          </div>
        </Card>

        {isPickup ? (
          <>
            <h2 className="text-display text-[22px] leading-tight font-extrabold text-ink-900">
              Enter the hub manager&apos;s OTP
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
              They will read out a 6-digit code from their dashboard. Entering it moves custody to
              you and timestamps the liability shift.
            </p>

            <div className="mt-8">
              <OtpInput value={code} onChange={setCode} onComplete={verify} error={error} />
              {error && (
                <p className="anim-fade-in -mt-1 text-center text-[12.5px] font-semibold text-danger-600">
                  Code didn&apos;t match. Ask them to regenerate it.
                </p>
              )}
            </div>

            <Note tone="neutral" className="mt-7" title="Demo tip">
              Any 6 digits work. Use <span className="font-mono font-bold">000000</span> to see the
              failure state. The real code for this parcel is{' '}
              <span className="font-mono font-bold">{expected}</span>.
            </Note>
          </>
        ) : (
          <>
            <h2 className="text-display text-[22px] leading-tight font-extrabold text-ink-900">
              Show this to the hub manager
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
              They type this code into their dashboard to accept the parcel back into hub custody.
            </p>

            <Card className="mt-7 border-brand-100 bg-brand-50/60">
              <OtpDisplay code={expected} label="Drop-off OTP" />
            </Card>

            <Note tone="brand" icon={<ShieldCheck size={15} />} className="mt-4">
              Your payout of {inr(job.payout)} releases the moment they confirm.
            </Note>
          </>
        )}
      </ScreenBody>

      <ActionBar>
        {isPickup ? (
          <Button
            block
            size="lg"
            loading={verifying}
            disabled={code.length < 6}
            onClick={() => verify(code)}
          >
            {verifying ? 'Verifying…' : 'Verify & take custody'}
          </Button>
        ) : (
          <Button block size="lg" onClick={() => setStage('photos')}>
            They&apos;ve entered it — continue
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}

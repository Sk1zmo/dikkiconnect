import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Camera, ShieldCheck } from '@phosphor-icons/react'
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
import { Confetti } from '@/components/viz/Illustrations'
import { LottieMark } from '@/components/brand/LottieMark'
import { categoryById, hubById, jobFromParcel } from '@/lib/data'
import { inr, kg } from '@/lib/format'
import { useApp, useManifest, useMe, useOpenJobs } from '@/lib/store'
import { useCustodyCode, useCustodyGate } from '@/lib/custody'
import { parcels as parcelsApi } from '@/lib/api'
import { OtpHelper } from '@/components/domain/OtpHelper'
import { CategoryMark } from '@/components/domain/CategoryIcon'


/* Photographs first. The server verifies the code and advances custody in one
   call, with the shots attached, so there is no moment where a code has been
   accepted but nothing has moved — and no way to take the pictures after the
   fact. It is also the better order in a hub doorway: photograph the box while
   you are holding it, then read six digits off someone else's phone. */
type Stage = 'photos' | 'otp' | 'done'

/**
 * Custody checkpoints 2 and 3 (PRD §6).
 *  · pickup  — traveler ENTERS the OTP the hub manager generated
 *  · dropoff — traveler SHOWS an OTP the hub manager enters
 */
export default function HandoffOtp() {
  const ME = useMe()
  const { mode } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const isPickup = mode !== 'dropoff'
  const { adoptParcel, earn, parcels } = useApp()

  // Pickup works on the parcel this driver has just claimed; drop-off on the
  // one they are currently carrying. Both come from the shared ledger, so the
  // OTP belongs to a parcel that genuinely exists.
  const claimed = parcels.find((p) => p.travelerId === ME.id && p.status === 'assigned')
  const carrying = useManifest(ME.id)[0]
  const openFallback = useOpenJobs()[0]
  const parcel = (isPickup ? claimed ?? openFallback : carrying ?? claimed) ?? parcels[0]
  const job = parcel ? jobFromParcel(parcel) : null

  const [stage, setStage] = useState<Stage>('photos')
  const [code, setCode] = useState('')
  const [checkingHub, setCheckingHub] = useState(false)
  const [photoIds, setPhotoIds] = useState<string[]>([])
  const shots = photoIds.length

  // Hub drop-off is the one checkpoint the driver SHOWS rather than types —
  // the hub manager keys it in. Everywhere else the driver types.
  const p2pRoute = parcel?.mode === 'p2p'
  const entersCode = isPickup || p2pRoute

  /* Which of the four checkpoints this screen is standing at. Taking custody
     is `handoff` either way; letting go of it is `deliver` to a person and
     `arrive` at a hub, and those are different events in the record. */
  const checkpoint = isPickup ? 'handoff' : p2pRoute ? 'deliver' : 'arrive'

  const gate = useCustodyGate(parcel?.id, checkpoint, photoIds)
  /* The hub drop-off code is issued to the driver, because at that checkpoint
     the driver is the one holding the parcel. It is only asked for when that
     screen is actually showing. */
  const shown = useCustodyCode(parcel?.id, 'arrive', !entersCode && stage === 'otp')

  if (!parcel || !job) return <Navigate to="/traveler/jobs" replace />

  const cat = categoryById(job.category)
  const isP2P = job.mode === 'p2p'
  const hub = hubById(isPickup ? job.fromHubId : job.toHubId)
  const counterpart = isPickup
    ? isP2P
      ? "the sender's parcel screen"
      : "the hub manager's release screen"
    : isP2P
      ? "the receiver's collection screen"
      : "the destination hub's intake screen"

  /** Code plus photographs, in one request. The server decides. */
  const verify = async (value: string) => {
    if (value.length < 6 || gate.submitting || !job) return
    const moved = await gate.submit(value)
    if (!moved) {
      setCode('')
      toast.error('Hand-off not accepted', gate.error ?? 'Ask them to read the code again.')
      return
    }
    adoptParcel(moved)
    if (!isPickup) earn(job.payout, 'Delivery payout credited', `${job.parcelId} · handed over`)
    setStage('done')
    toast.success('Custody recorded', isPickup ? 'The parcel is yours.' : 'Hand-off complete.')
  }

  /* The hub drop-off is the hub's call to make: they type the code into their
     own device and the server moves the parcel. This asks the server whether
     that happened rather than taking the driver's word for it — a driver who
     tapped "continue" on the kerb used to mark the parcel arrived at a hub
     that had never seen it. */
  const confirmHubTookIt = async () => {
    if (!job) return
    setCheckingHub(true)
    try {
      const { parcel: latest } = await parcelsApi.one(job.parcelId)
      if (latest.status !== 'at_destination_hub') {
        toast.error(
          'Not confirmed yet',
          'The hub has not accepted it. Wait for them to enter the code.',
        )
        return
      }
      adoptParcel(latest)
      earn(job.payout, 'Delivery payout credited', `${job.parcelId} · handed over`)
      setStage('done')
    } catch {
      toast.error('Could not check', 'No connection. Nothing has been recorded.')
    } finally {
      setCheckingHub(false)
    }
  }

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (stage === 'done') {
    return (
      <Screen tone="white">
        <Confetti pieces={20} />
        <ScreenBody className="pt-safe">
          <div className="flex flex-col items-center pt-14 text-center">
            <LottieMark name="parcel-delivered" size={132} />

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
              <CategoryMark id={cat.id} size={44} />
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
        <TopBar back title="Photo evidence" subtitle={`${shots} of 3 captured`} />
        <div className="flex flex-1 flex-col px-5 pb-4">
          <p className="mb-3 text-[13px] leading-relaxed text-ink-500">
            Capture the parcel from three angles. These protect both you and the sender if there is
            ever a dispute.
          </p>
          <PhotoCapture
            photoIds={photoIds}
            required={3}
            onStored={(pid) => setPhotoIds((ids) => [...ids, pid])}
            parcelId={job.parcelId}
            checkpoint={checkpoint}
            className="flex-1"
          />
        </div>
        <ActionBar>
          <Button
            block
            size="lg"
            disabled={shots < 3}
            onClick={() => setStage('otp')}
            icon={<Camera size={18} />}
          >
            {shots < 3 ? `Capture ${3 - shots} more` : 'Continue to the code'}
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
        subtitle={isP2P ? (isPickup ? job.fromLabel : job.toLabel) : hub?.name.split('·').pop()?.trim()}
      />

      <ScreenBody>
        <Card className="mb-6">
          <div className="flex min-h-12 items-center gap-3">
            <CategoryMark id={cat.id} size={44} />
            <div className="min-w-0 flex-1">
              <p className="tabular truncate text-[14.5px] font-extrabold text-ink-900">
                {job.parcelId}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-ink-500">
                {cat.label} · size {job.size} · {kg(job.weightKg)}
              </p>
            </div>
            {/* What this handover is worth, with the word under it rather than
                beside it — the figure has to survive being read at arm's length
                at a hub counter. */}
            <div className="shrink-0 text-right">
              <p className="tabular text-[17px] leading-none font-extrabold tracking-title text-success-600">
                +{inr(job.payout)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-ink-500">payout</p>
            </div>
          </div>
        </Card>

        {entersCode ? (
          <>
            <h2 className="text-display text-[22px] leading-tight font-extrabold text-ink-900">
              {!isPickup
                ? "Enter the receiver's OTP"
                : isP2P
                  ? "Enter the sender's OTP"
                  : "Enter the hub manager's OTP"}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
              {isPickup
                ? 'They read out a 6-digit code tied to this parcel. Entering it moves custody to you and timestamps the liability shift.'
                : 'The receiver was sent a code when you set off. Entering it closes the delivery and releases your payout.'}
            </p>

            <div className="mt-8">
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={(v) => void verify(v)}
                error={Boolean(gate.error)}
                disabled={gate.locked}
              />
              {gate.error && (
                <p className="anim-fade-in -mt-1 text-center text-[12.5px] font-semibold text-danger-600">
                  {gate.error}
                </p>
              )}
            </div>

            <OtpHelper gate={gate} source={counterpart} />
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
              <OtpDisplay
                code={shown.loading ? '——————' : (shown.code ?? '——————')}
                label="Drop-off OTP"
              />
              {shown.error && (
                <p className="mt-3 text-center text-[12.5px] font-semibold text-danger-600">
                  {shown.error}
                </p>
              )}
            </Card>

            <Note tone="brand" icon={<ShieldCheck size={15} />} className="mt-4">
              Your payout of {inr(job.payout)} releases the moment they confirm.
            </Note>
          </>
        )}
      </ScreenBody>

      <ActionBar>
        {entersCode ? (
          <Button
            block
            size="lg"
            loading={gate.submitting}
            disabled={code.length < 6 || gate.locked}
            onClick={() => void verify(code)}
          >
            {gate.submitting
              ? 'Verifying…'
              : isPickup
                ? 'Verify & take custody'
                : 'Verify & complete delivery'}
          </Button>
        ) : (
          <Button
            block
            size="lg"
            loading={checkingHub}
            onClick={() => void confirmHubTookIt()}
          >
            {checkingHub ? 'Checking…' : 'Check they’ve accepted it'}
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}

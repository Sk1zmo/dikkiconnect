import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, Scales, ShieldCheck } from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  Counter,
  KeyValue,
  Note,
  OtpInput,
  Select,
  Stepper,
  useToast,
} from '@/components/ui'
import { PhotoCapture } from '@/components/viz/Scanner'
import { LottieMark } from '@/components/brand/LottieMark'
import { HUB_HANDLING_FEE, categoryById } from '@/lib/data'
import { useApp } from '@/lib/store'
import { useCustodyGate } from '@/lib/custody'
import { OtpHelper } from '@/components/domain/OtpHelper'
import { inr, kg } from '@/lib/format'
import { CategoryMark } from '@/components/domain/CategoryIcon'

const STEPS = ['Weigh', 'Photos', 'OTP', 'Done']
const SHELVES = ['A-01', 'A-04', 'A-09', 'B-01', 'B-05', 'C-02', 'C-07', 'D-03']

/**
 * Parcel intake — custody checkpoints 1 and 3. The hub manager weighs,
 * photographs, then enters the OTP held by whoever is handing the parcel over:
 * the sender dropping it off, or the traveller who has just driven it here.
 */
export default function HubIntake() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { parcels, adoptParcel, earn } = useApp()

  // Work against the real parcel where one exists, so weight, category and the
  // declared value on screen are the sender's actual booking.
  const parcel = parcels.find((p) => p.id === id)

  const [step, setStep] = useState(0)
  const [weight, setWeight] = useState(parcel?.weightKg ?? 2.5)
  const [shelf, setShelf] = useState('A-04')
  const [photoIds, setPhotoIds] = useState<string[]>([])
  const [code, setCode] = useState('')
  const shots = photoIds.length

  /* Which hand-off this is depends on where the parcel actually is, not on
     which screen was opened. A parcel still with its sender is being taken in
     (`intake`); one that a traveller has driven here is arriving (`arrive`).
     They are different events in the record and the server will only accept
     the one that is legal from the parcel's current status — before this, the
     destination hub had no screen at all and the chain had nowhere to go
     between "in transit" and "ready for collection".

     The code is the server's. Entering it here does not "unlock" a screen; it
     is the request that moves custody, with these photographs attached. */
  const arriving = parcel?.status === 'in_transit'
  const checkpoint = arriving ? 'arrive' : 'intake'
  const gate = useCustodyGate(id, checkpoint, photoIds)

  const declared = parcel?.weightKg ?? 2.4
  const cat = categoryById(parcel?.category ?? 'electronics')
  const discrepancy = Math.abs(weight - declared) > 0.5

  const verify = async (value: string) => {
    if (value.length < 6 || gate.submitting) return
    const accepted = await gate.submit(value)
    if (!accepted) {
      setCode('')
      toast.error(
        'Hand-off not accepted',
        gate.error ?? `Ask the ${arriving ? 'traveller' : 'sender'} to read the code again.`,
      )
      return
    }
    /* The server has moved it. Everything after this is drawing that fact:
       the sender's tracker, the driver's job feed and this hub's shelf list
       all read the one record. */
    adoptParcel(accepted)
    earn(HUB_HANDLING_FEE, 'Handling fee credited', `${id} · intake complete`)
    setStep(3)
    toast.success('Custody accepted', `${id} logged to shelf ${shelf}`)
  }

  /* ── Done ────────────────────────────────────────────────────────────── */
  if (step === 3) {
    return (
      <Screen tone="white">
        <ScreenBody className="pt-safe">
          <div className="flex flex-col items-center pt-14 text-center">
            <LottieMark name="parcel-received" size={128} />
            <h1 className="text-display mt-6 text-[24px] font-extrabold text-ink-900">
              Parcel accepted
            </h1>
            <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-ink-500">
              {arriving
                ? 'The receiver has been notified that it is ready to collect.'
                : 'The sender has been notified. It is now waiting for a matching traveler.'}
            </p>
          </div>

          <Card className="mt-8">
            <KeyValue label="Parcel ID" value={id ?? '—'} />
            <KeyValue label="Shelf" value={shelf} />
            <KeyValue label="Weighed" value={kg(weight)} />
            <KeyValue label="Photos" value={`${shots} captured`} />
            <div className="my-2 h-px bg-ink-100" />
            <KeyValue label="Your handling fee" value={inr(HUB_HANDLING_FEE)} strong tone="success" />
          </Card>

          <Note tone="brand" className="mt-3" title="What happens next">
            Travelers heading to Mysore now see this parcel in their job feed. When one arrives,
            generate a release OTP from the Handoff screen.
          </Note>
        </ScreenBody>

        <ActionBar>
          <Button block size="lg" onClick={() => navigate('/hub/scan')}>
            Scan next parcel
          </Button>
          <button
            onClick={() => navigate('/hub')}
            className="pressable-sm mt-3 w-full text-center text-[13.5px] font-semibold text-ink-500"
          >
            Back to dashboard
          </button>
        </ActionBar>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar
        back={step === 0}
        backTo="/hub/scan"
        title="Parcel intake"
        subtitle={id}
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
        {/* ── Weigh ───────────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="anim-fade-up">
            {/* The box is in the worker's hands while they read this card, so it
                is the one place where "does the screen match the thing" has to
                be answerable without reading. The category as a drawn object in
                its own colour answers it; the grey line glyph that was here did
                not. */}
            <Card className="mb-4">
              <div className="flex min-h-[52px] items-center gap-3.5">
                <CategoryMark id={cat.id} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="tabular truncate text-[16px] font-extrabold tracking-title text-ink-900">
                    {id}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-500">
                    {cat.label} · declared {kg(declared)} · Bangalore → Mysore
                  </p>
                </div>
              </div>
            </Card>

            <div className="mb-2 flex items-center gap-2">
              <Scales size={15} className="text-ink-400" />
              <p className="text-[12.5px] font-semibold text-ink-700">Actual weight on the scale</p>
            </div>
            <Counter
              value={weight}
              onChange={setWeight}
              min={0.1}
              max={30}
              step={0.1}
              decimals={1}
              suffix="kg"
            />

            {discrepancy && (
              <Note tone="warn" className="mt-3" title="Weight discrepancy">
                Sender declared {kg(declared)}, scale reads {kg(weight)}. The fare will be adjusted
                automatically and the sender notified before dispatch.
              </Note>
            )}

            <div className="mt-5">
              <Select
                label="Assign shelf"
                value={shelf}
                onChange={setShelf}
                options={SHELVES.map((s) => ({ value: s, label: `Shelf ${s}` }))}
              />
            </div>

            <Note tone="neutral" className="mt-4">
              Put the parcel on the shelf before continuing — the photos should show it in its final
              position.
            </Note>
          </div>
        )}

        {/* ── Photos ──────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="anim-fade-up flex h-full flex-col">
            <p className="mb-3 text-[13px] leading-relaxed text-ink-500">
              Capture three angles: label, overall condition, and any existing damage. This is your
              evidence in a dispute.
            </p>
            <PhotoCapture
              photoIds={photoIds}
              required={3}
              onStored={(pid) => setPhotoIds((ids) => [...ids, pid])}
              parcelId={id}
              checkpoint={checkpoint}
              className="min-h-[300px] flex-1"
            />
          </div>
        )}

        {/* ── OTP ─────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="anim-fade-up">
            <h2 className="text-display text-[22px] leading-tight font-extrabold text-ink-900">
              {arriving ? 'Enter the traveller’s OTP' : "Enter the sender's OTP"}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
              Ask them to show the 6-digit code on their WayPool app. Entering it confirms you
              received exactly this parcel from{' '}
              {arriving ? 'this traveller' : 'this sender'}.
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

            <Card className="mt-7">
              <p className="mb-2 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
                Intake summary
              </p>
              <KeyValue label="Weight" value={kg(weight)} />
              <KeyValue label="Shelf" value={shelf} />
              <KeyValue label="Photos" value={`${shots} captured`} />
            </Card>

            <OtpHelper
              gate={gate}
              source={
                arriving
                  ? "the traveller's drop-off screen in their app"
                  : "the sender's drop-off screen in their app"
              }
            />

            <Note tone="neutral" icon={<ShieldCheck size={15} />} className="mt-3" title="Why this matters">
              This code is what ties the parcel in your hands to the booking on screen. Logging
              intake without it leaves the custody chain with a gap nobody can account for.
            </Note>
          </div>
        )}
      </ScreenBody>

      <ActionBar>
        {step === 0 && (
          <Button block size="lg" onClick={() => setStep(1)} icon={<Camera size={18} />}>
            Continue to photos
          </Button>
        )}
        {step === 1 && (
          <Button block size="lg" disabled={shots < 3} onClick={() => setStep(2)}>
            {shots < 3 ? `Capture ${3 - shots} more` : 'Continue to OTP'}
          </Button>
        )}
        {step === 2 && (
          <Button
            block
            size="lg"
            loading={gate.submitting}
            disabled={code.length < 6 || gate.locked}
            onClick={() => void verify(code)}
          >
            {gate.submitting ? 'Verifying…' : 'Verify & accept custody'}
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}

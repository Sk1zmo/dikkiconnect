import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ShieldCheck, User } from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  Field,
  KeyValue,
  Note,
  OtpInput,
  Stepper,
  useToast,
} from '@/components/ui'
import { PhotoCapture } from '@/components/viz/Scanner'
import { LottieMark } from '@/components/brand/LottieMark'
import { HUB_HANDLING_FEE, categoryById } from '@/lib/data'
import { inr, phone as fmtPhone, relative } from '@/lib/format'
import { useApp, useAwaitingPickup } from '@/lib/store'
import { useCustodyGate } from '@/lib/custody'
import { OtpHelper } from '@/components/domain/OtpHelper'
import { CategoryMark } from '@/components/domain/CategoryIcon'

/* Evidence before the code, because the server verifies and delivers in one
   call and the photographs have to be attached to it. It is also the right
   order at a counter: photograph the parcel while it is still in your hands,
   then read six digits off the receiver's phone as you let go of it. */
const STEPS = ['Evidence', 'Verify', 'Delivered']

/** Custody checkpoint 4 — the final handoff that closes the loop. */
export default function ReceiverPickup() {
  const navigate = useNavigate()
  const toast = useToast()
  const { adoptParcel, earn } = useApp()

  // The oldest parcel actually waiting to be collected at this hub.
  const parcel = useAwaitingPickup()[0]

  const [step, setStep] = useState(0)
  const [code, setCode] = useState('')
  const [photoIds, setPhotoIds] = useState<string[]>([])
  const [receiverName, setReceiverName] = useState(parcel?.receiverName ?? '')
  const shots = photoIds.length

  const cat = categoryById(parcel?.category ?? 'electronics')
  /* The receiver's code, held by the server, and nothing else releases the
     parcel. Submitting it is the delivery. */
  const gate = useCustodyGate(parcel?.id, 'deliver', photoIds)

  /** The code and the photographs together close the delivery, server-side. */
  const verify = async (value: string) => {
    if (value.length < 6 || gate.submitting || !parcel) return
    const delivered = await gate.submit(value)
    if (!delivered) {
      setCode('')
      toast.error('Not delivered', gate.error ?? 'Do not release the parcel without a match.')
      return
    }
    adoptParcel(delivered)
    earn(HUB_HANDLING_FEE, 'Handling fee credited', `${parcel.id} · collected by receiver`)
    setStep(2)
  }

  /* ── Delivered ───────────────────────────────────────────────────────── */
  if (step === 2) {
    return (
      <Screen tone="white">
        <ScreenBody className="pt-safe">
          <div className="flex flex-col items-center pt-14 text-center">
            <LottieMark name="parcel-delivered" size={128} />
            <h1 className="text-display mt-6 text-[24px] font-extrabold text-ink-900">Delivered</h1>
            <p className="mt-2 max-w-[290px] text-[14px] leading-relaxed text-ink-500">
              The delivery loop is closed. The sender has been notified and payment released from
              escrow.
            </p>
          </div>

          <Card className="mt-8">
            <KeyValue label="Parcel" value={parcel?.id ?? '—'} />
            <KeyValue label="Collected by" value={receiverName} />
            <KeyValue label="Evidence" value={`${shots} photos on the record`} />
            <KeyValue label="Verification" value="OTP matched" tone="success" />
            <div className="my-2 h-px bg-ink-100" />
            <KeyValue label="Your handling fee" value={inr(HUB_HANDLING_FEE)} strong tone="success" />
          </Card>

          <Note tone="brand" className="mt-3" title="Loop closed">
            Four custody checkpoints, four OTPs, photo evidence at each. This parcel now has a
            complete audit trail if anyone ever disputes it.
          </Note>
        </ScreenBody>

        <ActionBar>
          <Button block size="lg" onClick={() => navigate('/hub')}>
            Back to dashboard
          </Button>
          <button
            onClick={() => navigate('/hub/scan')}
            className="pressable-sm mt-3 w-full text-center text-[13.5px] font-semibold text-ink-500"
          >
            Process another pickup
          </button>
        </ActionBar>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar
        back={step === 0}
        backTo="/hub"
        title="Receiver pickup"
        subtitle={`Step ${step + 1} of 3`}
      />

      <div className="shrink-0 px-5 pb-4">
        <Stepper steps={STEPS} current={step} />
      </div>

      <ScreenBody>
        {/* The worker is fetching this parcel off a shelf while a receiver waits
            at the counter. The drawn object is what they carry in their head to
            the shelf; a grey outline is not. */}
        <Card className="mb-4">
          <div className="flex min-h-[52px] items-center gap-3.5">
            <CategoryMark id={cat.id} size={48} />
            <div className="min-w-0 flex-1">
              <p className="tabular truncate text-[16px] font-extrabold tracking-title text-ink-900">
                {parcel?.id ?? 'No parcel waiting'}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-ink-500">
                {cat.label} · shelf C-02 ·{' '}
                {parcel ? `arrived ${relative(parcel.etaAt)}` : 'nothing ready for collection'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-warn-50 px-2.5 py-1 text-[11px] font-bold text-warn-700">
              Ready
            </span>
          </div>
          <div className="mt-3.5 border-t border-ink-100 pt-3.5">
            <KeyValue label="Expected receiver" value={parcel?.receiverName ?? '—'} />
            {/* No stand-in number. A hub worker reading an invented mobile off
                this screen would ring a stranger. */}
            <KeyValue
              label="Their mobile"
              value={parcel?.receiverPhone ? fmtPhone(parcel.receiverPhone) : 'Not given'}
            />
          </div>
        </Card>

        {/* ── Verify ──────────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="anim-fade-up">
            <h2 className="text-display text-[22px] leading-tight font-extrabold text-ink-900">
              Enter the receiver&apos;s OTP
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
              It was sent to their phone when this parcel arrived. Never release a parcel without a
              matching code.
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
                  {gate.error} Do not hand over the parcel.
                </p>
              )}
            </div>

            <OtpHelper gate={gate} source="the receiver's phone — sent when the parcel landed" />

            <div className="mt-6">
              <Field
                label="Name of person collecting"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                prefix={<User size={15} />}
                hint="If someone else is collecting on their behalf, record the actual name here."
              />
            </div>

            <Note tone="warn" icon={<ShieldCheck size={15} />} className="mt-2" title="This matters">
              This OTP is what protects against wrong pickup. If the receiver cannot produce it, ask
              them to check their SMS or contact WayPool support — do not release the parcel.
            </Note>
          </div>
        )}

        {/* ── Evidence ────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="anim-fade-up flex h-full flex-col">
            <p className="mb-3 text-[13px] leading-relaxed text-ink-500">
              Photograph the parcel being handed over. One shot showing the receiver holding it is
              enough.
            </p>
            <PhotoCapture
              photoIds={photoIds}
              required={2}
              onStored={(pid) => setPhotoIds((ids) => [...ids, pid])}
              parcelId={parcel?.id}
              checkpoint="deliver"
              className="min-h-[280px] flex-1"
            />
            {/* A "capture signature" switch used to sit here over a dashed box
                reading "Sign here". It drew nothing, stored nothing and was
                never shown to anyone. With the photographs now real, leaving a
                mock beside them would be the one part of this screen that
                still lies about what goes on the record. */}
          </div>
        )}
      </ScreenBody>

      <ActionBar>
        {step === 0 ? (
          <Button
            block
            size="lg"
            disabled={shots < 2}
            onClick={() => setStep(1)}
            icon={<Camera size={18} />}
          >
            {shots < 2 ? `Capture ${2 - shots} more` : 'Continue to the OTP'}
          </Button>
        ) : (
          <Button
            block
            size="lg"
            loading={gate.submitting}
            disabled={code.length < 6 || gate.locked}
            onClick={() => void verify(code)}
          >
            {gate.submitting ? 'Verifying…' : 'Verify & release parcel'}
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}

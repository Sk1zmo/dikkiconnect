import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, PenLine, ShieldCheck, User } from 'lucide-react'
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
  Switch,
  useToast,
} from '@/components/ui'
import { PhotoCapture } from '@/components/viz/Scanner'
import { LottieMark } from '@/components/brand/LottieMark'
import { HUB_HANDLING_FEE, categoryById, otpFor } from '@/lib/data'
import { inr, phone as fmtPhone, relative } from '@/lib/format'
import { useApp, useAwaitingPickup } from '@/lib/store'
import { useOtpGate } from '@/lib/otp'
import { OtpHelper } from '@/components/domain/OtpHelper'
import { CategoryIcon } from '@/components/domain/CategoryIcon'

const STEPS = ['Verify', 'Evidence', 'Delivered']

/** Custody checkpoint 4 — the final handoff that closes the loop. */
export default function ReceiverPickup() {
  const navigate = useNavigate()
  const toast = useToast()
  const { advanceParcel, earn } = useApp()

  // The oldest parcel actually waiting to be collected at this hub.
  const parcel = useAwaitingPickup()[0]

  const [step, setStep] = useState(0)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [shots, setShots] = useState(0)
  const [signature, setSignature] = useState(true)
  const [receiverName, setReceiverName] = useState(parcel?.receiverName ?? '')

  const cat = categoryById(parcel?.category ?? 'electronics')
  // Strict: the receiver's code, and nothing else, releases the parcel.
  const gate = useOtpGate(otpFor((parcel?.id ?? '') + 'recv'))

  const verify = (value: string) => {
    if (value.length < 6 || verifying) return
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      if (!gate.check(value)) {
        setCode('')
        toast.error('Incorrect OTP', 'Do not release the parcel without a matching code.')
        return
      }
      setStep(1)
      toast.success('Receiver verified', 'Capture evidence to close the delivery.')
    }, 900)
  }

  /** Evidence captured — close the loop on the shared ledger. */
  const complete = () => {
    if (parcel) {
      advanceParcel(parcel.id, 'delivered', {
        actor: receiverName || parcel.receiverName,
        photos: shots,
      })
      earn(HUB_HANDLING_FEE, 'Handling fee credited', `${parcel.id} · collected by receiver`)
    }
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
            <KeyValue label="Evidence" value={`${shots} photos${signature ? ' + signature' : ''}`} />
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
        <Card className="mb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-ink-700">
              <CategoryIcon id={cat.id} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="tabular truncate text-[14.5px] font-extrabold text-ink-900">
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
            <KeyValue label="Their mobile" value={fmtPhone(parcel?.receiverPhone ?? '9845567890')} />
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
                onComplete={verify}
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
              them to check their SMS or contact DikkiConnect support — do not release the parcel.
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
              shots={shots}
              required={2}
              onCapture={() => setShots((s) => s + 1)}
              className="min-h-[280px] flex-1"
            />
            <Card className="mt-4">
              <Switch
                checked={signature}
                onChange={setSignature}
                label="Capture signature"
                description="Optional, but recommended for high-value parcels"
              />
              {signature && (
                <div className="anim-fade-up mt-3 grid h-24 place-items-center rounded-(--radius-md) border-2 border-dashed border-ink-200 bg-ink-50">
                  <span className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-400">
                    <PenLine size={15} />
                    Sign here
                  </span>
                </div>
              )}
            </Card>
          </div>
        )}
      </ScreenBody>

      <ActionBar>
        {step === 0 ? (
          <Button
            block
            size="lg"
            loading={verifying}
            disabled={code.length < 6}
            onClick={() => verify(code)}
          >
            {verifying ? 'Verifying…' : 'Verify receiver'}
          </Button>
        ) : (
          <Button
            block
            size="lg"
            disabled={shots < 2}
            onClick={complete}
            icon={<Camera size={18} />}
          >
            {shots < 2 ? `Capture ${2 - shots} more` : 'Mark as delivered'}
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}

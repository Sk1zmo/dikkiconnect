import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Landmark, Lock, Smartphone, Wallet as WalletIcon } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  ConfirmDialog,
  KeyValue,
  Note,
  RadioCard,
  Sheet,
  Stepper,
  useToast,
} from '@/components/ui'
import { inr } from '@/lib/format'
import { useApp } from '@/lib/store'
import { UPI_APPS, buildUpiUrl, canPayByUpi, launchUpi, upiReference } from '@/lib/upi'
import { LottieMark } from '@/components/brand/LottieMark'
import { useFakeProgress } from '@/lib/hooks'
import { bookSteps } from './BookRoute'



/** Step 5 — payment. Includes a deliberate failure path (Uber/Airbnb both have one). */
export default function BookPayment() {
  const navigate = useNavigate()
  const toast = useToast()
  const { draft, patchDraft, price, balance, commitBooking } = useApp()

  const [processing, setProcessing] = useState(false)
  const [paidId, setPaidId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [upiApp, setUpiApp] = useState(UPI_APPS[0])
  const [handoff, setHandoff] = useState<null | { url: string; reference: string }>(null)
  const progress = useFakeProgress(2100, processing)

  const walletShort = balance < price.total

  /** Wallet and card settle in-app; UPI hands off to the user's own bank app. */
  const settle = () => setPaidId(commitBooking())

  const leaveForReceipt = () => {
    toast.success('Payment successful', `${inr(price.total)} paid · ${paidId}`)
    navigate('/sender/book/confirmed', { replace: true })
  }

  const pay = async () => {
    // The decline path is deterministic: a wallet payment that exceeds the
    // balance fails, exactly as a real gateway would respond.
    if (draft.paymentMethod === 'wallet' && walletShort) {
      setFailed(true)
      return
    }

    if (draft.paymentMethod === 'upi') {
      const reference = upiReference('parcel', String(Date.now()))
      const req = {
        amount: price.total,
        reference,
        note: `DikkiConnect parcel ${draft.fromCityId.toUpperCase()}-${draft.toCityId.toUpperCase()}`,
      }
      const result = await launchUpi(req, upiApp.id)

      if (result === 'launched') {
        // The UPI app has the payment now. Android gives no trustworthy result
        // back, so we wait for the user to return and tell us.
        setHandoff({ url: buildUpiUrl(req, upiApp.id), reference })
        return
      }
      if (result === 'no-handler') {
        toast.error(`${upiApp.label} isn't installed`, 'Pick another app or pay from your wallet.')
        return
      }
      // Desktop or iOS: no UPI app can be reached from this browser.
      setHandoff({ url: buildUpiUrl(req, 'any'), reference })
      return
    }

    setProcessing(true)
    setTimeout(settle, 2300)
  }

  if (paidId) {
    return (
      <Screen tone="white">
        <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
          <LottieMark name="payment-success" size={148} onComplete={leaveForReceipt} />
          <h2 className="text-display mt-5 text-[22px] font-extrabold text-ink-900">
            Payment successful
          </h2>
          <p className="tabular mt-2 text-[14px] text-ink-500">
            {inr(price.total)} paid · {paidId}
          </p>
        </div>
      </Screen>
    )
  }

  if (processing) {
    return (
      <Screen tone="white">
        <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
          <div className="relative mb-8 grid size-20 place-items-center">
            <span className="anim-ping absolute inset-0 rounded-full bg-brand-500/20" />
            <span className="brand-gradient relative grid size-16 place-items-center rounded-(--radius-xl) shadow-(--shadow-brand)">
              <Lock size={28} className="text-white" />
            </span>
          </div>
          <h2 className="text-display text-[21px] font-extrabold text-ink-900">
            Confirming your payment
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
            Do not close the app or press back. This usually takes a few seconds.
          </p>

          <div className="mt-8 h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-ink-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="tabular mt-3 text-[12px] font-bold text-ink-400">{progress}%</p>

          <div className="mt-10 flex flex-col gap-2.5 text-[12.5px] text-ink-400">
            {['Reserving your hub slot', 'Notifying travelers on this route', 'Generating drop-off OTP'].map(
              (step, i) => (
                <p
                  key={step}
                  className={
                    progress > (i + 1) * 28 ? 'font-semibold text-success-600' : undefined
                  }
                >
                  {progress > (i + 1) * 28 ? '✓ ' : '· '}
                  {step}
                </p>
              ),
            )}
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar back title="Payment" subtitle="Step 5 of 5" />

      <div className="shrink-0 px-5 pb-4">
        <Stepper steps={bookSteps(draft.mode)} current={4} />
      </div>

      <ScreenBody>
        <Card className="mb-5 brand-gradient brand-mesh border-0 text-white">
          <p className="text-[12px] font-semibold text-white/70">Amount payable</p>
          <p className="tabular text-display mt-1 text-[34px] leading-none font-extrabold">
            {inr(price.total)}
          </p>
          <div className="mt-3 border-t border-white/15 pt-3">
            <KeyValue
              label={<span className="text-white/70">Held until receiver OTP is verified</span>}
              value={<span className="text-white">Escrow</span>}
            />
          </div>
        </Card>

        <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Pay using
        </p>

        <div className="flex flex-col gap-2.5">
          <RadioCard
            selected={draft.paymentMethod === 'upi'}
            onSelect={() => patchDraft({ paymentMethod: 'upi' })}
            icon={<Smartphone size={18} />}
            title="UPI"
            subtitle="Google Pay, PhonePe, Paytm, BHIM"
          />

          {draft.paymentMethod === 'upi' && (
            <div className="anim-fade-up -mt-1 mb-1 grid grid-cols-4 gap-2 px-1">
              {UPI_APPS.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setUpiApp(app)}
                  className={`pressable rounded-(--radius-sm) border px-1.5 py-2.5 text-[10.5px] font-bold transition-colors ${
                    upiApp.id === app.id
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-500'
                  }`}
                >
                  {app.label}
                </button>
              ))}
            </div>
          )}

          {draft.paymentMethod === 'upi' && (
            <p className="-mt-1 px-1 text-[11.5px] leading-relaxed text-ink-500">
              {canPayByUpi()
                ? `Opens ${upiApp.label} with the amount filled in. You authorise it there with your own UPI PIN — we never see it.`
                : 'UPI apps only open on Android. On this device you can scan the QR from your phone, or pay from your wallet.'}
            </p>
          )}

          <RadioCard
            selected={draft.paymentMethod === 'wallet'}
            onSelect={() => !walletShort && patchDraft({ paymentMethod: 'wallet' })}
            icon={<WalletIcon size={18} />}
            title="DikkiConnect Wallet"
            subtitle={
              walletShort
                ? `Balance ${inr(balance)} — not enough for this booking`
                : `Balance ${inr(balance)}`
            }
            className={walletShort ? 'opacity-55' : undefined}
          />

          <RadioCard
            selected={draft.paymentMethod === 'card'}
            onSelect={() => patchDraft({ paymentMethod: 'card' })}
            icon={<CreditCard size={18} />}
            title="Card"
            subtitle="HDFC •••• 4412 · Visa"
          />

          <RadioCard
            selected={false}
            onSelect={() => toast.info('Net banking', 'Coming in the next release.')}
            icon={<Landmark size={18} />}
            title="Net banking"
            subtitle="All major Indian banks"
            className="opacity-60"
          />
        </div>

        <Note tone="neutral" icon={<Lock size={15} />} className="mt-5">
          Payments are processed over a PCI-DSS compliant gateway. DikkiConnect never stores your card or
          UPI credentials.
        </Note>

        <Note tone="brand" className="mt-3" title="Cash on delivery">
          Not available in the pilot. COD reconciliation lands with the phase-2 hub settlement
          module.
        </Note>
      </ScreenBody>

      <ActionBar
        helper={
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-semibold text-ink-500">
              {draft.paymentMethod === 'upi'
                ? `Paying via ${upiApp.label}`
                : draft.paymentMethod === 'wallet'
                  ? 'Paying from wallet'
                  : 'Paying by card'}
            </span>
            <span className="tabular text-display text-[22px] font-extrabold text-ink-900">
              {inr(price.total)}
            </span>
          </div>
        }
      >
        <Button block size="lg" onClick={pay} icon={<Lock size={17} />}>
          Pay securely
        </Button>
      </ActionBar>

      {/* UPI handed off. Android returns no verifiable result, so the user
          tells us what happened and the copy is honest about what that means. */}
      <Sheet
        open={handoff !== null}
        onClose={() => setHandoff(null)}
        title={`Finish in ${upiApp.label}`}
        subtitle={`Reference ${handoff?.reference ?? ''}`}
      >
        <div className="flex flex-col gap-4 py-1">
          <div className="flex items-center gap-3.5 rounded-(--radius-md) border border-brand-100 bg-brand-50/60 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-600 text-white">
              <Smartphone size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-ink-900">{inr(price.total)} to DikkiConnect</p>
              <p className="mt-0.5 text-[12px] text-ink-500">
                Approve it in {upiApp.label}, then come back here.
              </p>
            </div>
          </div>

          <a
            href={handoff?.url ?? '#'}
            className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-(--radius-md) border border-ink-200 bg-white text-[13.5px] font-bold text-ink-700"
          >
            Open {upiApp.label} again
          </a>

          <Note tone="warn" title="What we can and cannot see">
            Your bank confirms this payment to you, not to us — a browser cannot be trusted to
            report its own payment. Confirming below records your claim and books the parcel; final
            settlement is reconciled against reference{' '}
            <span className="font-mono font-bold">{handoff?.reference}</span> once the payment
            gateway account is live.
          </Note>

          <Button
            block
            size="lg"
            onClick={() => {
              setHandoff(null)
              setProcessing(true)
              setTimeout(settle, 1400)
            }}
          >
            I&apos;ve paid — book my parcel
          </Button>
          <button
            onClick={() => {
              // Saying the payment did not go through has to surface the failure,
              // not quietly dismiss the sheet. The other trigger — a wallet
              // payment larger than the balance — is unreachable, because the
              // wallet option stops being selectable at exactly the moment it
              // would decline. Without this the decline path had no way in.
              setHandoff(null)
              setFailed(true)
            }}
            className="pressable-sm w-full py-1 text-center text-[13px] font-semibold text-ink-500"
          >
            Payment didn&apos;t go through
          </button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={failed}
        onClose={() => setFailed(false)}
        onConfirm={() => {
          setFailed(false)
          pay()
        }}
        tone="danger"
        icon={<LottieMark name="payment-failed" size={92} />}
        plainIcon
        title="Payment failed"
        body={
          <>
            Your bank declined the transaction. No money was deducted — if you see a debit it will
            reverse within 3 working days.
          </>
        }
        confirmLabel="Try again"
        cancelLabel="Change method"
      />
    </Screen>
  )
}

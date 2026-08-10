import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Landmark, Lock, Smartphone, Wallet as WalletIcon, XCircle } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  ConfirmDialog,
  KeyValue,
  Note,
  RadioCard,
  Stepper,
  useToast,
} from '@/components/ui'
import { inr } from '@/lib/format'
import { useApp } from '@/lib/store'
import { useFakeProgress } from '@/lib/hooks'
import { BOOK_STEPS } from './BookRoute'

const UPI_APPS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM']

/** Step 5 — payment. Includes a deliberate failure path (Uber/Airbnb both have one). */
export default function BookPayment() {
  const navigate = useNavigate()
  const toast = useToast()
  const { draft, patchDraft, price, balance, commitBooking } = useApp()

  const [processing, setProcessing] = useState(false)
  const [failed, setFailed] = useState(false)
  const [upiApp, setUpiApp] = useState(UPI_APPS[0])
  const progress = useFakeProgress(2100, processing)

  const walletShort = balance < price.total

  const pay = () => {
    setProcessing(true)
    setTimeout(() => {
      // The decline path is reachable deterministically — a wallet payment that
      // exceeds the balance fails, exactly as the real gateway would respond.
      // (It used to fire at random, which made bookings unreliable to demo.)
      if (draft.paymentMethod === 'wallet' && walletShort) {
        setProcessing(false)
        setFailed(true)
        return
      }
      const id = commitBooking()
      toast.success('Payment successful', `${inr(price.total)} paid · ${id}`)
      navigate('/sender/book/confirmed', { replace: true })
    }, 2300)
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
        <Stepper steps={BOOK_STEPS} current={4} />
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
                  key={app}
                  onClick={() => setUpiApp(app)}
                  className={`pressable rounded-(--radius-sm) border px-1.5 py-2.5 text-[10.5px] font-bold transition-colors ${
                    upiApp === app
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-500'
                  }`}
                >
                  {app}
                </button>
              ))}
            </div>
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
                ? `Paying via ${upiApp}`
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

      <ConfirmDialog
        open={failed}
        onClose={() => setFailed(false)}
        onConfirm={() => {
          setFailed(false)
          pay()
        }}
        tone="danger"
        icon={<XCircle size={30} />}
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

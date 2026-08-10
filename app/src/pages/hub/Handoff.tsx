import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, RefreshCw, ShieldCheck, Truck } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Button,
  Card,
  CheckMark,
  KeyValue,
  Note,
  OtpDisplay,
  Stars,
  Stepper,
  useToast,
} from '@/components/ui'
import { SuccessBurst, SuccessMark } from '@/components/viz/Illustrations'
import { HUB_HANDLING_FEE, HUB_INVENTORY, TRAVELERS, categoryById, otpFor } from '@/lib/data'
import { ageInHub, inr } from '@/lib/format'
import { useCountdown } from '@/lib/hooks'
import { cn } from '@/lib/cn'

const STEPS = ['Select', 'OTP', 'Released']
const TRAVELER = TRAVELERS[0]

/**
 * Custody checkpoint 2 — hub to traveler. The hub GENERATES the OTP here and
 * the traveler types it into their app.
 */
export default function HubHandoff() {
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>(['DKC-4796', 'DKC-4851'])
  const [releasing, setReleasing] = useState(false)
  const { label, restart, done } = useCountdown(180)

  const available = HUB_INVENTORY.filter((i) => i.state === 'waiting' || i.state === 'assigned')
  const otp = otpFor(selected.join('-') + 'release')

  const toggle = (parcelId: string) =>
    setSelected((prev) =>
      prev.includes(parcelId) ? prev.filter((p) => p !== parcelId) : [...prev, parcelId],
    )

  const release = () => {
    setReleasing(true)
    setTimeout(() => {
      setReleasing(false)
      setStep(2)
      toast.success('Parcels released', `${selected.length} handed to ${TRAVELER.name}`)
    }, 1200)
  }

  /* ── Released ────────────────────────────────────────────────────────── */
  if (step === 2) {
    return (
      <Screen tone="white">
        <ScreenBody className="pt-safe">
          <div className="flex flex-col items-center pt-14 text-center">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="relative grid size-[116px] place-items-center"
            >
              <SuccessBurst />
              <SuccessMark size={82} />
            </motion.div>
            <h1 className="text-display mt-6 text-[24px] font-extrabold text-ink-900">
              Custody transferred
            </h1>
            <p className="mt-2 max-w-[290px] text-[14px] leading-relaxed text-ink-500">
              {selected.length} parcels are now with {TRAVELER.name}. Liability shifted at this
              timestamp.
            </p>
          </div>

          <Card className="mt-8">
            <div className="flex items-center gap-3">
              <Avatar name={TRAVELER.name} size={44} tone={TRAVELER.avatarTone} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold text-ink-900">{TRAVELER.name}</p>
                <p className="tabular mt-0.5 truncate text-[12px] text-ink-500">
                  {TRAVELER.vehicle.model} · {TRAVELER.vehicle.plate}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
                In transit
              </span>
            </div>
            <div className="mt-3.5 border-t border-ink-100 pt-3.5">
              <KeyValue label="Parcels released" value={String(selected.length)} />
              <KeyValue label="Destination" value="Saraswathipuram Hub, Mysore" />
              <KeyValue
                label="Your handling fees"
                value={inr(selected.length * HUB_HANDLING_FEE)}
                strong
                tone="success"
              />
            </div>
          </Card>

          <Note tone="brand" className="mt-3">
            Shelves {available.filter((a) => selected.includes(a.parcelId)).map((a) => a.shelf).join(', ')}{' '}
            are now free. Your capacity has been updated.
          </Note>
        </ScreenBody>

        <ActionBar>
          <Button block size="lg" onClick={() => navigate('/hub')}>
            Back to dashboard
          </Button>
        </ActionBar>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar
        back={step === 0}
        backTo="/hub"
        title="Traveler handoff"
        subtitle={`Step ${step + 1} of 3`}
        action={
          step > 0 ? (
            <button
              onClick={() => setStep(0)}
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
        {/* Traveler card is shown in both steps */}
        <Card className="mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={TRAVELER.name} size={46} tone={TRAVELER.avatarTone} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink-900">{TRAVELER.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
                <Stars value={TRAVELER.rating} size={11} />
                <span className="font-semibold text-ink-700">{TRAVELER.rating.toFixed(1)}</span>
                <span className="text-ink-300">·</span>
                <span className="tabular truncate">{TRAVELER.vehicle.plate}</span>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-bold text-success-700">
              KYC ok
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3 text-[12px] text-ink-500">
            <Truck size={13} className="shrink-0 text-ink-400" />
            Heading to Mysore · boot capacity {TRAVELER.vehicle.bootCapacityKg} kg
          </div>
        </Card>

        {/* ── Select parcels ──────────────────────────────────────────── */}
        {step === 0 && (
          <div className="anim-fade-up">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] font-bold tracking-wide text-ink-400 uppercase">
                Parcels going out
              </p>
              <button
                onClick={() =>
                  setSelected(
                    selected.length === available.length ? [] : available.map((a) => a.parcelId),
                  )
                }
                className="pressable-sm text-[12.5px] font-bold text-brand-600"
              >
                {selected.length === available.length ? 'Clear all' : 'Select all'}
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {available.map((item) => {
                const cat = categoryById('documents')
                const isSelected = selected.includes(item.parcelId)
                return (
                  <button
                    key={item.parcelId}
                    onClick={() => toggle(item.parcelId)}
                    className={cn(
                      'pressable flex w-full items-center gap-3 rounded-(--radius-md) border-2 bg-white p-3.5 text-left transition-all',
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 shadow-(--shadow-brand-sm)'
                        : 'border-ink-200',
                    )}
                  >
                    <CheckMark checked={isSelected} />
                    <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-[11px] font-extrabold text-ink-600">
                      {item.shelf}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="tabular block truncate text-[13.5px] font-bold text-ink-900">
                        {item.parcelId}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">
                        {cat.label} · in hub {ageInHub(item.intakeAt)}
                      </span>
                    </span>
                    <Package size={16} className="shrink-0 text-ink-300" />
                  </button>
                )
              })}
            </div>

            <Note tone="neutral" className="mt-4">
              Only select parcels physically loaded into their vehicle. Each one you release
              transfers liability at this moment.
            </Note>
          </div>
        )}

        {/* ── OTP ─────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="anim-fade-up">
            <h2 className="text-display text-[22px] leading-tight font-extrabold text-ink-900">
              Read this out to the traveler
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
              They type it into their app to take custody of {selected.length} parcel
              {selected.length > 1 ? 's' : ''}.
            </p>

            <Card className="mt-7 border-brand-100 bg-brand-50/60">
              <OtpDisplay code={otp} label="Release OTP" />
              <div className="mt-4 flex items-center justify-center gap-3">
                {done ? (
                  <button
                    onClick={() => {
                      restart(180)
                      toast.info('New code generated', 'The old one is no longer valid.')
                    }}
                    className="pressable-sm inline-flex items-center gap-2 text-[13px] font-bold text-brand-600"
                  >
                    <RefreshCw size={14} />
                    Generate a new code
                  </button>
                ) : (
                  <p className="text-[12.5px] text-ink-500">
                    Expires in <span className="tabular font-bold text-ink-800">{label}</span>
                  </p>
                )}
              </div>
            </Card>

            <Card className="mt-3">
              <p className="mb-2 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
                Releasing
              </p>
              {selected.map((p) => (
                <KeyValue key={p} label={p} value="Loaded" tone="success" />
              ))}
              <div className="my-2 h-px bg-ink-100" />
              <KeyValue
                label="Handling fees earned"
                value={inr(selected.length * HUB_HANDLING_FEE)}
                strong
                tone="success"
              />
            </Card>

            <Note tone="warn" icon={<ShieldCheck size={15} />} className="mt-3">
              Only tap confirm after they show you a successful verification on their screen.
            </Note>
          </div>
        )}
      </ScreenBody>

      <ActionBar
        helper={
          step === 0 ? (
            <p className="text-[12px] font-semibold text-ink-500">
              {selected.length} of {available.length} selected ·{' '}
              {inr(selected.length * HUB_HANDLING_FEE)} in fees
            </p>
          ) : undefined
        }
      >
        {step === 0 ? (
          <Button block size="lg" disabled={selected.length === 0} onClick={() => setStep(1)}>
            Generate release OTP
          </Button>
        ) : (
          <Button block size="lg" loading={releasing} onClick={release}>
            {releasing ? 'Releasing…' : 'They entered it — confirm'}
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}

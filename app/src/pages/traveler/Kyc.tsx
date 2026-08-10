import { useState } from 'react'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileCheck,
  Fingerprint,
  Landmark,
  Lock,
  Package,
  ScanFace,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { Badge, Card, Note, ProgressBar, Sheet, Button, useToast } from '@/components/ui'
import { KYC_STEPS } from '@/lib/data'
import type { KycStep, KycStepId } from '@/lib/types'
import { cn } from '@/lib/cn'

const ICONS: Record<KycStepId, typeof Fingerprint> = {
  mobile: Fingerprint,
  aadhaar: FileCheck,
  selfie: ScanFace,
  license: CreditCard,
  rc: Landmark,
  bank: Landmark,
  police: ShieldCheck,
}

const STATUS_META = {
  verified: { label: 'Verified', tone: 'success' as const },
  pending: { label: 'In review', tone: 'warn' as const },
  action_required: { label: 'Action needed', tone: 'danger' as const },
  locked: { label: 'Not started', tone: 'neutral' as const },
}

/**
 * The KYC ladder from PRD §7. Two tiers: Aadhaar + selfie unlocks parcels
 * quickly; licence + RC gates passenger carrying.
 */
export default function TravelerKyc() {
  const toast = useToast()
  const [active, setActive] = useState<KycStep | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const parcelSteps = KYC_STEPS.filter((s) => s.unlocks === 'parcel_only')
  const passengerSteps = KYC_STEPS.filter((s) => s.unlocks === 'passenger_ready')
  const payoutSteps = KYC_STEPS.filter((s) => s.unlocks === 'payouts')

  const doneCount = KYC_STEPS.filter((s) => s.status === 'verified').length
  const parcelReady = parcelSteps.every((s) => s.status === 'verified')
  const passengerReady = passengerSteps
    .filter((s) => !s.optional)
    .every((s) => s.status === 'verified')

  const submit = () => {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setActive(null)
      toast.success('Submitted for verification', 'Most checks clear within 4 hours.')
    }, 1400)
  }

  const Section = ({ title, subtitle, steps }: { title: string; subtitle: string; steps: KycStep[] }) => (
    <div className="mt-6">
      <p className="text-[12px] font-bold tracking-wide text-ink-400 uppercase">{title}</p>
      <p className="mt-1 mb-3 text-[12.5px] text-ink-500">{subtitle}</p>
      <div className="flex flex-col gap-2.5">
        {steps.map((s) => {
          const Icon = ICONS[s.id]
          const meta = STATUS_META[s.status]
          return (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className="pressable flex w-full items-center gap-3.5 rounded-(--radius-lg) border border-ink-100 bg-white p-4 text-left shadow-(--shadow-e1)"
            >
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-(--radius-sm)',
                  s.status === 'verified'
                    ? 'bg-success-50 text-success-600'
                    : s.status === 'action_required'
                      ? 'bg-danger-50 text-danger-600'
                      : s.status === 'pending'
                        ? 'bg-warn-50 text-warn-600'
                        : 'bg-ink-100 text-ink-400',
                )}
              >
                {s.status === 'verified' ? <CheckCircle2 size={19} /> : <Icon size={19} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-bold text-ink-900">{s.label}</span>
                  {s.optional && (
                    <span className="shrink-0 text-[10.5px] font-semibold text-ink-400">
                      Optional
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-ink-500">{s.detail}</span>
              </span>
              <Badge tone={meta.tone} size="sm">
                {meta.label}
              </Badge>
              <ChevronRight size={16} className="shrink-0 text-ink-300" />
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <Screen>
      <TopBar back title="Verification" subtitle={`${doneCount} of ${KYC_STEPS.length} complete`} />

      <ScreenBody>
        {/* Tier cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card
            className={cn(
              'border-2',
              parcelReady ? 'border-success-500 bg-success-50' : 'border-ink-200',
            )}
          >
            <span
              className={cn(
                'grid size-9 place-items-center rounded-(--radius-sm)',
                parcelReady ? 'bg-success-500 text-white' : 'bg-ink-100 text-ink-400',
              )}
            >
              <Package size={18} />
            </span>
            <p className="mt-2.5 text-[13.5px] font-bold text-ink-900">Carry parcels</p>
            <p className="mt-0.5 text-[11.5px] text-ink-500">
              {parcelReady ? 'Unlocked' : 'Aadhaar + selfie needed'}
            </p>
          </Card>

          <Card
            className={cn(
              'border-2',
              passengerReady ? 'border-success-500 bg-success-50' : 'border-ink-200',
            )}
          >
            <span
              className={cn(
                'grid size-9 place-items-center rounded-(--radius-sm)',
                passengerReady ? 'bg-success-500 text-white' : 'bg-ink-100 text-ink-400',
              )}
            >
              {passengerReady ? <Users size={18} /> : <Lock size={17} />}
            </span>
            <p className="mt-2.5 text-[13.5px] font-bold text-ink-900">Carry passengers</p>
            <p className="mt-0.5 text-[11.5px] text-ink-500">
              {passengerReady ? 'Unlocked' : 'Licence + RC needed'}
            </p>
          </Card>
        </div>

        <Card className="mt-3">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-ink-600">Verification progress</p>
            <p className="tabular text-[13px] font-extrabold text-brand-700">
              {Math.round((doneCount / KYC_STEPS.length) * 100)}%
            </p>
          </div>
          <ProgressBar value={(doneCount / KYC_STEPS.length) * 100} />
        </Card>

        <Section
          title="Tier 1 · Parcels"
          subtitle="Fast onboarding — these three unlock parcel jobs."
          steps={parcelSteps}
        />
        <Section
          title="Tier 2 · Passengers"
          subtitle="Extra checks required before you can carry people."
          steps={passengerSteps}
        />
        <Section
          title="Payouts"
          subtitle="Needed before money can leave your DikkiConnect wallet."
          steps={payoutSteps}
        />

        <Note tone="neutral" icon={<Lock size={15} />} className="mt-6" title="How we handle Aadhaar">
          DikkiConnect never stores your Aadhaar number. Verification runs through a UIDAI-licensed KUA
          partner and we keep only their verification token and a masked reference — as required by
          UIDAI regulations.
        </Note>
      </ScreenBody>

      {/* Step detail */}
      <Sheet
        open={active !== null}
        onClose={() => setActive(null)}
        title={active?.label}
        subtitle={active?.detail}
        footer={
          active?.status === 'verified' ? (
            <Button block size="lg" variant="outline" onClick={() => setActive(null)}>
              Close
            </Button>
          ) : (
            <Button block size="lg" loading={submitting} onClick={submit}>
              {active?.status === 'pending' ? 'Check status' : 'Start verification'}
            </Button>
          )
        }
      >
        {active && (
          <>
            <div
              className={cn(
                'mb-4 flex items-center gap-3 rounded-(--radius-md) p-4',
                active.status === 'verified'
                  ? 'bg-success-50 text-success-700'
                  : active.status === 'action_required'
                    ? 'bg-danger-50 text-danger-700'
                    : active.status === 'pending'
                      ? 'bg-warn-50 text-warn-700'
                      : 'bg-ink-100 text-ink-600',
              )}
            >
              {active.status === 'verified' ? (
                <CheckCircle2 size={20} className="shrink-0" />
              ) : (
                <AlertCircle size={20} className="shrink-0" />
              )}
              <p className="text-[13px] font-bold">
                {active.status === 'verified'
                  ? 'Verified and up to date'
                  : active.status === 'pending'
                    ? 'Submitted — under review, usually under 4 hours'
                    : active.status === 'action_required'
                      ? 'The document we received was unreadable. Please re-upload.'
                      : 'Not started yet'}
              </p>
            </div>

            {active.id === 'selfie' && active.status !== 'verified' && (
              <div className="mb-4 grid place-items-center rounded-(--radius-lg) bg-ink-950 py-10">
                <span className="grid size-24 place-items-center rounded-full ring-4 ring-white/25">
                  <Camera size={30} className="text-white/70" />
                </span>
                <p className="mt-3 text-[12px] text-white/60">Centre your face in the circle</p>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {[
                'Your data is encrypted in transit and at rest',
                'Only masked references are stored on our servers',
                'You can request deletion any time from Settings',
              ].map((line) => (
                <p key={line} className="flex items-start gap-2.5 text-[12.5px] text-ink-600">
                  <ShieldCheck size={14} className="mt-px shrink-0 text-success-500" />
                  {line}
                </p>
              ))}
            </div>
          </>
        )}
      </Sheet>
    </Screen>
  )
}

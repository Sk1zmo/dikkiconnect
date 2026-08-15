import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Info, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  Checkbox,
  Counter,
  Field,
  Note,
  Sheet,
  Stepper,
  Switch,
  TextArea,
} from '@/components/ui'
import { DECLARED_VALUE_CAP, PARCEL_CATEGORIES, PARCEL_SIZES, PROHIBITED_ITEMS } from '@/lib/data'
import { inr, kg } from '@/lib/format'
import { useApp } from '@/lib/store'
import { cn } from '@/lib/cn'
import { BOOK_STEPS } from './BookRoute'

/** Step 2 — what is in the box. Enforces the PRD's declared-value cap. */
export default function BookParcel() {
  const navigate = useNavigate()
  const { draft, patchDraft } = useApp()
  const [prohibitedOpen, setProhibitedOpen] = useState(false)

  const size = PARCEL_SIZES.find((s) => s.id === draft.size)!
  const overCap = draft.declaredValue > DECLARED_VALUE_CAP
  const overWeight = draft.weightKg > size.maxKg
  const canContinue = draft.acceptedProhibited && !overCap && !overWeight

  return (
    <Screen>
      <TopBar back title="Parcel details" subtitle="Step 2 of 5" />

      <div className="shrink-0 px-5 pb-4">
        <Stepper steps={BOOK_STEPS} current={1} />
      </div>

      <ScreenBody>
        {/* Category */}
        <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          What are you sending?
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          {PARCEL_CATEGORIES.map((c) => {
            const active = draft.category === c.id
            return (
              <button
                key={c.id}
                onClick={() => patchDraft({ category: c.id })}
                className={cn(
                  'pressable flex flex-col items-center gap-1.5 rounded-(--radius-md) border-2 bg-white px-1.5 py-3 transition-all duration-200',
                  active
                    ? 'border-brand-600 bg-brand-50/60 shadow-(--shadow-brand-sm)'
                    : 'border-ink-200 hover:border-ink-300',
                )}
              >
                <span className="text-[20px] leading-none">{c.emoji}</span>
                <span
                  className={cn(
                    'text-center text-[10px] leading-tight font-bold',
                    active ? 'text-brand-700' : 'text-ink-600',
                  )}
                >
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11.5px] text-ink-400">
          {PARCEL_CATEGORIES.find((c) => c.id === draft.category)?.hint}
        </p>

        {/* Size */}
        <p className="mt-6 mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Parcel size
        </p>
        <div className="flex flex-col gap-2.5">
          {PARCEL_SIZES.map((s) => {
            const active = draft.size === s.id
            return (
              <button
                key={s.id}
                onClick={() =>
                  patchDraft({ size: s.id, weightKg: Math.min(draft.weightKg, s.maxKg) })
                }
                className={cn(
                  'pressable flex items-center gap-3.5 rounded-(--radius-md) border-2 bg-white p-3.5 text-left transition-all duration-200',
                  active
                    ? 'border-brand-600 bg-brand-50/50 shadow-(--shadow-brand-sm)'
                    : 'border-ink-200 hover:border-ink-300',
                )}
              >
                <span className="text-[24px]">{s.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-ink-900">
                    {s.label} · up to {s.maxKg} kg
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink-500">{s.dims}</span>
                </span>
                <span
                  className={cn(
                    'tabular shrink-0 text-[13px] font-extrabold',
                    active ? 'text-brand-700' : 'text-ink-400',
                  )}
                >
                  from {inr(s.base)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Weight */}
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              Approximate weight
            </p>
            <span className="text-[11.5px] font-semibold text-ink-500">
              Max {size.maxKg} kg for {size.label}
            </span>
          </div>
          <Counter
            value={draft.weightKg}
            onChange={(v) => patchDraft({ weightKg: v })}
            min={0.1}
            max={20}
            step={0.5}
            decimals={1}
            suffix="kg"
          />
          {overWeight && (
            <Note tone="danger" icon={<AlertTriangle size={15} />} className="mt-2.5">
              {kg(draft.weightKg)} exceeds the {size.label} limit. Pick a larger size or reduce the
              weight.
            </Note>
          )}
          <p className="mt-2 text-[11.5px] text-ink-400">
            The hub weighs it at intake. If it differs, we adjust the fare before dispatch.
          </p>
        </div>

        {/* Declared value */}
        <div className="mt-6">
          <Field
            label="Declared value"
            type="number"
            inputMode="numeric"
            value={draft.declaredValue}
            onChange={(e) => patchDraft({ declaredValue: Number(e.target.value || 0) })}
            prefix={<span className="text-[15px] font-bold text-ink-600">₹</span>}
            error={overCap ? `MVP cap is ${inr(DECLARED_VALUE_CAP)} per parcel` : undefined}
            hint={
              overCap
                ? undefined
                : `Used for claims. Capped at ${inr(DECLARED_VALUE_CAP)} while we build insurance partnerships.`
            }
          />
        </div>

        {/* Handling */}
        <Card className="mt-2 flex flex-col gap-4">
          <Switch
            checked={draft.fragile}
            onChange={(v) => patchDraft({ fragile: v })}
            label="Fragile — handle with care"
            description="Adds ₹29. The traveler and both hubs are told to keep it upright."
          />
          <div className="h-px bg-ink-100" />
          <Switch
            checked={draft.insured}
            onChange={(v) => patchDraft({ insured: v })}
            label="DikkiConnect Protect"
            description={`₹25 · covers up to ${inr(DECLARED_VALUE_CAP)} against loss or damage in transit.`}
          />
        </Card>

        {/* Receiver */}
        <p className="mt-6 mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Who is collecting it?
        </p>
        <Field
          label="Receiver name"
          placeholder="e.g. Rohit Sharma"
          value={draft.receiverName}
          onChange={(e) => patchDraft({ receiverName: e.target.value })}
        />
        <Field
          label="Receiver mobile"
          type="tel"
          inputMode="numeric"
          placeholder="98450 12345"
          maxLength={11}
          value={draft.receiverPhone}
          onChange={(e) => patchDraft({ receiverPhone: e.target.value.replace(/[^\d ]/g, '') })}
          prefix={<span className="text-[15px] font-bold text-ink-600">+91</span>}
          hint="Their pickup OTP goes to this number once the parcel reaches the destination hub."
        />

        <TextArea
          label="Notes for the hub"
          optional
          placeholder="e.g. Keep upright, do not stack"
          value={draft.notes}
          onChange={(e) => patchDraft({ notes: e.target.value })}
        />

        {/* Prohibited items declaration */}
        <Card className="mt-5 border-warn-100 bg-warn-50/60">
          <Checkbox
            checked={draft.acceptedProhibited}
            onChange={(v) => patchDraft({ acceptedProhibited: v })}
          >
            I confirm this parcel contains no prohibited items and that the declared value is
            accurate.
          </Checkbox>
          <button
            onClick={() => setProhibitedOpen(true)}
            className="pressable-sm mt-2.5 ml-[34px] text-[12.5px] font-bold text-brand-700 underline underline-offset-2"
          >
            See the prohibited items list
          </button>
        </Card>
      </ScreenBody>

      <ActionBar
        helper={
          !canContinue ? (
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500">
              <Info size={13} />
              {overCap
                ? 'Reduce the declared value to continue'
                : overWeight
                  ? 'Fix the weight to continue'
                  : 'Accept the declaration to continue'}
            </p>
          ) : undefined
        }
      >
        <Button
          block
          size="lg"
          disabled={!canContinue}
          onClick={() => navigate('/sender/book/hub')}
          iconRight={<ArrowRight size={18} />}
        >
          {draft.mode === 'p2p' ? 'Pickup & drop' : 'Choose hubs'}
        </Button>
      </ActionBar>

      <Sheet
        open={prohibitedOpen}
        onClose={() => setProhibitedOpen(false)}
        title="Prohibited items"
        subtitle="Sending any of these voids protection and may result in account suspension."
      >
        <div className="flex flex-col gap-2.5">
          {PROHIBITED_ITEMS.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-(--radius-md) bg-danger-50 p-3.5"
            >
              <ShieldAlert size={17} className="mt-px shrink-0 text-danger-500" />
              <p className="text-[13.5px] font-medium text-danger-800">{item}</p>
            </div>
          ))}
        </div>
        <Note tone="success" icon={<ShieldCheck size={15} />} className="mt-4">
          Every parcel is photographed at intake and at each handoff, so disputes have evidence on
          both sides.
        </Note>
      </Sheet>
    </Screen>
  )
}

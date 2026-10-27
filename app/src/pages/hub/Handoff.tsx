import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ShieldCheck, Truck } from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Badge,
  Button,
  Card,
  CheckMark,
  KeyValue,
  Note,
  OtpDisplay,
  Stepper,
  useToast,
} from '@/components/ui'
import { LottieMark } from '@/components/brand/LottieMark'
import { HUB_HANDLING_FEE, categoryById } from '@/lib/data'
import { ageInHub, inr } from '@/lib/format'
import { useApp, useHubInventory } from '@/lib/store'
import { useReleaseCodes } from '@/lib/custody'
import { parcels as parcelsApi } from '@/lib/api'
import { cn } from '@/lib/cn'
import { holdEndingSoon } from '@/lib/scarcity'

const STEPS = ['Select', 'OTP', 'Released']

/**
 * Custody checkpoint 2 — hub to traveler. The hub GENERATES the OTP here and
 * the traveler types it into their app.
 */
export default function HubHandoff() {
  const navigate = useNavigate()
  const toast = useToast()

  const { adoptParcel } = useApp()

  // Only parcels physically on the shelf here, claimed by a driver, can be
  // released — the same list the inventory screen shows.
  const inventory = useHubInventory()
  const available = inventory.map((p) => ({
    parcelId: p.id,
    shelf: `A-0${(p.id.charCodeAt(p.id.length - 1) % 9) + 1}`,
    intakeAt: p.timeline.find((e) => e.status === 'at_origin_hub')?.at ?? p.bookedAt,
    category: p.category,
    claimed: Boolean(p.travelerId),
    travelerName: p.travelerName,
  }))

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>(() =>
    inventory.filter((p) => p.travelerId).map((p) => p.id),
  )
  const [releasing, setReleasing] = useState(false)

  // Each parcel on the shelf may have been claimed by a different real
  // traveller — this is their names, not a stand-in for "the" driver.
  const selectedTravelerNames = [
    ...new Set(
      available
        .filter((a) => selected.includes(a.parcelId) && a.travelerName)
        .map((a) => a.travelerName as string),
    ),
  ]
  const travelerLabel =
    selectedTravelerNames.length === 0
      ? 'Unclaimed'
      : selectedTravelerNames.length === 1
        ? selectedTravelerNames[0]
        : `${selectedTravelerNames.length} drivers`

  /* Each parcel carries its own code, issued by the server, which is also the
     only place that can check it. Deriving them here — as this screen used to
     — meant the code was computable by whoever already had the parcel, and the
     traveller's app was checking a number against a number it had worked out
     for itself. Now the hub reads out what the server will accept, and nothing
     on either device can decide the answer. */
  const { codes, loading: codesLoading, error: codesError } = useReleaseCodes(
    selected,
    'handoff',
    step === 1,
  )
  const otp = codes[0]?.code ?? '——————'

  const toggle = (parcelId: string) =>
    setSelected((prev) =>
      prev.includes(parcelId) ? prev.filter((p) => p !== parcelId) : [...prev, parcelId],
    )

  /* The hub does not move the parcel — the traveller's app does, by passing
     the checkpoint with this code. So this button asks the server what
     actually happened rather than asserting it. A hub that marked parcels
     released on its own word would show "in transit" for a boot that drove
     off without ever confirming. */
  const release = async () => {
    setReleasing(true)
    try {
      const results = await Promise.all(
        selected.map((id) =>
          parcelsApi
            .one(id)
            .then((r) => r.parcel)
            .catch(() => null),
        ),
      )
      const moved = results.filter((p) => p && p.status === 'in_transit')
      moved.forEach((p) => p && adoptParcel(p))

      if (moved.length === 0) {
        toast.error(
          'Not confirmed yet',
          'Their app has not taken custody. Ask them to enter the code and try again.',
        )
        return
      }
      if (moved.length < selected.length) {
        toast.info(
          `${moved.length} of ${selected.length} confirmed`,
          'The rest are still waiting on the traveller’s app.',
        )
      } else {
        toast.success('Parcels released', `${moved.length} handed to ${travelerLabel}`)
      }
      setStep(2)
    } finally {
      setReleasing(false)
    }
  }

  /* ── Released ────────────────────────────────────────────────────────── */
  if (step === 2) {
    return (
      <Screen tone="white">
        <ScreenBody className="pt-safe">
          <div className="flex flex-col items-center pt-14 text-center">
            <LottieMark name="parcel-delivered" size={128} />
            <h1 className="text-display mt-6 text-[24px] font-extrabold text-ink-900">
              Custody transferred
            </h1>
            <p className="mt-2 max-w-[290px] text-[14px] leading-relaxed text-ink-500">
              {selected.length} parcels are now with {travelerLabel}. Liability shifted at this
              timestamp.
            </p>
          </div>

          <Card className="mt-8">
            <div className="flex items-center gap-3">
              <Avatar name={travelerLabel} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold text-ink-900">{travelerLabel}</p>
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
            <Avatar name={travelerLabel} size={46} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink-900">{travelerLabel}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3 text-[12px] text-ink-500">
            <Truck size={13} className="shrink-0 text-ink-400" />
            Selected parcels only move to whoever actually claimed them.
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
                className="pressable-sm -mr-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-bold text-brand-600 hover:bg-brand-50"
              >
                {selected.length === available.length ? 'Clear all' : 'Select all'}
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {available.length === 0 && (
                <Note tone="neutral">
                  Nothing on the shelf is ready to go out. Parcels appear here once they have been
                  taken in and a driver has claimed them.
                </Note>
              )}
              {/* ═══════════════════════════════════════════════════════════════
                  This list is tapped standing up, one-handed, with a traveler
                  waiting and a boot open. Three things changed for that:

                  · Rows are taller and padded harder. A mis-tap here deselects
                    a parcel that is already in the car.
                  · Selection is a 2px brand edge rather than a 2px border plus
                    a coloured shadow. The shadow was doing the work of saying
                    "this one" at a glance, but it also made selected rows sit
                    on a different plane to the rest of the card stack; a solid
                    edge reads faster and stays flat.
                  · The 24-hour mark gets the one yellow on the screen, and only
                    in the window before it passes. Once a parcel is genuinely
                    over, Inventory's warn treatment owns it — yellow here is
                    "load this one first", not "this is a problem".
                  ═══════════════════════════════════════════════════════════════ */}
              {available.map((item) => {
                const cat = categoryById(item.category)
                const isSelected = selected.includes(item.parcelId)
                const nearingHoldLimit =
                  holdEndingSoon(item.intakeAt)
                return (
                  <button
                    key={item.parcelId}
                    onClick={() => toggle(item.parcelId)}
                    className={cn(
                      'pressable flex min-h-[68px] w-full items-center gap-3.5 rounded-(--radius-md) border bg-white p-4 text-left transition-colors',
                      isSelected
                        ? 'border-transparent bg-brand-50/60 ring-2 ring-brand-600'
                        : 'border-ink-200 hover:bg-ink-50',
                    )}
                  >
                    <CheckMark checked={isSelected} />
                    <span className="tabular grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-[12px] font-extrabold text-ink-600">
                      {item.shelf}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="tabular block truncate text-[14.5px] font-extrabold tracking-title text-ink-900">
                        {item.parcelId}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] font-semibold text-ink-500">
                        {cat.label} · in hub {ageInHub(item.intakeAt)}
                        {item.claimed ? ' · driver assigned' : ' · awaiting a driver'}
                      </span>
                    </span>
                    {nearingHoldLimit ? (
                      <Badge tone="signal" size="sm">
                        Hold ends soon
                      </Badge>
                    ) : (
                      <Package size={16} className="shrink-0 text-ink-300" />
                    )}
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
              They type it into their app to take custody. Each parcel has its own code, so a wrong
              one is rejected against that specific parcel.
            </p>

            <Card className="mt-7 border-brand-100 bg-brand-50/60">
              <OtpDisplay code={codesLoading ? '——————' : otp} label="Release OTP" />
              <div className="mt-4 text-center">
                {codesError ? (
                  <p className="text-[12.5px] font-semibold text-danger-600">{codesError}</p>
                ) : codesLoading ? (
                  <p className="text-[12.5px] font-semibold text-ink-500">Asking the server…</p>
                ) : (
                  /* The old version counted down from three minutes and offered
                     to "generate a new code", which regenerated nothing — the
                     code was derived from the parcel id and was the same every
                     time. The server's code lasts thirty minutes and is spent
                     on use, so that is what this says. */
                  <p className="text-[12.5px] leading-relaxed font-semibold text-ink-500">
                    Valid for 30 minutes, and only once. It stops working the moment they use it.
                  </p>
                )}
              </div>
            </Card>

            {codes.length > 1 && (
              <Card className="mt-3">
                <p className="mb-2.5 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
                  Code per parcel
                </p>
                <div className="flex flex-col gap-1.5">
                  {codes.map((c) => (
                    <div
                      key={c.id}
                      className="flex min-h-[34px] items-center justify-between gap-3"
                    >
                      <span className="tabular text-[12.5px] font-semibold text-ink-500">
                        {c.id}
                      </span>
                      <span className="tabular text-[17px] font-extrabold tracking-[0.1em] text-brand-700">
                        {c.code}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

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
              <span className="tabular text-[15px] font-extrabold tracking-title text-ink-900">
                {selected.length}
              </span>{' '}
              of {available.length} selected ·{' '}
              <span className="tabular font-extrabold text-ink-900">
                {inr(selected.length * HUB_HANDLING_FEE)}
              </span>{' '}
              in fees
            </p>
          ) : undefined
        }
      >
        {step === 0 ? (
          <Button block size="lg" disabled={selected.length === 0} onClick={() => setStep(1)}>
            Generate release OTP
          </Button>
        ) : (
          <Button block size="lg" loading={releasing} onClick={() => void release()}>
            {releasing ? 'Releasing…' : 'They entered it — confirm'}
          </Button>
        )}
      </ActionBar>
    </Screen>
  )
}

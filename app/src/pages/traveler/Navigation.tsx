import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ChevronUp,
  CornerUpRight,
  Package,
  Phone,
  ShieldAlert,
  Volume2,
  X,
} from 'lucide-react'
import { Screen } from '@/components/layout/Screen'
import { Badge, Button, IconButton, Sheet, useToast } from '@/components/ui'
import { LiveMap } from '@/components/viz/Map'
import { categoryById, hubShort, jobFromParcel } from '@/lib/data'
import { inr, kg } from '@/lib/format'
import { useCountdown } from '@/lib/hooks'
import { useManifest, useMe } from '@/lib/store'
import { CategoryIcon } from '@/components/domain/CategoryIcon'

const STEPS = [
  { in: '400 m', instruction: 'Turn right onto Hosur Road', icon: CornerUpRight },
  { in: '2.1 km', instruction: 'Merge onto NICE Ring Road', icon: ArrowUpRight },
  { in: '18 km', instruction: 'Continue on NH275 toward Mysore', icon: ChevronUp },
]

/** Turn-by-turn navigation with the parcel manifest docked at the bottom. */
export default function TravelerNavigation() {
  const navigate = useNavigate()
  const toast = useToast()
  const [manifestOpen, setManifestOpen] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  const { label } = useCountdown(3 * 3600 + 12 * 60)

  // Exactly what is in this driver's boot right now — nothing more.
  const me = useMe()
  const manifest = useManifest(me.id).map(jobFromParcel)
  const step = STEPS[0]
  const StepIcon = step.icon

  return (
    <Screen tone="dark">
      <div className="relative flex-1 overflow-hidden">
        <LiveMap portrait height="100%" dark className="absolute inset-0" />

        {/* Next manoeuvre */}
        <div className="pt-safe-3 absolute inset-x-0 top-0 z-30 px-4">
          <div className="flex items-center gap-3.5 rounded-(--radius-lg) bg-brand-700/95 p-4 text-white shadow-(--shadow-e4) backdrop-blur-lg">
            <span className="grid size-12 shrink-0 place-items-center rounded-(--radius-md) bg-white/20">
              <StepIcon size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="tabular text-display text-[24px] leading-none font-extrabold">
                {step.in}
              </p>
              <p className="mt-1 truncate text-[13.5px] text-white/85">{step.instruction}</p>
            </div>
            <IconButton
              icon={<Volume2 size={17} />}
              label="Mute voice guidance"
              tone="onBrand"
              size={38}
            />
          </div>

          {/* Upcoming steps */}
          <div className="mt-2 space-y-1.5">
            {STEPS.slice(1).map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.instruction}
                  className="glass-dark flex items-center gap-3 rounded-(--radius-md) px-3.5 py-2.5 text-white/85 ring-1 ring-white/10"
                >
                  <Icon size={16} className="shrink-0 opacity-75" />
                  <span className="tabular shrink-0 text-[12.5px] font-bold">{s.in}</span>
                  <span className="truncate text-[12.5px] opacity-80">{s.instruction}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Side controls */}
        <div className="absolute top-1/2 right-4 z-30 flex -translate-y-1/2 flex-col gap-2.5">
          <IconButton
            icon={<ShieldAlert size={18} />}
            label="Emergency SOS"
            className="bg-danger-600 text-white shadow-lg"
            onClick={() => setSosOpen(true)}
          />
          <IconButton icon={<Phone size={18} />} label="Call support" tone="glass" />
        </div>

        {/* Bottom dock */}
        <div className="pb-safe-4 absolute inset-x-0 bottom-0 z-30 px-4">
          <div className="rounded-(--radius-xl) bg-white p-4 shadow-(--shadow-e4)">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="tabular text-display text-[24px] leading-none font-extrabold text-ink-900">
                  {label}
                </p>
                <p className="mt-1 truncate text-[12.5px] text-ink-500">
                  145 km to {hubShort('hub-mys-sar')} · arriving 6:15 PM
                </p>
              </div>
              <IconButton
                icon={<X size={18} />}
                label="End navigation"
                onClick={() => navigate('/traveler')}
              />
            </div>

            <button
              onClick={() => setManifestOpen(true)}
              className="pressable mt-3.5 flex w-full items-center gap-3 rounded-(--radius-md) bg-ink-50 p-3 text-left"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-600 text-white">
                <Package size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-ink-900">
                  {manifest.length} parcels on board
                </span>
                <span className="block truncate text-[11.5px] text-ink-500">
                  {inr(manifest.reduce((s, j) => s + j.payout, 0))} in payouts pending
                </span>
              </span>
              <ChevronUp size={17} className="shrink-0 text-ink-400" />
            </button>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={() => navigate('/traveler/scan')}>
                Scan at hub
              </Button>
              <Button onClick={() => navigate('/traveler/handoff/dropoff')}>Arrived</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Manifest */}
      <Sheet
        open={manifestOpen}
        onClose={() => setManifestOpen(false)}
        title="Your manifest"
        subtitle={`${manifest.length} parcels in your custody right now`}
      >
        <div className="flex flex-col gap-2.5">
          {manifest.map((j) => {
            const cat = categoryById(j.category)
            return (
              <div
                key={j.id}
                className="flex items-center gap-3 rounded-(--radius-md) border border-ink-100 bg-white p-3.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-ink-700">
                  <CategoryIcon id={cat.id} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="tabular truncate text-[13.5px] font-bold text-ink-900">
                    {j.parcelId}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
                    {cat.label} · {kg(j.weightKg)} → {j.toLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular text-[13.5px] font-extrabold text-success-600">
                    +{inr(j.payout)}
                  </p>
                  {j.fragile && (
                    <Badge tone="warn" size="sm" className="mt-1">
                      Fragile
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <Button
          block
          className="mt-4"
          variant="outline"
          onClick={() => {
            setManifestOpen(false)
            navigate('/traveler/scan')
          }}
        >
          Scan next parcel
        </Button>
      </Sheet>

      {/* SOS */}
      <Sheet
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        title="Emergency"
        subtitle="Choose what you need. Your live location is attached automatically."
      >
        <div className="flex flex-col gap-2.5">
          {[
            { label: 'Call emergency services (112)', tone: 'danger' as const },
            { label: 'Call DikkiConnect safety desk', tone: 'brand' as const },
            { label: 'Share live trip with emergency contact', tone: 'neutral' as const },
            { label: 'Report an accident or breakdown', tone: 'neutral' as const },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => {
                setSosOpen(false)
                toast.info('Safety desk notified', 'A DikkiConnect agent will call you within 60 seconds.')
              }}
              className={`pressable rounded-(--radius-md) p-4 text-left text-[14px] font-bold ${
                a.tone === 'danger'
                  ? 'bg-danger-600 text-white'
                  : a.tone === 'brand'
                    ? 'bg-brand-600 text-white'
                    : 'border border-ink-200 bg-white text-ink-800'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Keyboard, Package, X } from 'lucide-react'
import { Screen } from '@/components/layout/Screen'
import { Button, Field, IconButton, Segmented, Sheet, useToast } from '@/components/ui'
import { ScannerViewfinder } from '@/components/viz/Scanner'
import { PARCEL_JOBS, categoryById } from '@/lib/data'
import { kg } from '@/lib/format'

type Mode = 'pickup' | 'dropoff'

/**
 * Traveler scanner. Scanning identifies the parcel; the OTP screen that
 * follows is what actually moves custody.
 */
export default function TravelerScan() {
  const navigate = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('pickup')
  const [detected, setDetected] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualId, setManualId] = useState('')

  const job = PARCEL_JOBS[1]
  const cat = categoryById(job.category)

  const onDetect = () => {
    setDetected(true)
    toast.success('Parcel identified', job.parcelId)
  }

  return (
    <Screen tone="dark">
      {/* Header over the camera */}
      <div className="pt-safe-3 absolute inset-x-0 top-0 z-30 px-5">
        <div className="flex items-center justify-between">
          <IconButton
            icon={<X size={19} />}
            label="Close scanner"
            tone="onBrand"
            onClick={() => navigate('/traveler')}
          />
          <p className="text-[15px] font-bold text-white">Scan parcel</p>
          <IconButton
            icon={<Keyboard size={17} />}
            label="Enter code manually"
            tone="onBrand"
            onClick={() => setManualOpen(true)}
          />
        </div>
        <div className="mt-4">
          <Segmented
            value={mode}
            onChange={(v) => {
              setMode(v)
              setDetected(false)
            }}
            options={[
              { value: 'pickup', label: 'Hub pickup' },
              { value: 'dropoff', label: 'Hub drop-off' },
            ]}
          />
        </div>
      </div>

      <ScannerViewfinder
        key={mode}
        hint={
          mode === 'pickup'
            ? 'Scan the parcel QR at the origin hub counter'
            : 'Scan the parcel QR to hand it over at the destination hub'
        }
        onDetect={onDetect}
        autoDetectMs={3000}
      />

      {/* Detected sheet */}
      <Sheet
        open={detected}
        onClose={() => setDetected(false)}
        title="Parcel identified"
        subtitle={`Confirm this is the parcel you are ${mode === 'pickup' ? 'collecting' : 'dropping'}`}
        footer={
          <Button
            block
            size="lg"
            onClick={() => navigate(`/traveler/handoff/${mode}`)}
            icon={<CheckCircle2 size={18} />}
          >
            Continue to OTP
          </Button>
        }
      >
        <div className="flex items-center gap-3.5 rounded-(--radius-lg) border border-ink-100 bg-ink-50 p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-(--radius-md) bg-white text-[22px] shadow-(--shadow-e1)">
            {cat.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="tabular truncate text-[15px] font-extrabold text-ink-900">
              {job.parcelId}
            </p>
            <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
              {cat.label} · size {job.size} · {kg(job.weightKg)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-bold text-success-700">
            Match
          </span>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-(--radius-md) bg-brand-50 p-3.5">
          <Package size={16} className="mt-px shrink-0 text-brand-600" />
          <p className="text-[12.5px] leading-[1.5] text-brand-800">
            {mode === 'pickup'
              ? 'The hub manager will read out a 6-digit OTP. Entering it moves custody — and liability — to you.'
              : 'The hub manager enters the OTP shown on your screen. That closes your leg of the journey.'}
          </p>
        </div>
      </Sheet>

      {/* Manual entry */}
      <Sheet
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Enter parcel ID"
        subtitle="Use this if the QR is damaged or unreadable"
        footer={
          <Button
            block
            size="lg"
            disabled={manualId.trim().length < 4}
            onClick={() => {
              setManualOpen(false)
              setDetected(true)
            }}
          >
            Find parcel
          </Button>
        }
      >
        <Field
          placeholder="e.g. DKC-4844"
          value={manualId}
          autoFocus
          onChange={(e) => setManualId(e.target.value.toUpperCase())}
        />
      </Sheet>
    </Screen>
  )
}

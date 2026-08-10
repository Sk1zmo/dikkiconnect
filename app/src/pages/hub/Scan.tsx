import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Keyboard, UserCheck, X } from 'lucide-react'
import { Screen } from '@/components/layout/Screen'
import { Button, Field, IconButton, Segmented, Sheet, useToast } from '@/components/ui'
import { ScannerViewfinder } from '@/components/viz/Scanner'
import { categoryById } from '@/lib/data'
import { useAwaitingIntake, useHubInventory } from '@/lib/store'

type Mode = 'intake' | 'release' | 'receiver'

const MODE_COPY: Record<Mode, { hint: string; next: (id: string) => string }> = {
  intake: {
    hint: 'Scan the sender’s drop-off QR to log the parcel in',
    next: (id) => `/hub/intake/${id}`,
  },
  release: {
    hint: 'Scan the parcel going out with a traveler',
    next: () => '/hub/handoff',
  },
  receiver: {
    hint: 'Scan the parcel a receiver has come to collect',
    next: () => '/hub/receiver',
  },
}

export default function HubScan() {
  const navigate = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('intake')
  const [detected, setDetected] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualId, setManualId] = useState('')

  // Scan the next parcel this hub is actually expecting; fall back to whatever
  // is on the shelves so the scanner is never a dead end.
  const awaiting = useAwaitingIntake()
  const held = useHubInventory()
  const target = (mode === 'intake' ? awaiting[0] : held[0]) ?? awaiting[0] ?? held[0]
  const item = { parcelId: target?.id ?? 'DKC-4796', shelf: 'A-04' }
  const cat = categoryById(target?.category ?? 'documents')

  return (
    <Screen tone="dark">
      <div className="pt-safe-3 absolute inset-x-0 top-0 z-30 px-5">
        <div className="flex items-center justify-between">
          <IconButton
            icon={<X size={19} />}
            label="Close scanner"
            tone="onBrand"
            onClick={() => navigate('/hub')}
          />
          <p className="text-[15px] font-bold text-white">Hub scanner</p>
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
            size="sm"
            options={[
              { value: 'intake', label: 'Intake' },
              { value: 'release', label: 'Release' },
              { value: 'receiver', label: 'Receiver' },
            ]}
          />
        </div>
      </div>

      <ScannerViewfinder
        key={mode}
        hint={MODE_COPY[mode].hint}
        autoDetectMs={2900}
        onDetect={() => {
          setDetected(true)
          toast.success('Parcel found', item.parcelId)
        }}
      />

      <Sheet
        open={detected}
        onClose={() => setDetected(false)}
        title="Parcel found"
        subtitle={
          mode === 'intake'
            ? 'Continue to weigh, photograph and verify the sender OTP'
            : mode === 'release'
              ? 'Continue to generate the traveler OTP'
              : 'Continue to verify the receiver OTP'
        }
        footer={
          <Button
            block
            size="lg"
            onClick={() => navigate(MODE_COPY[mode].next(item.parcelId))}
            icon={
              mode === 'intake' ? (
                <ArrowDownToLine size={18} />
              ) : mode === 'release' ? (
                <ArrowUpFromLine size={18} />
              ) : (
                <UserCheck size={18} />
              )
            }
          >
            Continue
          </Button>
        }
      >
        <div className="flex items-center gap-3.5 rounded-(--radius-lg) border border-ink-100 bg-ink-50 p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-(--radius-md) bg-white text-[22px] shadow-(--shadow-e1)">
            {cat.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="tabular truncate text-[15px] font-extrabold text-ink-900">
              {item.parcelId}
            </p>
            <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
              Bangalore → Mysore · shelf {item.shelf}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-bold text-success-700">
            Match
          </span>
        </div>
      </Sheet>

      <Sheet
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Enter parcel ID"
        subtitle="Use this when the QR is torn or unreadable"
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
          placeholder="e.g. DKC-4796"
          value={manualId}
          autoFocus
          onChange={(e) => setManualId(e.target.value.toUpperCase())}
        />
      </Sheet>
    </Screen>
  )
}

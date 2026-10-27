import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLineDown, ArrowLineUp, Keyboard, UserCheck, X } from '@phosphor-icons/react'
import { Screen } from '@/components/layout/Screen'
import { Button, Field, IconButton, Segmented, Sheet, useToast } from '@/components/ui'
import { ScannerViewfinder } from '@/components/viz/Scanner'
import { categoryById } from '@/lib/data'
import { useApp } from '@/lib/store'
import { parcelIdFromScan } from '@/lib/qr'
import { parcels as parcelsApi, explain } from '@/lib/api'
import type { Parcel } from '@/lib/types'
import { CategoryMark } from '@/components/domain/CategoryIcon'

type Mode = 'intake' | 'release' | 'receiver'

const MODE_COPY: Record<Mode, { hint: string; next: (id: string) => string }> = {
  intake: {
    hint: 'Scan the drop-off QR — from a sender, or from a traveller arriving',
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
  /* The parcel the camera actually read, not the one the app expected next.
     Holding the id here is the whole difference: the sheet below now describes
     what is in the worker's hands. */
  const [found, setFound] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualId, setManualId] = useState('')
  const [looking, setLooking] = useState(false)

  const { parcels, adoptParcel } = useApp()

  const target = found ? parcels.find((p) => p.id === found) : undefined
  const item = { parcelId: found ?? '', shelf: 'A-04' }
  const cat = categoryById(target?.category ?? 'documents')
  const detected = found !== null

  /**
   * A scan, or a hand-typed id, resolved against the server.
   *
   * It used to look only in this device's own list, which worked while every
   * parcel in the world was seeded into every device. A hub worker is neither
   * the sender nor the carrier, so the parcel in their hands is one they have
   * never seen — the honest place to ask is the server.
   */
  const resolve = (raw: string) => {
    const id = parcelIdFromScan(raw)
    if (!id) {
      toast.error('Not a WayPool pass', 'That code belongs to something else. Try again.')
      return
    }

    void (async () => {
      setLooking(true)
      try {
        let parcel = parcels.find((p) => p.id === id)
        if (!parcel) {
          const { parcel: fromServer } = await parcelsApi.one(id)
          adoptParcel(fromServer)
          parcel = fromServer as unknown as Parcel
        }

        /* Intake covers both directions of a hub counter: a parcel arriving
           from its sender, and one arriving in a traveller's boot. Release is
           for what is on the shelves, receiver for what is waiting to be
           collected. Checking here stops a worker walking into an
           out-of-order rejection three screens later, with the parcel already
           out of the box. */
        const ok =
          mode === 'intake'
            ? parcel.status === 'booked' || parcel.status === 'in_transit'
            : mode === 'receiver'
              ? parcel.status === 'at_destination_hub'
              : parcel.status === 'at_origin_hub' || parcel.status === 'assigned'
        if (!ok) {
          toast.error(
            'Wrong queue',
            `${id} is "${parcel.status.replace(/_/g, ' ')}" — pick another mode.`,
          )
          return
        }

        setFound(id)
        toast.success('Parcel found', id)
      } catch (e) {
        toast.error('Not found', explain(e))
      } finally {
        setLooking(false)
      }
    })()
  }

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
              setFound(null)
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
        hint={looking ? 'Looking it up…' : MODE_COPY[mode].hint}
        onDetect={resolve}
      />

      <Sheet
        open={detected}
        onClose={() => setFound(null)}
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
                <ArrowLineDown size={18} />
              ) : mode === 'release' ? (
                <ArrowLineUp size={18} />
              ) : (
                <UserCheck size={18} />
              )
            }
          >
            Continue
          </Button>
        }
      >
        {/* The confirmation the scanner shows is the one moment where the worker
            still has the physical box in hand. A grey outline glyph on a white
            square told them nothing they could check against it; the drawn
            object in its category colour is something they can match at arm's
            length without reading the label. */}
        <div className="flex items-center gap-3.5 rounded-(--radius-lg) border border-ink-100 bg-ink-50 p-4">
          <CategoryMark id={cat.id} size={52} />
          <div className="min-w-0 flex-1">
            <p className="tabular truncate text-[16px] font-extrabold tracking-title text-ink-900">
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
            disabled={manualId.trim().length < 4 || looking}
            onClick={() => {
              setManualOpen(false)
              resolve(manualId)
            }}
          >
            Find parcel
          </Button>
        }
      >
        <Field
          placeholder="e.g. WYP-4796"
          value={manualId}
          autoFocus
          onChange={(e) => setManualId(e.target.value.toUpperCase())}
        />
      </Sheet>
    </Screen>
  )
}

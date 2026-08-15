import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Ban,
  Copy,
  Headphones,
  MessageCircle,
  Phone,
  QrCode,
  Share2,
  ShieldCheck,
} from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  IconButton,
  KeyValue,
  LiveDot,
  Note,
  Sheet,
  StatusBadge,
  Stars,
  useToast,
} from '@/components/ui'
import { Timeline, TimelineSkeleton } from '@/components/viz/Timeline'
import { LiveMap } from '@/components/viz/Map'
import { categoryById, cityName, hubById, otpFor, travelerById } from '@/lib/data'
import { inr, kg, time } from '@/lib/format'
import { useApp } from '@/lib/store'
import { useLoaded } from '@/lib/hooks'

export default function Tracking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { parcels } = useApp()

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const parcel = parcels.find((p) => p.id === id)
  const { loading } = useLoaded(parcel, 900)

  if (!parcel) return <Navigate to="/sender/track" replace />

  const traveler = travelerById(parcel.travelerId)
  const cat = categoryById(parcel.category)
  const isP2P = parcel.mode === 'p2p'
  const originHub = hubById(parcel.originHubId)
  const destHub = hubById(parcel.destinationHubId)
  // P2P moves door to door, so the "from → to" line names the addresses.
  const fromLabel = isP2P
    ? (parcel.pickupAddress ?? cityName(parcel.fromCityId))
    : (originHub?.name.split('·').pop()?.trim() ?? '—')
  const toLabel = isP2P
    ? (parcel.dropAddress ?? cityName(parcel.toCityId))
    : (destHub?.name.split('·').pop()?.trim() ?? '—')
  const live = parcel.status === 'in_transit'
  const canCancel = ['booked', 'at_origin_hub'].includes(parcel.status)
  const doneCount = parcel.timeline.filter((e) => e.done).length
  const progress = doneCount / parcel.timeline.length

  const copyId = () => {
    navigator.clipboard?.writeText(parcel.id)
    toast.success('Tracking ID copied', parcel.id)
  }

  return (
    <Screen>
      <div className="relative shrink-0">
        {live ? (
          <LiveMap
            height={252}
            fromCityId={parcel.fromCityId}
            toCityId={parcel.toCityId}
            fromHubId={isP2P ? undefined : parcel.originHubId}
            toHubId={isP2P ? undefined : parcel.destinationHubId}
          />
        ) : (
          <div className="h-[180px]">
            <LiveMap
              height={180}
              fromCityId={parcel.fromCityId}
              toCityId={parcel.toCityId}
              fromHubId={isP2P ? undefined : parcel.originHubId}
              toHubId={isP2P ? undefined : parcel.destinationHubId}
            />
          </div>
        )}
        <TopBar
          floating
          tone="dark"
          back
          backTo="/sender/track"
          className="pt-safe"
          action={
            <>
              <IconButton
                icon={<Share2 size={17} />}
                label="Share tracking"
                tone="onBrand"
                onClick={() => toast.info('Link copied', 'Anyone with it can follow this parcel.')}
              />
              <IconButton
                icon={<QrCode size={17} />}
                label="Show QR"
                tone="onBrand"
                onClick={() => navigate(`/sender/qr/${parcel.id}`)}
              />
            </>
          }
        />
      </div>

      <ScreenBody className="-mt-6 pt-0">
        {/* Status header */}
        <Card elevation={3} className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="tabular text-[15px] font-extrabold text-ink-900">{parcel.id}</p>
                <button onClick={copyId} aria-label="Copy tracking ID" className="pressable-sm">
                  <Copy size={13} className="text-ink-400" />
                </button>
              </div>
              <p className="mt-1 text-[12.5px] text-ink-500">
                {fromLabel} → {toLabel}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusBadge status={parcel.status} />
              {live && <LiveDot />}
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-ink-100 pt-3.5">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                {parcel.status === 'delivered' ? 'Delivered at' : 'Estimated arrival'}
              </p>
              <p className="text-display mt-0.5 text-[20px] font-extrabold text-ink-900">
                {time(parcel.etaAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">Progress</p>
              <p className="text-display mt-0.5 text-[20px] font-extrabold text-brand-700">
                {Math.round(progress * 100)}%
              </p>
            </div>
          </div>
        </Card>

        {/* Traveler */}
        {traveler && (
          <Card className="mt-3">
            <div className="flex items-center gap-3">
              <Avatar name={traveler.name} size={46} tone={traveler.avatarTone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-bold text-ink-900">{traveler.name}</p>
                  <Badge tone="success" size="sm" icon={<ShieldCheck size={10} />}>
                    KYC
                  </Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
                  <Stars value={traveler.rating} size={11} />
                  <span className="font-semibold text-ink-700">{traveler.rating.toFixed(1)}</span>
                  <span className="text-ink-300">·</span>
                  <span className="truncate">
                    {traveler.vehicle.model} · {traveler.vehicle.plate}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <IconButton icon={<MessageCircle size={16} />} label="Message traveler" size={36} />
                <IconButton icon={<Phone size={16} />} label="Call traveler" tone="solid" size={36} />
              </div>
            </div>
          </Card>
        )}

        {/* Custody chain */}
        <Card className="mt-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              Custody chain
            </p>
            <span className="tabular text-[11.5px] font-bold text-ink-500">
              {doneCount}/{parcel.timeline.length} checkpoints
            </span>
          </div>
          {loading ? <TimelineSkeleton rows={4} /> : <Timeline events={parcel.timeline} />}
        </Card>

        {/* Receiver OTP once it lands */}
        {parcel.status === 'at_destination_hub' && (
          <Note tone="success" icon={<ShieldCheck size={15} />} className="mt-3" title="Ready for pickup">
            {parcel.receiverName} has been sent OTP{' '}
            <span className="font-mono font-extrabold">{otpFor(parcel.id + 'recv')}</span> — they
            show it {isP2P ? 'to the traveler at the door' : `at ${toLabel}`} to collect.
          </Note>
        )}

        <button
          onClick={() => setDetailsOpen(true)}
          className="pressable mt-3 flex w-full items-center gap-3 rounded-(--radius-lg) border border-ink-200 bg-white p-4 text-left"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-[19px]">
            {cat.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-ink-900">Parcel details</span>
            <span className="block truncate text-[12px] text-ink-500">
              {cat.label} · {kg(parcel.weightKg)} · {inr(parcel.price)}
            </span>
          </span>
          <span className="shrink-0 text-[12.5px] font-bold text-brand-600">View</span>
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="outline" to="/support" icon={<Headphones size={16} />}>
            Get help
          </Button>
          <Button
            variant={canCancel ? 'danger' : 'outline'}
            disabled={!canCancel}
            onClick={() => setCancelOpen(true)}
            icon={<Ban size={16} />}
          >
            Cancel
          </Button>
        </div>

        {!canCancel && parcel.status !== 'delivered' && parcel.status !== 'cancelled' && (
          <p className="mt-2.5 text-center text-[11.5px] text-ink-400">
            Cancellation closes once a traveler takes custody.
          </p>
        )}
      </ScreenBody>

      {parcel.status === 'delivered' && (
        <ActionBar>
          <Button block size="lg" onClick={() => navigate('/sender/book')}>
            Send another parcel
          </Button>
        </ActionBar>
      )}

      {/* Parcel details sheet */}
      <Sheet open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Parcel details">
        <KeyValue label="Tracking ID" value={parcel.id} />
        <KeyValue label="Category" value={cat.label} />
        <KeyValue label="Size" value={`${parcel.size} · ${kg(parcel.weightKg)}`} />
        <KeyValue label="Declared value" value={inr(parcel.declaredValue)} />
        <KeyValue label="Handling" value={parcel.fragile ? 'Fragile' : 'Standard'} />
        <div className="my-2 h-px bg-ink-100" />
        <KeyValue label="Receiver" value={parcel.receiverName} />
        <KeyValue label="Receiver mobile" value={`+91 ${parcel.receiverPhone}`} />
        <div className="my-2 h-px bg-ink-100" />
        <KeyValue label={isP2P ? 'Collected from' : 'Origin hub'} value={fromLabel} />
        <KeyValue label={isP2P ? 'Delivered to' : 'Destination hub'} value={toLabel} />
        <div className="my-2 h-px bg-ink-100" />
        <KeyValue label="Amount paid" value={inr(parcel.price)} strong />
        {parcel.notes && (
          <Note
            tone="neutral"
            className="mt-4"
            title={isP2P ? 'Your note to the traveler' : 'Your note to the hub'}
          >
            {parcel.notes}
          </Note>
        )}
      </Sheet>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        loading={cancelling}
        onConfirm={() => {
          setCancelling(true)
          setTimeout(() => {
            setCancelling(false)
            setCancelOpen(false)
            toast.success('Booking cancelled', `${inr(parcel.price)} refunded to your wallet`)
            navigate('/sender/bookings')
          }, 1200)
        }}
        tone="danger"
        icon={<Ban size={28} />}
        title="Cancel this booking?"
        body={
          <>
            {inr(parcel.price)} will be refunded to your DikkiConnect wallet immediately. Your slot is
            released.
          </>
        }
        confirmLabel="Yes, cancel"
        cancelLabel="Keep booking"
      />
    </Screen>
  )
}

import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  Clock,
  Fuel,
  Home,
  MapPin,
  Package,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Badge,
  Button,
  Card,
  KeyValue,
  Note,
  useToast,
} from '@/components/ui'
import { RouteMap } from '@/components/viz/Map'
import { categoryById, hubById, jobFromParcel } from '@/lib/data'
import { inr, kg, relative } from '@/lib/format'
import { useApp, useMe, useOpenJobs } from '@/lib/store'
import { CategoryIcon } from '@/components/domain/CategoryIcon'


export default function JobDetail() {
  const ME = useMe()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { advanceParcel } = useApp()
  const [accepting, setAccepting] = useState(false)

  // Live feed — jobs are derived from parcels, so one claimed by another
  // driver disappears from here too.
  const parcel = useOpenJobs().find((p) => jobFromParcel(p).id === id)
  const job = parcel ? jobFromParcel(parcel) : undefined
  if (!job) return <Navigate to="/traveler/jobs" replace />

  const cat = categoryById(job.category)
  const isP2P = job.mode === 'p2p'
  const from = hubById(job.fromHubId)
  const to = hubById(job.toHubId)
  const urgent = new Date(job.expiresAt).getTime() - Date.now() < 20 * 60_000

  const accept = () => {
    setAccepting(true)
    setTimeout(() => {
      advanceParcel(job.parcelId, 'assigned', { actor: ME.name, travelerId: ME.id })
      toast.success(
        'Job accepted',
        isP2P
          ? 'Head to the pickup address and enter the sender’s OTP.'
          : 'Head to the pickup hub and scan the parcel QR.',
      )
      navigate('/traveler/scan')
    }, 1100)
  }

  return (
    <Screen>
      <div className="relative shrink-0">
        <RouteMap
          height={190}
          fromLabel={job.fromLabel}
          toLabel={job.toLabel}
          fromCityId={parcel?.fromCityId ?? 'blr'}
          toCityId={parcel?.toCityId ?? 'mys'}
          fromHubId={isP2P ? undefined : job.fromHubId}
          toHubId={isP2P ? undefined : job.toHubId}
        />
        <TopBar floating tone="dark" back className="pt-safe" />
      </div>

      <ScreenBody className="-mt-6 pt-0">
        <Card elevation={3}>
          <div className="flex items-start gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-(--radius-md) bg-brand-50 text-[22px]">
              <CategoryIcon id={cat.id} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-extrabold text-ink-900">{cat.label}</p>
              <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                {job.parcelId} · size {job.size} · {kg(job.weightKg)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular text-display text-[26px] leading-none font-extrabold text-success-600">
                +{inr(job.payout)}
              </p>
              <p className="mt-1 text-[10.5px] font-bold text-ink-400">your payout</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3.5">
            <Badge
              tone={isP2P ? 'brand' : 'neutral'}
              icon={isP2P ? <Home size={11} /> : <Building2 size={11} />}
            >
              {isP2P ? 'Door to door' : 'Hub to hub'}
            </Badge>
            <Badge tone="neutral" icon={<Fuel size={11} />}>
              {job.detourKm} km detour
            </Badge>
            <Badge tone={urgent ? 'danger' : 'brand'} icon={<Timer size={11} />}>
              Expires {relative(job.expiresAt)}
            </Badge>
            {job.fragile && (
              <Badge tone="warn" icon={<AlertTriangle size={11} />}>
                Fragile
              </Badge>
            )}
          </div>
        </Card>

        {/* Hubs */}
        <Card className="mt-3">
          <p className="mb-3.5 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            Pickup & drop
          </p>
          <div className="flex gap-3.5">
            <span className="mt-1.5 flex flex-col items-center gap-1">
              <span className="size-2.5 rounded-full bg-brand-600 ring-4 ring-brand-600/15" />
              <span className="h-11 w-px border-l-2 border-dashed border-ink-200" />
              <span className="size-2.5 rounded-full bg-success-500 ring-4 ring-success-500/15" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-4">
                <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                  Collect from
                </p>
                <p className="text-[14px] font-bold text-ink-900">{job.fromLabel}</p>
                {isP2P ? (
                  <p className="mt-0.5 text-[12px] text-ink-500">
                    The exact door address is revealed once you accept.
                  </p>
                ) : (
                  <>
                    <p className="truncate text-[12px] text-ink-500">{from?.address}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500">
                      <Clock size={11} />
                      {from?.openFrom} – {from?.openTo}
                    </p>
                  </>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                  Deliver to
                </p>
                <p className="text-[14px] font-bold text-ink-900">{job.toLabel}</p>
                {isP2P ? (
                  <p className="mt-0.5 text-[12px] text-ink-500">
                    The receiver hands over their OTP at the door.
                  </p>
                ) : (
                  <>
                    <p className="truncate text-[12px] text-ink-500">{to?.address}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500">
                      <Clock size={11} />
                      {to?.openFrom} – {to?.openTo}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Payout breakdown */}
        <Card className="mt-3">
          <p className="mb-2 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            Payout breakdown
          </p>
          <KeyValue label="Base carry fee" value={inr(Math.round(job.payout * 0.72))} />
          <KeyValue label="Distance component" value={inr(Math.round(job.payout * 0.2))} />
          {job.fragile && (
            <KeyValue label="Fragile handling bonus" value={inr(Math.round(job.payout * 0.08))} />
          )}
          <div className="my-2 h-px bg-ink-100" />
          <KeyValue label="Credited on drop-off" value={inr(job.payout)} strong />
        </Card>

        <Note tone="brand" icon={<ShieldCheck size={15} />} className="mt-3" title="Custody rules">
          {isP2P
            ? 'You take custody at the sender’s door by entering their OTP, and close the job with the receiver’s OTP — two checkpoints, both timestamped.'
            : 'You take custody at the origin hub by scanning the QR and entering the OTP the hub manager generates. Liability shifts to you at that timestamp and back to the hub on drop-off.'}
        </Note>

        <Note tone="neutral" icon={<Package size={15} />} className="mt-3">
          Do not open, repack or transfer this parcel to anyone else. Handoffs outside the hub
          network void protection for all parties.
        </Note>

        <div className="mt-3">
          <Button variant="outline" block to="/traveler/navigate" icon={<MapPin size={16} />}>
            Preview route with this stop
          </Button>
        </div>
      </ScreenBody>

      <ActionBar
        helper={
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-semibold text-ink-500">
              Adds {job.detourKm} km to your trip
            </span>
            <span className="tabular text-display text-[20px] font-extrabold text-success-600">
              +{inr(job.payout)}
            </span>
          </div>
        }
      >
        <Button block size="lg" loading={accepting} onClick={accept}>
          {accepting ? 'Reserving…' : 'Accept this job'}
        </Button>
      </ActionBar>
    </Screen>
  )
}

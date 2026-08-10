import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  Car,
  ChevronRight,
  Navigation,
  Package,
  Plus,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Screen, ScreenBody, BrandHeader } from '@/components/layout/Screen'
import { PortalSwitcher } from '@/components/layout/PortalSwitcher'
import {
  Avatar,
  Badge,
  Card,
  LiveDot,
  Note,
  SectionHeader,
  Skeleton,
  SkeletonList,
  Stat,
  Switch,
  useToast,
} from '@/components/ui'
import { CapacityMeter, JobCard, TripCard } from '@/components/domain/Cards'
import { PARCEL_JOBS, TRAVELERS, TRIPS, hubShort } from '@/lib/data'
import { compactInr, inr, time } from '@/lib/format'
import { useCountUp, useLoaded } from '@/lib/hooks'
import { useState } from 'react'

const ME = TRAVELERS[0]

export default function TravelerHome() {
  const navigate = useNavigate()
  const toast = useToast()
  const [online, setOnline] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  const myTrips = TRIPS.filter((t) => t.travelerId === ME.id)
  const todayTrip = myTrips[0]
  const jobs = PARCEL_JOBS.slice(0, 2)

  const { loading } = useLoaded(jobs, 1150)
  const earnings = useCountUp(4820, 1100)

  const accept = (jobId: string) => {
    setAccepting(jobId)
    setTimeout(() => {
      setAccepting(null)
      toast.success('Job accepted', 'Added to your manifest. Scan at the hub to pick it up.')
      navigate('/traveler/scan')
    }, 1100)
  }

  return (
    <Screen>
      <BrandHeader className="pt-safe">
        <div className="mb-4">
          <PortalSwitcher />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={ME.name} size={44} onBrand />
            <div className="min-w-0">
              <p className="truncate text-[15.5px] font-bold">{ME.name}</p>
              <p className="flex items-center gap-1.5 text-[12px] text-white/70">
                ★ {ME.rating.toFixed(1)} · {ME.trips} trips
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
            className="pressable-sm relative grid size-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur-md"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-warn-400 ring-2 ring-brand-700" />
          </button>
        </div>

        {/* Online toggle */}
        <div className="mt-5 flex items-center justify-between rounded-(--radius-lg) bg-white/12 px-4 py-3.5 ring-1 ring-white/20 backdrop-blur-md">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[14px] font-bold">
              {online ? 'You are online' : 'You are offline'}
              {online && <LiveDot label="Matching" />}
            </p>
            <p className="mt-0.5 text-[11.5px] text-white/65">
              {online ? 'Receiving parcel jobs on your route' : 'Turn on to get matched with jobs'}
            </p>
          </div>
          <Switch checked={online} onChange={setOnline} />
        </div>

        {/* Earnings */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { label: 'This week', value: inr(earnings) },
            { label: 'Trips', value: '6' },
            { label: 'Parcels', value: '14' },
          ].map((s) => (
            <div key={s.label} className="rounded-(--radius-md) bg-white/12 px-3 py-2.5 backdrop-blur-md">
              <p className="tabular text-[17px] leading-none font-extrabold">{s.value}</p>
              <p className="mt-1.5 text-[10.5px] font-semibold text-white/65">{s.label}</p>
            </div>
          ))}
        </div>
      </BrandHeader>

      <ScreenBody className="pt-5">
        {/* KYC gate */}
        {ME.kycTier !== 'passenger_ready' && (
          <Card
            to="/traveler/kyc"
            className="mb-5 flex items-center gap-3.5 border-warn-100 bg-warn-50"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-warn-500/15 text-warn-600">
              <ShieldAlert size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-warn-800">Finish KYC to carry passengers</p>
              <p className="mt-0.5 text-[12px] text-warn-700/85">
                Licence + RC verification unlocks seat bookings
              </p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-warn-600" />
          </Card>
        )}

        {/* Today's trip */}
        <SectionHeader title="Today's trip" action="All trips" to="/traveler/trips" />
        {todayTrip ? (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone="brand" dot>
                    Departs {time(todayTrip.departAt)}
                  </Badge>
                </div>
                <p className="text-display mt-2 truncate text-[18px] font-extrabold text-ink-900">
                  Bangalore → Mysore
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-500">
                  via {todayTrip.viaStops.join(' · ')}
                </p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
                <Car size={20} />
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <CapacityMeter
                label="Seats"
                used={todayTrip.seatsTotal - todayTrip.seatsLeft}
                total={todayTrip.seatsTotal}
                icon={<Users size={14} />}
              />
              <CapacityMeter
                label="Boot slots"
                used={todayTrip.parcelIds.length}
                total={todayTrip.bootSlots.length}
                icon={<Package size={14} />}
                tone="success"
              />
            </div>

            <button
              onClick={() => navigate('/traveler/navigate')}
              className="pressable mt-3.5 flex w-full items-center justify-center gap-2 rounded-(--radius-md) bg-action py-3.5 text-[14px] font-bold text-white shadow-(--shadow-action) hover:bg-action-hover"
            >
              <Navigation size={16} />
              Start navigation
            </button>
          </Card>
        ) : (
          <Card onClick={() => navigate('/traveler/trips/new')} className="flex items-center gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
              <Plus size={19} />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[14px] font-bold text-ink-900">Publish a trip</p>
              <p className="mt-0.5 text-[12px] text-ink-500">
                Declare your route and free boot space
              </p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-ink-300" />
          </Card>
        )}

        {/* Job feed */}
        <div className="mt-7">
          <SectionHeader
            title="Jobs on your route"
            subtitle={loading ? undefined : `${PARCEL_JOBS.length} parcels waiting at hubs`}
            action="See all"
            to="/traveler/jobs"
          />
          {loading ? (
            <SkeletonList count={2} />
          ) : !online ? (
            <Card className="py-8 text-center">
              <Briefcase size={26} className="mx-auto mb-3 text-ink-300" />
              <p className="text-[14px] font-bold text-ink-800">You&apos;re offline</p>
              <p className="mt-1 text-[12.5px] text-ink-500">
                Go online to see parcels waiting on your route.
              </p>
            </Card>
          ) : (
            <div className="stagger flex flex-col gap-3">
              {jobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  accepting={accepting === j.id}
                  onAccept={() => accept(j.id)}
                  onView={() => navigate(`/traveler/jobs/${j.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Performance */}
        <div className="mt-7">
          <SectionHeader title="Your performance" subtitle="Last 30 days" />
          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={<TrendingUp size={15} />}
              label="Total earned"
              value={compactInr(18420)}
              delta={{ value: '12%', up: true }}
            />
            <Stat
              icon={<Package size={15} />}
              label="Parcels carried"
              value="47"
              tone="success"
              delta={{ value: '8%', up: true }}
            />
            <Stat icon={<Users size={15} />} label="Passengers" value="23" tone="accent" />
            <Stat
              icon={<Car size={15} />}
              label="On-time rate"
              value="98%"
              tone="brand"
              delta={{ value: '2%', up: true }}
            />
          </div>
        </div>

        {/* Upcoming trips */}
        <div className="mt-7">
          <SectionHeader title="Upcoming trips" action="Create" to="/traveler/trips/new" />
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton h={92} radius={18} />
            </div>
          ) : (
            <div className="stagger flex flex-col gap-3">
              {myTrips.map((t) => (
                <TripCard key={t.id} trip={t} compact to="/traveler/trips" />
              ))}
            </div>
          )}
        </div>

        <Note tone="brand" className="mt-6" title="How payouts work">
          Parcel fees settle to your wallet the moment the destination hub confirms drop-off. Seat
          fares settle at trip completion. Weekly transfer to{' '}
          <span className="font-bold">ICICI •••• 8890</span>.
        </Note>

        <p className="mt-5 text-center text-[11.5px] text-ink-400">
          Next pickup: {hubShort('hub-blr-kor')} · today {time(TRIPS[0].departAt)}
        </p>
      </ScreenBody>
    </Screen>
  )
}

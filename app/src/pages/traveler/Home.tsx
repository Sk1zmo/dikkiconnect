import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  CalendarDots,
  Car,
  CaretRight,
  NavigationArrow,
  Package,
  Plus,
  ShieldWarning,
  TrendUp,
  Users,
} from '@phosphor-icons/react'
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
import { hubShort, jobFromParcel } from '@/lib/data'
import { compactInr, dayDate, inr, relative, time } from '@/lib/format'
import { useCountUp, useLoaded } from '@/lib/hooks'
import { parcels as parcelsApi, explain } from '@/lib/api'
import { useApp, useMe, useMyTrips, useOpenJobs } from '@/lib/store'
import { cn } from '@/lib/cn'
import { seatsScarce } from '@/lib/scarcity'
import { useMemo, useState } from 'react'


/** Is this trip departing within today's calendar day? */
function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export default function TravelerHome() {
  const ME = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const { adoptParcel, walletTxns } = useApp()
  const [online, setOnline] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  const mine = useMyTrips(ME.id)
  const openParcels = useOpenJobs()
  const allJobs = useMemo(() => openParcels.map(jobFromParcel), [openParcels])
  const jobs = allJobs.slice(0, 2)
  const p2pCount = allJobs.filter((j) => j.mode === 'p2p').length

  // The trip on the road right now, else the next one departing today.
  const todayTrip =
    mine.running[0] ?? mine.scheduled.find((t) => isToday(t.departAt)) ?? null
  // Rides posted for a later day — the point of publishing in advance.
  const laterTrips = mine.scheduled.filter((t) => t !== todayTrip)

  const { loading } = useLoaded(jobs, 1150)
  // Real wallet credits from the last 7 days — not a number that was always
  // going to read ₹4,820 no matter who signed in.
  const weekEarnings = useMemo(() => {
    const since = Date.now() - 7 * 86_400_000
    return walletTxns
      .filter((t) => t.kind === 'credit' && new Date(t.at).getTime() >= since)
      .reduce((s, t) => s + t.amount, 0)
  }, [walletTxns])
  const earnings = useCountUp(weekEarnings, 1100)

  const accept = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return
    setAccepting(jobId)
    void (async () => {
      try {
        /* The server decides this, not the device. Two travellers tapping at
           the same moment both used to see "accepted". */
        const { parcel } = await parcelsApi.claim(job.parcelId)
        adoptParcel(parcel)
        toast.success('Job accepted', 'Added to your manifest. Scan at the hub to pick it up.')
        navigate('/traveler/scan')
      } catch (e) {
        toast.error('Not yours', explain(e))
      } finally {
        setAccepting(null)
      }
    })()
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
                {mine.completed.length > 0
                  ? `${mine.completed.length} trip${mine.completed.length === 1 ? '' : 's'} completed`
                  : 'New driver'}
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

        {/* ═══════════════════════════════════════════════════════════════════
            Earnings.

            Three tiles, but not three equals. A driver opens this app to find
            out what they made, and the week's total answering in the same
            weight as "6 trips" made the reader do the sorting. The money tile
            is set a step larger and the other two step back; the labels drop
            to captions under the figures rather than sitting level with them.

            The tile stayed a third of the row rather than spanning two — a
            wide money tile left the remaining pair too narrow for four-digit
            counts, and this header has to survive ₹1,24,000 without wrapping.
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {(
            [
              { label: 'This week', value: inr(earnings), lead: true },
              { label: 'Trips', value: String(mine.completed.length) },
              { label: 'Parcels', value: '0' },
            ] as Array<{ label: string; value: string; lead?: boolean }>
          ).map((s) => (
            <div key={s.label} className="rounded-(--radius-md) bg-white/12 px-3 py-2.5 backdrop-blur-md">
              <p
                className={cn(
                  'tabular leading-none font-extrabold tracking-title',
                  s.lead ? 'text-[21px]' : 'text-[17px] text-white/90',
                )}
              >
                {s.value}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-white/65">{s.label}</p>
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
              <ShieldWarning size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-warn-800">Finish KYC to carry passengers</p>
              <p className="mt-0.5 text-[12px] text-warn-700/85">
                Licence + RC verification unlocks seat bookings
              </p>
            </div>
            <CaretRight size={17} className="shrink-0 text-warn-600" />
          </Card>
        )}

        {/* Post a ride in advance — the primary driver action, above the fold */}
        <button
          onClick={() => navigate('/traveler/trips/new')}
          className="springy focus-ring mb-5 flex w-full items-center gap-3.5 rounded-(--radius-lg) bg-action p-4 text-left text-white shadow-(--shadow-action)"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-md) bg-white/15 backdrop-blur-md">
            <CalendarDots size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold">Post a ride in advance</span>
            <span className="mt-0.5 block text-[12px] text-white/70">
              Publish today, drive any day — seats and parcels fill before you leave
            </span>
          </span>
          <CaretRight size={18} className="shrink-0 text-white/60" />
        </button>

        {/* Today's trip */}
        <SectionHeader
          title={todayTrip ? "Today's trip" : 'Your next drive'}
          action="All trips"
          to="/traveler/trips"
        />
        {todayTrip ? (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* The yellow is spent here and nowhere else on this screen.
                    Seats running out is the one fact on the dashboard that
                    rewards acting today; departure time, trip status and job
                    count all keep until the driver looks again. A full car
                    gets no badge — scarcity you cannot act on is decoration. */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand" dot>
                    Departs {time(todayTrip.departAt)}
                  </Badge>
                  {seatsScarce(todayTrip.seatsLeft) && (
                    <Badge tone="signal">
                      {todayTrip.seatsLeft} seat{todayTrip.seatsLeft > 1 ? 's' : ''} left
                    </Badge>
                  )}
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
              <NavigationArrow size={16} />
              Start navigation
            </button>
          </Card>
        ) : (
          <Card onClick={() => navigate('/traveler/trips/new')} className="flex items-center gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
              <Plus size={19} />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[14px] font-bold text-ink-900">Nothing scheduled for today</p>
              <p className="mt-0.5 text-[12px] text-ink-500">
                Post the route and free boot space for a day that suits you
              </p>
            </div>
            <CaretRight size={17} className="shrink-0 text-ink-300" />
          </Card>
        )}

        {/* Rides posted for later days */}
        {laterTrips.length > 0 && (
          <div className="mt-5">
            <SectionHeader
              title="Posted in advance"
              subtitle={`${laterTrips.length} ride${laterTrips.length === 1 ? '' : 's'} live for booking`}
              action="Manage"
              to="/traveler/trips"
            />
            <div className="stagger flex flex-col gap-2.5">
              {laterTrips.slice(0, 3).map((t) => (
                <Card key={t.id} to="/traveler/trips" className="flex items-center gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
                    <CalendarDots size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-ink-900">
                      {dayDate(t.departAt)} · {time(t.departAt)}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-500">
                      {t.seatsLeft} of {t.seatsTotal} seats left · departs {relative(t.departAt)}
                    </p>
                  </div>
                  <Badge tone="success" size="sm" dot>
                    Live
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Job feed */}
        <div className="mt-7">
          <SectionHeader
            title="Jobs on your route"
            subtitle={
              loading
                ? undefined
                : `${allJobs.length} waiting · ${allJobs.length - p2pCount} hub-to-hub · ${p2pCount} door-to-door`
            }
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
              {jobs.length === 0 && (
                <Card className="py-8 text-center">
                  <Briefcase size={26} className="mx-auto mb-3 text-ink-300" />
                  <p className="text-[14px] font-bold text-ink-800">No parcels waiting</p>
                  <p className="mt-1 text-[12.5px] text-ink-500">
                    New jobs appear the moment a sender books on your corridor.
                  </p>
                </Card>
              )}
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
              icon={<TrendUp size={15} />}
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
          <SectionHeader title="Upcoming trips" action="Post a ride" to="/traveler/trips/new" />
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton h={92} radius={18} />
            </div>
          ) : (
            <div className="stagger flex flex-col gap-3">
              {mine.all.length === 0 ? (
                <Card
                  onClick={() => navigate('/traveler/trips/new')}
                  className="flex items-center gap-3.5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
                    <Plus size={19} />
                  </span>
                  <p className="flex-1 text-left text-[13.5px] font-bold text-ink-900">
                    Post your first ride
                  </p>
                  <CaretRight size={17} className="shrink-0 text-ink-300" />
                </Card>
              ) : (
                mine.all
                  .slice(0, 3)
                  .map((t) => <TripCard key={t.id} trip={t} compact to="/traveler/trips" />)
              )}
            </div>
          )}
        </div>

        <Note tone="brand" className="mt-6" title="How payouts work">
          Parcel fees settle to your wallet the moment the destination hub confirms drop-off. Seat
          fares settle at trip completion. Weekly transfer to{' '}
          <span className="font-bold">ICICI •••• 8890</span>.
        </Note>

        {todayTrip && (
          <p className="mt-5 text-center text-[11.5px] text-ink-400">
            Next pickup: {hubShort('hub-blr-kor')} · {time(todayTrip.departAt)}
          </p>
        )}
      </ScreenBody>
    </Screen>
  )
}

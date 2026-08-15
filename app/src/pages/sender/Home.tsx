import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  Clock,
  Headphones,
  MapPin,
  Package,
  Search,
  Ticket,
  TrendingDown,
} from 'lucide-react'
import { Screen, ScreenBody, BrandHeader } from '@/components/layout/Screen'
import { PortalSwitcher } from '@/components/layout/PortalSwitcher'
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  SectionHeader,
  Skeleton,
  SkeletonList,
} from '@/components/ui'
import { ParcelCard, PromoBanner } from '@/components/domain/Cards'
import { EmptyBoxArt } from '@/components/viz/Illustrations'
import { HubMap } from '@/components/viz/Map'
import { useApp } from '@/lib/store'
import { useLoaded } from '@/lib/hooks'
import { HUBS, cityName } from '@/lib/data'
import { inr, time } from '@/lib/format'

const QUICK = [
  { icon: Package, label: 'Book parcel', to: '/sender/book', primary: true },
  { icon: MapPin, label: 'Track', to: '/sender/track' },
  { icon: Ticket, label: 'Offers', to: '/wallet' },
  { icon: Headphones, label: 'Support', to: '/support' },
]

export default function SenderHome() {
  const navigate = useNavigate()
  const { user, parcels, unread } = useApp()

  const active = parcels.filter(
    (p) => !['delivered', 'cancelled'].includes(p.status),
  )
  const recent = parcels.filter((p) => ['delivered', 'cancelled'].includes(p.status)).slice(0, 3)

  const { loading } = useLoaded(active, 1100)
  const { loading: hubsLoading } = useLoaded(HUBS, 1500)

  const nearby = HUBS.filter((h) => h.cityId === 'blr').slice(0, 3)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <Screen>
      <BrandHeader className="pt-safe">
        <div className="mb-4">
          <PortalSwitcher />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white/65">{greeting}</p>
            <p className="text-display truncate text-[21px] font-extrabold">
              {user.name.split(' ')[0]}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
              className="pressable-sm relative grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-warn-400 ring-2 ring-brand-700" />
              )}
            </button>
            <button onClick={() => navigate('/profile')} aria-label="Profile">
              <Avatar name={user.name} size={40} onBrand ring={false} />
            </button>
          </div>
        </div>

        {/* Search entry into booking */}
        <button
          onClick={() => navigate('/sender/book')}
          className="pressable mt-5 flex w-full items-center gap-3 rounded-(--radius-lg) bg-white/12 px-4 py-3.5 ring-1 ring-white/20 backdrop-blur-md"
        >
          <Search size={17} className="shrink-0 text-white/70" />
          <span className="text-[14.5px] text-white/70">Where is your parcel headed?</span>
          <ChevronRight size={16} className="ml-auto shrink-0 text-white/45" />
        </button>

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-4 gap-2.5">
          {QUICK.map(({ icon: Icon, label, to, primary }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`pressable flex flex-col items-center gap-2 rounded-(--radius-md) py-3 ${
                primary
                  ? 'bg-white text-brand-700 shadow-(--shadow-e3)'
                  : 'bg-white/12 text-white ring-1 ring-white/15 backdrop-blur-md'
              }`}
            >
              <Icon size={19} />
              <span className="text-[10.5px] leading-none font-bold">{label}</span>
            </button>
          ))}
        </div>
      </BrandHeader>

      <ScreenBody className="pt-5">
        {/* Active deliveries */}
        <SectionHeader
          title="Active deliveries"
          subtitle={loading ? undefined : `${active.length} on the move`}
          action={active.length ? 'See all' : undefined}
          to="/sender/bookings"
        />

        {loading ? (
          <SkeletonList count={2} />
        ) : active.length === 0 ? (
          <Card className="py-2">
            <EmptyState
              compact
              art={<EmptyBoxArt />}
              title="Nothing in transit"
              body="Book your first parcel and watch it move city to city in real time."
              actionLabel="Book a parcel"
              actionTo="/sender/book"
            />
          </Card>
        ) : (
          <div className="stagger flex flex-col gap-3">
            {active.map((p) => (
              <ParcelCard key={p.id} parcel={p} to={`/sender/track/${p.id}`} />
            ))}
          </div>
        )}

        {/* Nearby hubs */}
        <div className="mt-7">
          <SectionHeader
            title="Hubs near you"
            subtitle={`${nearby.length} drop points in ${cityName('blr')}`}
            action="View map"
            to="/sender/book"
          />
          <Card padded={false} className="overflow-hidden">
            <HubMap height={148} hubIds={nearby.map((h) => h.id)} cityId="blr" activeIndex={0} />
            <div className="p-4">
              {hubsLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton w={36} h={36} radius={10} />
                      <div className="flex-1">
                        <Skeleton h={11} w="48%" radius={5} className="mb-1.5" />
                        <Skeleton h={9} w="68%" radius={5} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {nearby.map((h, i) => (
                    <button
                      key={h.id}
                      onClick={() => navigate('/sender/book')}
                      className="pressable flex items-center gap-3 text-left"
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-(--radius-sm) text-[12px] font-extrabold ${
                          i === 0 ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-bold text-ink-900">
                          {h.name.split('·').pop()?.trim()}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-500">
                          <Clock size={10.5} />
                          {h.openFrom} – {h.openTo}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-[12.5px] font-bold text-ink-700">
                        {h.distanceKm} km
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Savings strip */}
        <Card className="mt-5 flex items-center gap-3.5 border-success-100 bg-success-50">
          <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-success-500/15 text-success-600">
            <TrendingDown size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-success-800">
              You&apos;ve saved {inr(2340)} this year
            </p>
            <p className="mt-0.5 text-[12px] text-success-700/80">
              Compared to standard courier rates on the same routes
            </p>
          </div>
        </Card>

        {/* Recent */}
        <div className="mt-7">
          <SectionHeader title="Recent orders" action="History" to="/sender/bookings" />
          {loading ? (
            <SkeletonList count={2} />
          ) : recent.length === 0 ? (
            <Card>
              <p className="py-4 text-center text-[13px] text-ink-400">No past orders yet</p>
            </Card>
          ) : (
            <div className="stagger flex flex-col gap-3">
              {recent.map((p) => (
                <Card key={p.id} to={`/sender/track/${p.id}`} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-ink-500">
                    <Package size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="tabular truncate text-[13.5px] font-bold text-ink-900">{p.id}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
                      {cityName(p.fromCityId)} → {cityName(p.toCityId)} · {time(p.etaAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-[13px] font-bold text-ink-900">{inr(p.price)}</p>
                    <Badge
                      tone={p.status === 'delivered' ? 'success' : 'danger'}
                      size="sm"
                      className="mt-1"
                    >
                      {p.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <PromoBanner
            title="20% off Mysore drops"
            body="Valid on all bookings this week"
            code="MYSORE20"
            onClick={() => navigate('/sender/book')}
          />
        </div>
      </ScreenBody>
    </Screen>
  )
}

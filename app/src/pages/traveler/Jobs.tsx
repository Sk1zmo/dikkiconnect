import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, SlidersHorizontal } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  Card,
  ChipRow,
  Counter,
  EmptyState,
  IconButton,
  Note,
  Sheet,
  SkeletonList,
  Switch,
  useToast,
} from '@/components/ui'
import { JobCard } from '@/components/domain/Cards'
import { EmptyBoxArt } from '@/components/viz/Illustrations'
import { PARCEL_JOBS } from '@/lib/data'
import { inr } from '@/lib/format'
import { useLoaded } from '@/lib/hooks'

type SortKey = 'payout' | 'detour' | 'expiry'

export default function TravelerJobs() {
  const navigate = useNavigate()
  const toast = useToast()

  const [sort, setSort] = useState<SortKey>('payout')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [maxDetour, setMaxDetour] = useState(10)
  const [minPayout, setMinPayout] = useState(0)
  const [hideFragile, setHideFragile] = useState(false)
  const [accepting, setAccepting] = useState<string | null>(null)

  const { loading } = useLoaded(PARCEL_JOBS, 1000)

  const visible = useMemo(() => {
    let list = PARCEL_JOBS.filter((j) => j.detourKm <= maxDetour && j.payout >= minPayout)
    if (hideFragile) list = list.filter((j) => !j.fragile)

    return [...list].sort((a, b) => {
      if (sort === 'payout') return b.payout - a.payout
      if (sort === 'detour') return a.detourKm - b.detourKm
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    })
  }, [sort, maxDetour, minPayout, hideFragile])

  const totalPayout = visible.reduce((sum, j) => sum + j.payout, 0)

  const accept = (id: string) => {
    setAccepting(id)
    setTimeout(() => {
      setAccepting(null)
      toast.success('Added to manifest', 'Scan the QR at the hub to take custody.')
      navigate('/traveler/scan')
    }, 1000)
  }

  return (
    <Screen>
      <TopBar
        back
        backTo="/traveler"
        title="Available jobs"
        subtitle={loading ? 'Matching your route…' : `${visible.length} parcels · up to ${inr(totalPayout)}`}
        action={
          <IconButton
            icon={<SlidersHorizontal size={17} />}
            label="Filters"
            onClick={() => setFiltersOpen(true)}
          />
        }
      />

      <div className="shrink-0 px-5 pb-3">
        <ChipRow
          value={sort}
          onChange={setSort}
          options={[
            { value: 'payout', label: 'Highest payout' },
            { value: 'detour', label: 'Least detour' },
            { value: 'expiry', label: 'Expiring soon' },
          ]}
        />
      </div>

      <ScreenBody>
        {!loading && visible.length > 0 && (
          <Card className="mb-4 flex items-center gap-3.5 border-success-100 bg-success-50">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-success-500/15 text-success-600">
              <Briefcase size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-success-800">
                Take all {visible.length} and earn {inr(totalPayout)}
              </p>
              <p className="mt-0.5 text-[12px] text-success-700/85">
                Your boot has room for {Math.min(3, visible.length)} of these
              </p>
            </div>
          </Card>
        )}

        {loading ? (
          <SkeletonList count={4} />
        ) : visible.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              art={<EmptyBoxArt />}
              title="No jobs match your filters"
              body="Widen your detour range or lower the minimum payout to see more parcels."
              actionLabel="Reset filters"
              onAction={() => {
                setMaxDetour(10)
                setMinPayout(0)
                setHideFragile(false)
              }}
            />
          </Card>
        ) : (
          <div className="stagger flex flex-col gap-3">
            {visible.map((j) => (
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

        <Note tone="neutral" className="mt-5" title="How matching works">
          We only show parcels whose origin hub is on or near your declared route, sized to the boot
          space you published. Accepting one holds it for 45 minutes.
        </Note>
      </ScreenBody>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Job filters"
        footer={
          <button
            onClick={() => setFiltersOpen(false)}
            className="pressable h-12 w-full rounded-(--radius-md) bg-action text-[14.5px] font-bold text-white hover:bg-action-hover"
          >
            Show {visible.length} job{visible.length === 1 ? '' : 's'}
          </button>
        }
      >
        <div className="flex flex-col gap-5 py-1">
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-ink-700">Maximum detour</p>
            <Counter value={maxDetour} onChange={setMaxDetour} min={0} max={30} step={1} suffix="km" />
          </div>
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-ink-700">Minimum payout</p>
            <Counter value={minPayout} onChange={setMinPayout} min={0} max={500} step={25} suffix="₹" />
          </div>
          <div className="h-px bg-ink-100" />
          <Switch
            checked={hideFragile}
            onChange={setHideFragile}
            label="Hide fragile parcels"
            description="Fragile items need upright handling and extra care"
          />
        </div>
      </Sheet>
    </Screen>
  )
}

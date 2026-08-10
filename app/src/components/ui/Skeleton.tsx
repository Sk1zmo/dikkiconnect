import { cn } from '@/lib/cn'

/** Base shimmer block. Everything else here composes it. */
export function Skeleton({
  className,
  w,
  h,
  radius = 8,
  onBrand,
}: {
  className?: string
  w?: number | string
  h?: number | string
  radius?: number | string
  onBrand?: boolean
}) {
  return (
    <span
      aria-hidden
      className={cn('block', onBrand ? 'skeleton-on-brand' : 'skeleton', className)}
      style={{ width: w, height: h, borderRadius: radius }}
    />
  )
}

export function SkeletonText({
  lines = 3,
  className,
  onBrand,
}: {
  lines?: number
  className?: string
  onBrand?: boolean
}) {
  const widths = ['92%', '78%', '86%', '64%', '81%']
  return (
    <span className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} h={10} radius={5} w={widths[i % widths.length]} onBrand={onBrand} />
      ))}
    </span>
  )
}

/** Matches the shape of a parcel / trip card so the swap is seamless. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-(--radius-lg) border border-ink-100 bg-white p-4 shadow-(--shadow-e1)',
        className,
      )}
    >
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton w={44} h={44} radius={14} />
          <div className="flex-1">
            <Skeleton h={13} w="55%" radius={6} className="mb-2" />
            <Skeleton h={10} w="78%" radius={5} />
          </div>
        </div>
        <Skeleton w={72} h={24} radius={999} />
      </div>
      <Skeleton h={1} radius={0} className="mb-3.5 opacity-60" />
      <div className="flex items-center justify-between">
        <Skeleton h={10} w="38%" radius={5} />
        <Skeleton h={10} w="24%" radius={5} />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/** Avatar + two lines — for people rows and message threads. */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-3', className)}>
      <Skeleton w={42} h={42} radius={999} />
      <div className="flex-1">
        <Skeleton h={12} w="45%" radius={6} className="mb-2" />
        <Skeleton h={9} w="70%" radius={5} />
      </div>
      <Skeleton w={48} h={14} radius={6} />
    </div>
  )
}

/** Placeholder for map surfaces — keeps the blue tone while tiles "load". */
export function SkeletonMap({ height = 200, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-(--radius-lg) bg-brand-50', className)}
      style={{ height }}
    >
      <div className="skeleton absolute inset-0 opacity-70" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-ink-500 backdrop-blur">
          Loading map…
        </span>
      </div>
    </div>
  )
}

/** KPI tile skeleton for dashboards. */
export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-(--radius-lg) border border-ink-100 bg-white p-4 shadow-(--shadow-e1)',
        className,
      )}
    >
      <Skeleton w={30} h={30} radius={10} className="mb-3" />
      <Skeleton h={20} w="60%" radius={6} className="mb-2" />
      <Skeleton h={9} w="80%" radius={5} />
    </div>
  )
}

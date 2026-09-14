import { ErrorState } from '@/components/ui/Empty'
import { leaveMaintenance } from '@/lib/maintenance'

/**
 * The maintenance screen. Sits over the whole shell while the switch in
 * lib/maintenance is on. "Check again" clears it; if the API is still down
 * the next request flips it straight back, which is the honest loop.
 */
export function Maintenance() {
  return (
    <div className="absolute inset-0 z-150 flex flex-col justify-center bg-ink-50">
      <ErrorState kind="maintenance" onAction={leaveMaintenance} />
    </div>
  )
}

import { createContext, useContext, useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   Boot signal — how the launch screen knows the app is actually there.

   Nothing on the way in is a network call: the session is read from local
   storage synchronously and the typeface is applied before the first render.
   The one genuinely asynchronous step is the first route's chunk, which is
   lazy and resolves through a Suspense boundary in the layout. Until it does,
   what sits under the launch screen is the boundary's fallback — a loader —
   and lifting the screen at that moment would swap one waiting state for
   another.

   So the layouts report the moment their first route commits. `RouteSettled`
   sits inside the same Suspense boundary as the route: React commits nothing
   inside a boundary until everything in it has resolved, so its effect cannot
   fire while the fallback is showing. Idempotent, because the layouts remount
   as you move around the app and only the first report matters.
   ═══════════════════════════════════════════════════════════════════════════ */

const BootContext = createContext<() => void>(() => {})

export const BootProvider = BootContext.Provider

/** Drop inside a route Suspense boundary; reports once the route has committed. */
export function RouteSettled() {
  const settled = useContext(BootContext)
  useEffect(() => {
    settled()
  }, [settled])
  return null
}

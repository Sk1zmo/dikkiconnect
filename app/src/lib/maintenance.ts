import { useSyncExternalStore } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   Maintenance mode — one switch, two ways to flip it.

     · `VITE_MAINTENANCE=1` at build time: the whole build opens on the
       maintenance screen. For a planned window.
     · The API answering 503 at runtime: the first request that sees it flips
       the switch for this session, and the screen offers "check again",
       which clears it and lets the next request try.

   Parcels already on the road are not affected by either — the custody
   chain lives on the phone and at the hub — which is what the screen says.
   ═══════════════════════════════════════════════════════════════════════════ */

let active = import.meta.env.VITE_MAINTENANCE === '1'
const listeners = new Set<() => void>()

export function enterMaintenance() {
  if (active) return
  active = true
  listeners.forEach((l) => l())
}

export function leaveMaintenance() {
  if (!active) return
  active = false
  listeners.forEach((l) => l())
}

export function useMaintenance() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => active,
    () => active,
  )
}

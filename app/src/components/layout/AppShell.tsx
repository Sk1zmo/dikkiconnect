import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { ScreenLoader } from '@/components/ui'
import { BottomNav } from './BottomNav'
import { useOnline } from '@/lib/hooks'
import { useApp } from '@/lib/store'
import type { Role } from '@/lib/types'

/** Thin offline banner — appears the moment connectivity drops. */
function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 bg-ink-900 py-1.5 text-[11.5px] font-semibold text-white">
      <WifiOff size={13} />
      You&apos;re offline — showing your last synced data
    </div>
  )
}

/**
 * The phone canvas. Everything renders inside a fixed-height shell so the
 * bottom nav is pinned and only the page body scrolls — exactly like a native
 * app, and identical on desktop.
 */
export function DeviceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="device-stage">
      <div className="device-shell">
        <OfflineBanner />
        {children}
      </div>
    </div>
  )
}

/** Layout for the four tabbed mobile roles. */
export function RoleLayout({ role }: { role: Role }) {
  const location = useLocation()
  const { role: storedRole, setRole } = useApp()

  // Landing on /hub (deep link, refresh, portal switch) has to become the
  // active role, or the shared Wallet/Profile tabs and the portal switcher
  // keep reporting whichever role was last stored.
  useEffect(() => {
    if (storedRole !== role) setRole(role)
  }, [role, storedRole, setRole])

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<ScreenLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <RouteFrame key={location.pathname}>
              <Outlet />
            </RouteFrame>
          </AnimatePresence>
        </Suspense>
      </div>
      <BottomNav role={role} />
    </>
  )
}

/** Layout for full-bleed flows (booking, scanning, auth) — no tab bar. */
export function FlowLayout() {
  const location = useLocation()
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<ScreenLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          <RouteFrame key={location.pathname}>
            <Outlet />
          </RouteFrame>
        </AnimatePresence>
      </Suspense>
    </div>
  )
}

/** Keeps the animated wrapper out of AppShell so keys stay stable. */
function RouteFrame({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col">{children}</div>
}

/** Scrolls a freshly-mounted route back to the top. */
export function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.querySelectorAll('.device-scroll').forEach((el) => {
      el.scrollTop = 0
    })
  }, [pathname])
  return null
}

/** Shows a hairline progress bar while a lazy chunk resolves. */
export function useRouteChanging() {
  const { pathname } = useLocation()
  const [changing, setChanging] = useState(false)
  useEffect(() => {
    setChanging(true)
    const t = setTimeout(() => setChanging(false), 320)
    return () => clearTimeout(t)
  }, [pathname])
  return changing
}

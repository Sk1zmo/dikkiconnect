import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
        <RouteProgress />
        <OfflineBanner />
        {children}
      </div>
    </div>
  )
}

/**
 * A hairline that runs across the top while a route's chunk resolves. Two
 * hundred milliseconds of nothing reads as a dropped tap; two hundred
 * milliseconds of a moving line reads as loading.
 */
function RouteProgress() {
  const changing = useRouteChanging()
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <AnimatePresence>
      {changing && (
        <motion.span
          key="route-progress"
          className="absolute inset-x-0 top-0 z-100 h-[2.5px] origin-left bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
        />
      )}
    </AnimatePresence>
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
            <RouteFrame key={location.pathname} variant="tab">
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
          <RouteFrame key={location.pathname} variant="flow">
            <Outlet />
          </RouteFrame>
        </AnimatePresence>
      </Suspense>
    </div>
  )
}

/**
 * Route transitions.
 *
 * Two different gestures, because the two layouts mean different things.
 * Switching tabs is lateral movement between peers, so it gets a quick lift
 * and fade — anything more literal turns a one-tap switch into a wait. Moving
 * through a flow is directional, so it slides: forward pushes in from the
 * right, Back pulls in from the left, which is the only cue that tells you
 * whether you advanced or retreated.
 *
 * Exits are deliberately faster than entrances (a third of the duration). The
 * screen you are leaving has nothing left to say, and the asymmetry is what
 * keeps the whole thing feeling quick rather than animated-at.
 */
function RouteFrame({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: 'tab' | 'flow'
}) {
  const navigationType = useNavigationType()
  const reduced = useReducedMotion()

  if (reduced) return <div className="flex h-full min-h-0 flex-col">{children}</div>

  const back = navigationType === 'POP'
  const slide = variant === 'flow' ? (back ? -26 : 26) : 0

  return (
    <motion.div
      className="flex h-full min-h-0 flex-col"
      initial={{ opacity: 0, x: slide, y: variant === 'tab' ? 8 : 0 }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
      }}
      exit={{
        opacity: 0,
        x: -slide * 0.55,
        y: variant === 'tab' ? -4 : 0,
        transition: { duration: 0.11, ease: [0.4, 0, 1, 1] },
      }}
    >
      {children}
    </motion.div>
  )
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

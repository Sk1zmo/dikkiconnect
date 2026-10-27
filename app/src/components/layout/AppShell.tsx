import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowsClockwise, CellSignalLow, CheckCircle, WifiSlash } from '@phosphor-icons/react'
import { ScreenLoader } from '@/components/ui'
import { DemoBadge } from '@/components/brand/DemoBadge'
import { Tour } from '@/components/domain/Tour'
import { BottomNav } from './BottomNav'
import { ErrorBoundary } from './ErrorBoundary'
import { RouteSettled } from '@/lib/boot'
import { TabBarProvider } from '@/lib/chrome'
import { NETWORK } from '@/lib/copy'
import { useConnection, useUpdateReady } from '@/lib/hooks'
import { useApp } from '@/lib/store'
import { registerRemotePush } from '@/lib/push'
import { push as pushApi } from '@/lib/api'
import type { Role } from '@/lib/types'

const HOME: Record<Role, string> = { sender: '/sender', traveler: '/traveler', passenger: '/passenger', hub: '/hub' }

/**
 * One strip for the state of the line. Offline is dark and stays; slow is
 * amber and stays while it is slow; "back online" is green for a breath and
 * goes, so the recovery is acknowledged and then out of the way. Below it,
 * if the service worker has fetched a newer build, a one-tap reload.
 */
function NetworkBanner() {
  const { online, slow, justBack } = useConnection()
  const updateReady = useUpdateReady()

  const line = !online
    ? { icon: <WifiSlash size={13} />, text: NETWORK.offline, tone: 'bg-ink-900 text-white' }
    : justBack
      ? { icon: <CheckCircle size={13} />, text: NETWORK.back, tone: 'bg-success-600 text-white' }
      : slow
        ? { icon: <CellSignalLow size={13} />, text: NETWORK.slow, tone: 'bg-warn-500 text-ink-900' }
        : null

  return (
    <AnimatePresence initial={false}>
      {line && (
        <motion.div
          key={line.text}
          role="status"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className={`flex shrink-0 items-center justify-center gap-2 overflow-hidden text-[11.5px] font-semibold ${line.tone}`}
        >
          <span className="flex items-center gap-2 py-1.5">
            {line.icon}
            {line.text}
          </span>
        </motion.div>
      )}
      {updateReady && (
        <motion.button
          key="update"
          onClick={() => window.location.reload()}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="pressable flex shrink-0 items-center justify-center gap-2 overflow-hidden bg-brand-600 text-[11.5px] font-semibold text-white"
        >
          <span className="flex items-center gap-2 py-1.5">
            <ArrowsClockwise size={13} />
            A newer WayPool is ready — tap to reload
          </span>
        </motion.button>
      )}
    </AnimatePresence>
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
        <DemoBadge />
        <NetworkBanner />
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
  const navigate = useNavigate()
  const { role: storedRole, setRole, authed } = useApp()

  // Landing on /hub (deep link, refresh, portal switch) has to become the
  // active role, or the shared Wallet/Profile tabs and the portal switcher
  // keep reporting whichever role was last stored.
  useEffect(() => {
    if (storedRole !== role) setRole(role)
  }, [role, storedRole, setRole])

  /* Remote push, once per signed-in session.
     
     Here rather than at launch because this component only renders for
     somebody who is signed in, and a device token is meaningless without an
     account to attach it to. The OS permission prompt therefore arrives
     after sign-in, in context, rather than on a cold first launch when there
     is nothing to notify anyone about. */
  useEffect(() => {
    if (!authed) return
    let cancelled = false
    void registerRemotePush(
      async (token, platform) => {
        if (cancelled) return
        try {
          await pushApi.register(token, platform)
        } catch {
          /* An unreachable server is not worth a message here — the person
             did not ask for this and nothing they can see is broken. */
        }
      },
      (href) => navigate(href),
    )
    return () => {
      cancelled = true
    }
  }, [authed, navigate])

  return (
    /* Everything under here has a tab bar below it, which owns the bottom
       safe-area inset. ActionBar reads this so it does not pay it twice. */
    <TabBarProvider>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ErrorBoundary resetKey={location.pathname} onHome={() => navigate(HOME[role])}>
          <Suspense fallback={<ScreenLoader />}>
            <AnimatePresence mode="wait" initial={false}>
              <RouteFrame key={location.pathname} variant="tab">
                <Outlet />
              </RouteFrame>
            </AnimatePresence>
            <RouteSettled />
          </Suspense>
        </ErrorBoundary>
      </div>
      <BottomNav role={role} />
      {/* Above the tab bar, inside the shell, so switching portals shows that
          portal's tour and nothing else has to know about it. */}
      <Tour />
    </TabBarProvider>
  )
}

/** Layout for full-bleed flows (booking, scanning, auth) — no tab bar. */
export function FlowLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { role } = useApp()
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ErrorBoundary resetKey={location.pathname} onHome={() => navigate(HOME[role] ?? '/')}>
        <Suspense fallback={<ScreenLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <RouteFrame key={location.pathname} variant="flow">
              <Outlet />
            </RouteFrame>
          </AnimatePresence>
          <RouteSettled />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

/**
 * Route transitions.
 *
 * A grid of blue squares used to flood the frame on every navigation, swap
 * the screens underneath itself, and drain — about 620ms, every tap. It was
 * striking the first time and tiring by the tenth, and it made a fast app
 * feel deliberate in the worst sense.
 *
 * What replaced it is nearly nothing: 120ms of crossfade, with a few pixels
 * of directional slide on flow screens so forward and back still read as
 * forward and back. Navigation should feel like the screen was already
 * there. The waiting mark (ScreenLoader) carries the weight instead, and it
 * only appears when there is genuinely something to wait for.
 *
 * Under reduced motion the frames swap with no animation at all.
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
  const slide = variant === 'flow' ? (back ? -12 : 12) : 0

  return (
    <motion.div
      className="flex h-full min-h-0 flex-col"
      initial={{ opacity: 0, x: slide }}
      animate={{
        opacity: 1,
        x: 0,
        transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] },
      }}
      /* Shorter than the entrance, and no travel: the outgoing screen should
         get out of the way, not perform. `mode="wait"` means this runs to
         completion first, so every millisecond here is a millisecond before
         the next screen appears. */
      exit={{
        opacity: 0,
        transition: { duration: 0.08, ease: 'linear' },
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

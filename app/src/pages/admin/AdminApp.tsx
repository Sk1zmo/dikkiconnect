import { Suspense, lazy } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  Car,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Route as RouteIcon,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Avatar, ScreenLoader } from '@/components/ui'
import { cn } from '@/lib/cn'

const Dashboard = lazy(() => import('./Dashboard'))
const AdminUsers = lazy(() => import('./Users'))
const AdminDrivers = lazy(() => import('./Drivers'))
const AdminTrips = lazy(() => import('./Trips'))
const AdminParcels = lazy(() => import('./Parcels'))
const AdminPayments = lazy(() => import('./Payments'))
const AdminDisputes = lazy(() => import('./Disputes'))
const AdminAnalytics = lazy(() => import('./Analytics'))
const AdminSettings = lazy(() => import('./AdminSettings'))

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/drivers', label: 'Drivers & KYC', icon: Car },
  { to: '/admin/trips', label: 'Trips', icon: RouteIcon },
  { to: '/admin/parcels', label: 'Parcels', icon: Package },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/disputes', label: 'Disputes', icon: LifeBuoy, badge: 3 },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

/** Desktop operations console. Renders outside the phone shell. */
export default function AdminApp() {
  return (
    <div className="relative flex h-dvh bg-ink-50 text-ink-900">
      {/* Sidebar */}
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-ink-200 bg-white">
        <div className="flex items-center gap-2 border-b border-ink-200 px-5 py-4">
          <Logo size="sm" />
          <span className="ml-auto rounded-full bg-ink-900 px-2 py-0.5 text-[9.5px] font-extrabold tracking-wide text-white">
            OPS
          </span>
        </div>

        <nav className="scroll-slim flex-1 overflow-y-auto p-3" aria-label="Admin sections">
          <ul className="flex flex-col gap-0.5">
            {NAV.map(({ to, label, icon: Icon, end, badge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-(--radius-sm) px-3 py-2.5 text-[13.5px] font-semibold transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} strokeWidth={isActive ? 2.3 : 1.9} className="shrink-0" />
                      <span className="truncate">{label}</span>
                      {badge && (
                        <span className="ml-auto grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-ink-200 p-3">
          <div className="flex items-center gap-3 rounded-(--radius-sm) px-2 py-2">
            <Avatar name="Ops Team" size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink-900">Ops Team</p>
              <p className="truncate text-[11px] text-ink-500">Super admin</p>
            </div>
          </div>
          <p className="mt-2 px-2 text-[10.5px] text-ink-400">
            DikkiConnect Ops 1.0 · BLR ↔ MYS pilot
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-4 border-b border-ink-200 bg-white px-6 py-3">
          <div className="flex h-9 w-full max-w-[420px] items-center gap-2.5 rounded-full border border-ink-200 bg-ink-50 px-4">
            <Search size={15} className="shrink-0 text-ink-400" />
            <input
              placeholder="Search parcels, users, trips…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 placeholder:text-ink-400"
            />
            <kbd className="shrink-0 rounded border border-ink-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">
              ⌘K
            </kbd>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-[11.5px] font-bold text-success-700">
              <span className="relative flex size-1.5">
                <span className="anim-ping absolute inline-flex size-full rounded-full bg-success-500" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success-500" />
              </span>
              All systems normal
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-[11.5px] font-semibold text-ink-600">
              <Building2 size={13} />6 hubs live
            </span>
          </div>
        </header>

        <main className="scroll-slim flex-1 overflow-y-auto p-6">
          <Suspense fallback={<ScreenLoader label="Loading console" />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/drivers" element={<AdminDrivers />} />
              <Route path="/trips" element={<AdminTrips />} />
              <Route path="/parcels" element={<AdminParcels />} />
              <Route path="/payments" element={<AdminPayments />} />
              <Route path="/disputes" element={<AdminDisputes />} />
              <Route path="/analytics" element={<AdminAnalytics />} />
              <Route path="/settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

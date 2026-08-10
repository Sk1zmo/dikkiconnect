import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Package, MapPin, Wallet, User,
  LayoutDashboard, Briefcase, QrCode, Clock,
  Search, CalendarDays, MessageCircle,
  Archive,
} from 'lucide-react'

type NavItem = { icon: React.ElementType; label: string; path: string }

const SENDER_TABS: NavItem[] = [
  { icon: Home, label: 'Home', path: '/sender' },
  { icon: Package, label: 'Bookings', path: '/sender/bookings' },
  { icon: MapPin, label: 'Track', path: '/sender/track' },
  { icon: Wallet, label: 'Wallet', path: '/sender/wallet' },
  { icon: User, label: 'Profile', path: '/sender/profile' },
]

const TRAVELER_TABS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/traveler' },
  { icon: Briefcase, label: 'Jobs', path: '/traveler/jobs' },
  { icon: QrCode, label: 'Scanner', path: '/traveler/scan' },
  { icon: Wallet, label: 'Wallet', path: '/traveler/wallet' },
  { icon: User, label: 'Profile', path: '/traveler/profile' },
]

const PASSENGER_TABS: NavItem[] = [
  { icon: Search, label: 'Search', path: '/passenger' },
  { icon: CalendarDays, label: 'Bookings', path: '/passenger/bookings' },
  { icon: MessageCircle, label: 'Messages', path: '/passenger/messages' },
  { icon: Wallet, label: 'Wallet', path: '/passenger/wallet' },
  { icon: User, label: 'Profile', path: '/passenger/profile' },
]

const HUB_TABS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/hub' },
  { icon: Archive, label: 'Inventory', path: '/hub/inventory' },
  { icon: QrCode, label: 'Scanner', path: '/hub/scan' },
  { icon: Clock, label: 'History', path: '/hub/history' },
  { icon: User, label: 'Profile', path: '/hub/profile' },
]

const ROLE_TABS: Record<string, NavItem[]> = {
  sender: SENDER_TABS,
  traveler: TRAVELER_TABS,
  passenger: PASSENGER_TABS,
  hub: HUB_TABS,
}

function detectRole(pathname: string): string {
  if (pathname.startsWith('/traveler')) return 'traveler'
  if (pathname.startsWith('/passenger')) return 'passenger'
  if (pathname.startsWith('/hub')) return 'hub'
  return 'sender'
}

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const role = detectRole(location.pathname)
  const tabs = ROLE_TABS[role] ?? SENDER_TABS

  return (
    <div
      className="safe-bottom"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background: '#fff',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {tabs.map(({ icon: Icon, label, path }) => {
        const exact = path === `/sender` || path === `/traveler` || path === `/passenger` || path === `/hub`
        const isActive = exact
          ? location.pathname === path || location.pathname === path + '/'
          : location.pathname.startsWith(path)

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '10px 4px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 6,
                width: 4,
                height: 4,
                borderRadius: 2,
                background: 'var(--blue)',
              }} />
            )}
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.75}
              color={isActive ? 'var(--blue)' : '#94A3B8'}
              fill={isActive ? 'rgba(27,68,232,0.1)' : 'none'}
            />
            <span style={{
              fontSize: 10.5,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--blue)' : '#94A3B8',
              letterSpacing: '0.01em',
              lineHeight: 1,
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

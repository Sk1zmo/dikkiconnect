import { NavLink } from 'react-router-dom'
import {
  Archive,
  CalendarCheck,
  ClipboardText,
  House,
  MagnifyingGlass,
  Package,
  MapPinLine,
  QrCode,
  SquaresFour,
  ChatCircleDots,
  User,
  Wallet,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import type { Role } from '@/lib/types'
import { useApp } from '@/lib/store'

export interface NavTab {
  to: string
  label: string
  icon: PhosphorIcon
  end?: boolean
  badge?: 'unread'
}

export const ROLE_TABS: Record<Role, NavTab[]> = {
  sender: [
    { to: '/sender', label: 'Home', icon: House, end: true },
    { to: '/sender/bookings', label: 'Bookings', icon: Package },
    { to: '/sender/track', label: 'Track', icon: MapPinLine },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  traveler: [
    { to: '/traveler', label: 'Dashboard', icon: SquaresFour, end: true },
    { to: '/traveler/trips', label: 'Trips', icon: CalendarCheck },
    { to: '/traveler/scan', label: 'Scan', icon: QrCode },
    { to: '/wallet', label: 'Earnings', icon: Wallet },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  passenger: [
    { to: '/passenger', label: 'Search', icon: MagnifyingGlass, end: true },
    { to: '/passenger/bookings', label: 'Rides', icon: CalendarCheck },
    { to: '/passenger/messages', label: 'Messages', icon: ChatCircleDots, badge: 'unread' },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  hub: [
    { to: '/hub', label: 'Dashboard', icon: SquaresFour, end: true },
    { to: '/hub/inventory', label: 'Inventory', icon: Archive },
    { to: '/hub/scan', label: 'Scan', icon: QrCode },
    { to: '/hub/history', label: 'History', icon: ClipboardText },
    { to: '/profile', label: 'Profile', icon: User },
  ],
}

/**
 * Floating tab bar.
 *
 * The selected tab swaps to a genuinely filled glyph rather than tinting an
 * outline — that solid-vs-outline contrast is what makes a bar read as native
 * (it is what Instagram, Airbnb and Uber all do) and no amount of colour on a
 * stroked icon substitutes for it.
 *
 * That contrast is also the whole indicator. A tonal pill used to slide along
 * behind the icons; with fill and weight already saying which tab is live, it
 * was a third signal doing the job twice and moving while it did it.
 */
export function BottomNav({ role }: { role: Role }) {
  const tabs = ROLE_TABS[role]
  const { unread } = useApp()

  return (
    <nav
      className="pb-safe relative z-50 shrink-0 border-t border-ink-200 bg-white"
      aria-label="Primary"
    >
      <div className="relative flex">
        {tabs.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to + label}
            to={to}
            end={end}
            className="focus-ring springy-sm relative flex flex-1 flex-col items-center justify-center gap-[3px] pt-2.5 pb-2"
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon
                    size={22}
                    weight={isActive ? 'fill' : 'regular'}
                    className={cn(
                      'transition-colors duration-150',
                      isActive ? 'text-ink-900' : 'text-ink-400',
                    )}
                  />
                  {badge === 'unread' && unread > 0 && (
                    <span className="absolute -top-1 -right-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[10px] leading-none font-semibold tracking-[0.01em] transition-colors duration-150',
                    isActive ? 'text-ink-900' : 'text-ink-400',
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

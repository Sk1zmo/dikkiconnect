import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
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
 * stroked icon substitutes for it. On top of that: a tonal pill that springs
 * between positions, and an icon that overshoots on selection so the tap feels
 * answered rather than merely registered.
 */
export function BottomNav({ role }: { role: Role }) {
  const tabs = ROLE_TABS[role]
  const location = useLocation()
  const { unread } = useApp()

  const activeIndex = tabs.findIndex((t) =>
    t.end ? location.pathname === t.to : location.pathname.startsWith(t.to),
  )

  return (
    <nav
      className="pb-safe glass relative z-50 shrink-0 border-t border-ink-200/70"
      aria-label="Primary"
    >
      {/* Sliding indicator — a touch under-damped so it settles with a nudge */}
      {activeIndex >= 0 && (
        <motion.span
          className="pointer-events-none absolute top-1.5 h-[42px] rounded-full bg-brand-50"
          style={{ width: `calc(${100 / tabs.length}% - 14px)` }}
          initial={false}
          animate={{ left: `calc(${(activeIndex * 100) / tabs.length}% + 7px)` }}
          transition={{ type: 'spring', stiffness: 520, damping: 30, mass: 0.8 }}
        />
      )}

      <div className="relative flex">
        {tabs.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to + label}
            to={to}
            end={end}
            className="focus-ring springy-sm relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl pt-2.5 pb-2"
          >
            {({ isActive }) => (
              <>
                <motion.span
                  className="relative"
                  initial={false}
                  animate={{ scale: isActive ? 1 : 0.92, y: isActive ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 16, mass: 0.6 }}
                >
                  <Icon
                    size={22}
                    weight={isActive ? 'fill' : 'regular'}
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-brand-600' : 'text-ink-400',
                    )}
                  />
                  {badge === 'unread' && unread > 0 && (
                    <span className="absolute -top-1 -right-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </motion.span>
                <span
                  className={cn(
                    'text-[10px] leading-none font-bold tracking-[0.01em] transition-colors duration-200',
                    isActive ? 'text-brand-700' : 'text-ink-400',
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

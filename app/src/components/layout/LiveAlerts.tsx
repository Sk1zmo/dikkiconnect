import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CreditCard, Package, ShieldCheck, Sparkle, Users, Warning, X } from '@phosphor-icons/react'
import { LIVE_ALERT_EVENT } from '@/lib/push'
import { TIER_META, tierOf } from '@/lib/notifications'
import { useApp } from '@/lib/store'
import type { NotificationItem } from '@/lib/types'
import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   Live alerts — a notification, while you are looking.

   When something happens with the app open, the OS tray is the wrong place
   for it. This drops in from the top of the shell: icon, title, one line,
   the tier as a word, tap to go, swipe up or × to dismiss. Custody alerts
   stay eight seconds and pulse once; the softer tiers go after five. One at
   a time — a second one queues behind the first rather than stacking.
   ═══════════════════════════════════════════════════════════════════════════ */

const ICON: Record<NotificationItem['kind'], typeof Package> = {
  parcel: Package,
  ride: Users,
  payment: CreditCard,
  kyc: ShieldCheck,
  promo: Sparkle,
  alert: Warning,
}

const TONE = {
  critical: 'border-brand-200 bg-white',
  contextual: 'border-ink-200 bg-white',
  marketing: 'border-accent-100 bg-white',
} as const

export function LiveAlerts() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const { markRead } = useApp()
  const [queue, setQueue] = useState<NotificationItem[]>([])
  const current = queue[0]

  useEffect(() => {
    const on = (e: Event) => setQueue((q) => [...q, (e as CustomEvent<NotificationItem>).detail])
    window.addEventListener(LIVE_ALERT_EVENT, on)
    return () => window.removeEventListener(LIVE_ALERT_EVENT, on)
  }, [])

  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => setQueue((q) => q.slice(1)), tierOf(current) === 'critical' ? 8000 : 5000)
    return () => clearTimeout(t)
  }, [current])

  const dismiss = () => setQueue((q) => q.slice(1))
  const open = () => {
    if (!current) return
    markRead(current.id)
    dismiss()
    navigate(current.href ?? '/notifications')
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-120 flex justify-center px-3 pt-safe-3">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            role="status"
            aria-live="polite"
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0.05 }}
            onDragEnd={(_, info) => info.offset.y < -40 && dismiss()}
            initial={{ y: reduced ? 0 : -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : -60, opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cn(
              'pointer-events-auto flex w-full max-w-[400px] items-start gap-3 rounded-(--radius-lg) border p-3.5 shadow-(--shadow-sheet)',
              TONE[tierOf(current)],
            )}
          >
            <button onClick={open} className="flex min-w-0 flex-1 items-start gap-3 text-left">
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-(--radius-sm)',
                  tierOf(current) === 'critical' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600',
                )}
              >
                {(() => {
                  const Icon = ICON[current.kind]
                  return <Icon size={18} weight="fill" />
                })()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-bold text-ink-900">{current.title}</span>
                  <span className="ml-auto shrink-0 text-[10px] font-bold tracking-wide text-ink-400 uppercase">
                    {TIER_META[tierOf(current)].label}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-[1.45] text-ink-600">{current.body}</span>
              </span>
            </button>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="pressable-sm -mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-ink-100"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

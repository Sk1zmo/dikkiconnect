import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useScrollLock } from '@/lib/hooks'

/** Under-damped just enough that the sheet lands with a settle, not a thud. */
const SPRING = { type: 'spring' as const, stiffness: 460, damping: 34, mass: 0.85 }

/**
 * Bottom sheet with drag-to-dismiss. Constrained to the phone shell so it
 * behaves the same on desktop as it does on a device.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  dismissible = true,
  fullHeight,
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  dismissible?: boolean
  fullHeight?: boolean
}) {
  useScrollLock(open)

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-90 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'relative flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[26px] bg-white shadow-(--shadow-e4)',
              fullHeight ? 'h-[92%]' : 'max-h-[88%]',
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING}
            drag={dismissible ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 620) onClose()
            }}
          >
            {dismissible && (
              <div className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing">
                <span className="h-1 w-10 rounded-full bg-ink-300" />
              </div>
            )}

            {title && (
              <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3">
                <div className="min-w-0">
                  <h2 className="text-display text-[19px] font-bold text-ink-900">{title}</h2>
                  {subtitle && <p className="mt-1 text-[13px] text-ink-500">{subtitle}</p>}
                </div>
                {dismissible && (
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="pressable-sm -mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-500"
                  >
                    <X size={16} strokeWidth={2.6} />
                  </button>
                )}
              </div>
            )}

            <div className="device-scroll flex-1 px-5 pb-5">{children}</div>

            {footer && (
              <div className="pb-safe border-t border-ink-100 bg-white px-5 py-4">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Centred dialog for confirmations and results. */
export function Modal({
  open,
  onClose,
  children,
  dismissible = true,
  className,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  dismissible?: boolean
  className?: string
}) {
  useScrollLock(open)
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-90 flex items-center justify-center p-6">
          <motion.div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative w-full max-w-[340px] overflow-hidden rounded-(--radius-xl) bg-white shadow-(--shadow-e4)',
              className,
            )}
            initial={{ opacity: 0, scale: 0.86, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 520, damping: 26, mass: 0.7 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Ready-made confirm dialog — icon, copy, two actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  icon,
  plainIcon,
  tone = 'brand',
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  icon?: ReactNode
  /** Renders the icon without the tinted disc — for art that brings its own. */
  plainIcon?: boolean
  tone?: 'brand' | 'danger' | 'success' | 'warn'
  title: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}) {
  const tones = {
    brand: { wash: 'bg-brand-50 text-brand-600', btn: 'bg-action hover:bg-action-hover text-white' },
    danger: {
      wash: 'bg-danger-50 text-danger-600',
      btn: 'bg-danger-600 hover:bg-danger-700 text-white',
    },
    success: {
      wash: 'bg-success-50 text-success-600',
      btn: 'bg-success-600 hover:bg-success-700 text-white',
    },
    warn: { wash: 'bg-warn-50 text-warn-600', btn: 'bg-warn-600 hover:bg-warn-700 text-white' },
  }[tone]

  return (
    <Modal open={open} onClose={onClose} dismissible={!loading}>
      <div className="p-6 text-center">
        {icon && (
          <div className={cn('mx-auto mb-4 grid place-items-center', plainIcon ? 'w-fit' : cn('anim-boing size-14 rounded-full', tones.wash))}>
            {icon}
          </div>
        )}
        <h3 className="text-display text-[18px] font-bold text-ink-900">{title}</h3>
        {body && <div className="mt-2 text-[13.5px] leading-[1.55] text-ink-500">{body}</div>}
        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="pressable h-12 flex-1 rounded-(--radius-md) bg-ink-100 text-[14.5px] font-semibold text-ink-700 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'pressable h-12 flex-1 rounded-(--radius-md) text-[14.5px] font-semibold disabled:opacity-60',
              tones.btn,
            )}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/** iOS-style action list. */
export function ActionSheet({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean
  onClose: () => void
  title?: string
  actions: Array<{ label: string; icon?: ReactNode; onClick: () => void; destructive?: boolean }>
}) {
  useScrollLock(open)
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-90 flex items-end justify-center p-3">
          <motion.div
            className="absolute inset-0 bg-ink-950/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="pb-safe relative w-full max-w-[420px]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={SPRING}
          >
            <div className="glass overflow-hidden rounded-(--radius-xl) shadow-(--shadow-e4)">
              {title && (
                <p className="border-b border-ink-200/60 px-4 py-3 text-center text-[12px] font-semibold text-ink-500">
                  {title}
                </p>
              )}
              {actions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => {
                    a.onClick()
                    onClose()
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-ink-200/50 px-5 py-4 text-[15px] font-semibold transition-colors last:border-0 hover:bg-white/60 active:bg-white/80',
                    a.destructive ? 'text-danger-600' : 'text-ink-800',
                  )}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="pressable mt-2 h-13 w-full rounded-(--radius-xl) bg-white text-[15px] font-bold text-ink-800 shadow-(--shadow-e3)"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

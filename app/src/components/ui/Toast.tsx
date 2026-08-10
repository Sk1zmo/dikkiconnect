import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'info' | 'warn'

interface Toast {
  id: number
  tone: ToastTone
  title: string
  body?: string
}

interface ToastApi {
  show: (t: Omit<Toast, 'id'>) => void
  success: (title: string, body?: string) => void
  error: (title: string, body?: string) => void
  info: (title: string, body?: string) => void
  warn: (title: string, body?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const TONE_META: Record<ToastTone, { icon: ReactNode; ring: string }> = {
  success: { icon: <CheckCircle2 size={19} className="text-success-500" />, ring: 'ring-success-500/25' },
  error: { icon: <XCircle size={19} className="text-danger-500" />, ring: 'ring-danger-500/25' },
  info: { icon: <Info size={19} className="text-brand-400" />, ring: 'ring-brand-500/25' },
  warn: { icon: <AlertTriangle size={19} className="text-warn-500" />, ring: 'ring-warn-500/25' },
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId++
    setToasts((list) => [...list, { ...t, id }].slice(-3))
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3600)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, body) => show({ tone: 'success', title, body }),
      error: (title, body) => show({ tone: 'error', title, body }),
      info: (title, body) => show({ tone: 'info', title, body }),
      warn: (title, body) => show({ tone: 'warn', title, body }),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-100 flex flex-col items-center gap-2 px-4 pt-3">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -26, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className={cn(
                'pointer-events-auto flex w-full max-w-[380px] items-start gap-3 rounded-(--radius-md) bg-ink-900/95 px-4 py-3 text-white shadow-(--shadow-e4) ring-1 backdrop-blur-lg',
                TONE_META[t.tone].ring,
              )}
            >
              <span className="mt-px shrink-0">{TONE_META[t.tone].icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">{t.title}</p>
                {t.body && <p className="mt-0.5 text-[12px] leading-snug text-white/70">{t.body}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

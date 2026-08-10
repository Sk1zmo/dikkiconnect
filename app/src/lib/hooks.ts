import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   Async / loading primitives.
   Every list in the app goes through `useLoaded` so skeletons are real —
   they represent an actual pending state, not a decorative delay.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Resolves `value` after a simulated network delay. Returns a loading flag. */
export function useLoaded<T>(value: T, delay = 900): { data: T | null; loading: boolean } {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), delay)
    return () => clearTimeout(t)
    // Re-run when the delay changes; `value` is captured fresh each render.
  }, [delay])
  return { data: loading ? null : value, loading }
}

type AsyncState<T> = { data: T | null; loading: boolean; error: Error | null }

/** Full async lifecycle with retry — used by screens that can fail. */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let alive = true
    setState({ data: null, loading: true, error: null })
    fnRef
      .current()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error: Error) => alive && setState({ data: null, loading: false, error }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps])

  return { ...state, reload: () => setNonce((n) => n + 1) }
}

/** Simulated network call with configurable latency and failure rate. */
export function fakeFetch<T>(value: T, ms = 800, failRate = 0): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failRate > 0 && Math.random() < failRate) reject(new Error('Network request failed'))
      else resolve(value)
    }, ms)
  })
}

/* ═══════════════════════════════════════════════════════════════════════════
   Timing
   ═══════════════════════════════════════════════════════════════════════════ */

/** Countdown in seconds. Returns remaining + a restart fn. */
export function useCountdown(seconds: number, autoStart = true) {
  const [left, setLeft] = useState(autoStart ? seconds : 0)

  useEffect(() => {
    if (left <= 0) return
    const t = setInterval(() => setLeft((v) => (v <= 1 ? 0 : v - 1)), 1000)
    return () => clearInterval(t)
  }, [left])

  const restart = useCallback((s = seconds) => setLeft(s), [seconds])

  /** m:ss under an hour, h:mm:ss over it — never "167:58". */
  const label = useMemo(() => {
    const h = Math.floor(left / 3600)
    const m = Math.floor((left % 3600) / 60)
    const s = left % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }, [left])

  return { left, label, restart, done: left === 0 }
}

/** setInterval that respects a null delay to pause. */
export function useInterval(cb: () => void, delay: number | null) {
  const saved = useRef(cb)
  saved.current = cb
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/** Animates a number from 0 → target. Used on wallet balances and KPIs. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // ease-out-expo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

/** Steps a progress value 0→100 over `ms`, then holds. */
export function useFakeProgress(ms = 2400, active = true) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      setV(Math.round((1 - Math.pow(1 - t, 3)) * 100))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ms, active])
  return v
}

/* ═══════════════════════════════════════════════════════════════════════════
   UI helpers
   ═══════════════════════════════════════════════════════════════════════════ */

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial)
  return {
    open,
    onOpen: useCallback(() => setOpen(true), []),
    onClose: useCallback(() => setOpen(false), []),
    onToggle: useCallback(() => setOpen((v) => !v), []),
    setOpen,
  }
}

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Locks body scroll while a sheet/modal is open. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

/** True once the element has entered the viewport — drives reveal-on-scroll. */
export function useInView<T extends HTMLElement>(rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin])
  return { ref, inView }
}

/** Browser online/offline — powers the offline banner. */
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}

/** Persisted state, resilient to blocked storage. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }, [key, value])
  return [value, setValue] as const
}

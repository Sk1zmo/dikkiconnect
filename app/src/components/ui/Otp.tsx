import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * OTP entry. Custody handoffs in DikkiConnect are OTP-gated (PRD §6), so this gets
 * used on six different screens — paste, arrow keys and backspace all behave.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  autoFocus = true,
  size = 'md',
  tone = 'light',
  disabled = false,
}: {
  length?: number
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  error?: boolean
  autoFocus?: boolean
  size?: 'sm' | 'md'
  tone?: 'light' | 'dark'
  /** Locked out after too many wrong attempts. */
  disabled?: boolean
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const [active, setActive] = useState(0)
  const chars = value.padEnd(length, ' ').slice(0, length).split('')
  const completedRef = useRef(false)

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (value.length === length && !completedRef.current) {
      completedRef.current = true
      onComplete?.(value)
    }
    if (value.length < length) completedRef.current = false
  }, [value, length, onComplete])

  const setAt = (i: number, char: string) => {
    const next = chars.slice()
    next[i] = char
    onChange(next.join('').replace(/\s+$/, ''))
  }

  const handleChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return

    if (digits.length > 1) {
      // Paste / autofill
      const merged = (value.slice(0, i) + digits).slice(0, length)
      onChange(merged)
      const focusAt = Math.min(merged.length, length - 1)
      refs.current[focusAt]?.focus()
      setActive(focusAt)
      return
    }

    setAt(i, digits)
    if (i < length - 1) {
      refs.current[i + 1]?.focus()
      setActive(i + 1)
    }
  }

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (chars[i].trim()) {
        setAt(i, ' ')
      } else if (i > 0) {
        setAt(i - 1, ' ')
        refs.current[i - 1]?.focus()
        setActive(i - 1)
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const box = size === 'sm' ? 'h-13 w-11 text-[20px]' : 'h-16 w-[52px] text-[24px]'

  return (
    <div className={cn('flex justify-center', size === 'sm' ? 'gap-2' : 'gap-2.5')}>
      {chars.map((char, i) => {
        const filled = char.trim().length > 0
        const isActive = active === i
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={char.trim()}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onFocus={() => setActive(i)}
            type="tel"
            inputMode="numeric"
            disabled={disabled}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            className={cn(
              'rounded-(--radius-md) border-2 text-center font-extrabold transition-all duration-200 outline-none',
              box,
              disabled && 'cursor-not-allowed opacity-45',
              tone === 'dark'
                ? cn(
                    'text-white',
                    filled
                      ? 'border-white/70 bg-white/15'
                      : isActive
                        ? 'border-white/50 bg-white/10'
                        : 'border-white/20 bg-white/5',
                  )
                : error
                  ? 'border-danger-500 bg-danger-50 text-danger-600'
                  : filled
                    ? 'border-brand-600 bg-brand-50 text-ink-900'
                    : isActive
                      ? 'border-brand-500 bg-white text-ink-900 ring-4 ring-brand-600/12'
                      : 'border-ink-200 bg-white text-ink-900',
            )}
          />
        )
      })}
    </div>
  )
}

/** Read-only OTP display — what the sender/receiver shows at a hub counter. */
export function OtpDisplay({
  code,
  label,
  tone = 'brand',
}: {
  code: string
  label?: string
  tone?: 'brand' | 'dark'
}) {
  return (
    <div className="text-center">
      {label && (
        <p
          className={cn(
            'mb-2.5 text-[11px] font-bold tracking-[0.12em] uppercase',
            tone === 'dark' ? 'text-white/60' : 'text-ink-500',
          )}
        >
          {label}
        </p>
      )}
      <div className="flex justify-center gap-2">
        {code.split('').map((c, i) => (
          <span
            key={i}
            className={cn(
              'grid h-14 w-11 place-items-center rounded-(--radius-md) text-[22px] font-extrabold',
              tone === 'dark'
                ? 'bg-white/15 text-white ring-1 ring-white/25'
                : 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
            )}
            style={{ animationDelay: `${i * 55}ms` }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

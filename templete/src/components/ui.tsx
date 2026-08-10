import { type ReactNode, type InputHTMLAttributes, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// ── Skeleton ────────────────────────────────────────────────────────────────

export function Sk({ w = '100%', h = 16, r = 8, className = '' }: { w?: string | number; h?: number; r?: number; className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }}
    />
  )
}

export function SkCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="scale-in" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-sm)', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Sk w={40} h={40} r={20} />
        <div style={{ flex: 1 }}>
          <Sk w="60%" h={14} r={6} className="mb-2" />
          <Sk w="80%" h={10} r={6} />
        </div>
      </div>
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <Sk key={i} w={i % 2 === 0 ? '90%' : '70%'} h={10} r={6} className="mb-2" />
      ))}
    </div>
  )
}

// ── Button ──────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
interface BtnProps {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  full?: boolean
  loading?: boolean
  disabled?: boolean
  small?: boolean
  icon?: ReactNode
}

export function Btn({ children, onClick, variant = 'primary', full = true, loading, disabled, small, icon }: BtnProps) {
  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: full ? '100%' : 'auto',
    padding: small ? '10px 16px' : '14px 20px',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: small ? 13 : 15,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.18s ease',
    opacity: disabled || loading ? 0.6 : 1,
    letterSpacing: '-0.01em',
  }

  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: 'var(--blue)', color: '#fff', boxShadow: 'var(--shadow-blue)' },
    secondary: { background: 'var(--blue-light)', color: 'var(--blue)' },
    ghost: { background: 'transparent', color: 'var(--text-2)' },
    danger: { background: 'var(--red-bg)', color: 'var(--red)' },
  }

  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled || loading}>
      {loading ? <LoadingSpinner size={18} color={variant === 'primary' ? '#fff' : 'var(--blue)'} /> : icon}
      {children}
    </button>
  )
}

// ── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  prefix?: ReactNode
  suffix?: ReactNode
  error?: string
}

export function Input({ label, prefix, suffix, error, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.01em' }}>
          {label}
        </div>
      )}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)',
          border: `1.5px solid ${error ? 'var(--red)' : focused ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '0 14px',
          transition: 'border-color 0.18s',
          boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.1)' : 'rgba(27,68,232,0.12)'}` : 'none',
        }}
      >
        {prefix && <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{prefix}</span>}
        <input
          {...rest}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '13px 0', fontSize: 15, color: 'var(--text)', fontFamily: 'Inter, sans-serif', ...style }}
          onFocus={e => { setFocused(true); rest.onFocus?.(e) }}
          onBlur={e => { setFocused(false); rest.onBlur?.(e) }}
        />
        {suffix && <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{suffix}</span>}
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

// ── OTP Input ───────────────────────────────────────────────────────────────

export function OTPInput({ digits = 6, value, onChange }: { digits?: number; value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const arr = value.padEnd(digits, '').slice(0, digits).split('')

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = arr.slice(); next[i] = ''
      onChange(next.join('').trimEnd())
      if (i > 0) refs.current[i - 1]?.focus()
    }
  }

  const handleChange = (i: number, v: string) => {
    const char = v.replace(/\D/g, '').slice(-1)
    const next = arr.slice(); next[i] = char
    onChange(next.join(''))
    if (char && i < digits - 1) refs.current[i + 1]?.focus()
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '8px 0 24px' }}>
      {arr.map((char, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={char}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          style={{
            width: 46, height: 56,
            border: `1.5px solid ${char ? 'var(--blue)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            color: 'var(--text)',
            background: char ? 'var(--blue-lighter)' : 'var(--surface)',
            outline: 'none',
            transition: 'all 0.18s',
            boxShadow: char ? '0 0 0 3px rgba(27,68,232,0.12)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Card ────────────────────────────────────────────────────────────────────

export function Card({ children, onClick, style, className }: { children: ReactNode; onClick?: () => void; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        padding: 16,
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-light)',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'box-shadow 0.18s, transform 0.12s' : undefined,
        ...style,
      }}
      onMouseDown={e => { if (onClick) (e.currentTarget.style.transform = 'scale(0.985)') }}
      onMouseUp={e => { if (onClick) (e.currentTarget.style.transform = '') }}
    >
      {children}
    </div>
  )
}

// ── Status badge ────────────────────────────────────────────────────────────

type BadgeStatus = 'transit' | 'hub' | 'delivered' | 'pending' | 'active' | 'cancelled' | 'verified' | 'warning'

const BADGE_STYLES: Record<BadgeStatus, { bg: string; color: string; dot: string }> = {
  active:    { bg: '#EFF6FF', color: '#1B44E8', dot: '#1B44E8' },
  transit:   { bg: '#F0FDF4', color: '#059669', dot: '#10B981' },
  hub:       { bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
  delivered: { bg: '#ECFDF5', color: '#059669', dot: '#10B981' },
  pending:   { bg: '#F8FAFC', color: '#5A6A85', dot: '#94A3B8' },
  cancelled: { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  verified:  { bg: '#F0FDF4', color: '#059669', dot: '#10B981' },
  warning:   { bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
}

const STATUS_LABELS: Record<string, BadgeStatus> = {
  'IN TRANSIT': 'transit', 'AT HUB': 'hub', 'DELIVERED': 'delivered',
  'PENDING': 'pending', 'ACTIVE': 'active', 'CANCELLED': 'cancelled',
  'VERIFIED': 'verified', 'WAITING': 'pending', 'ASSIGNED': 'active',
}

export function Badge({ label }: { label: string }) {
  const key = STATUS_LABELS[label.toUpperCase()] || 'pending'
  const s = BADGE_STYLES[key]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '4px 10px', borderRadius: 'var(--radius-full)',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: s.dot }} />
      {label}
    </span>
  )
}

// ── Top nav bar ─────────────────────────────────────────────────────────────

export function TopBar({ title, back, action, transparent, white }: {
  title?: string; back?: boolean | string; action?: ReactNode; transparent?: boolean; white?: boolean
}) {
  const navigate = useNavigate()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      background: transparent ? 'transparent' : white ? '#fff' : 'transparent',
      position: transparent || white ? 'absolute' : 'relative',
      top: 0, left: 0, right: 0,
      zIndex: 10,
    }}>
      {back ? (
        <button
          onClick={() => typeof back === 'string' ? navigate(back) : navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: 20, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: transparent ? 'rgba(255,255,255,0.15)' : 'var(--bg)',
          }}
        >
          <ArrowLeft size={20} color={transparent ? '#fff' : 'var(--text)'} />
        </button>
      ) : <div style={{ width: 40 }} />}

      {title && (
        <div style={{
          fontWeight: 700, fontSize: 17, color: transparent ? '#fff' : 'var(--text)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>
      )}
      <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>{action}</div>
    </div>
  )
}

// ── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {label && <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>}
      {label && <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
    </div>
  )
}

// ── Loading spinner ──────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 24, color = 'var(--blue)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      border: `2px solid transparent`,
      borderTop: `2px solid ${color}`,
      borderLeft: `2px solid ${color}`,
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

// ── Section label ────────────────────────────────────────────────────────────

export function SectionLabel({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</div>
      {action && (
        <button onClick={onAction} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          {action}
        </button>
      )}
    </div>
  )
}

// ── Row item ─────────────────────────────────────────────────────────────────

export function RowItem({ label, value, icon, chevron, onClick, sub }: {
  label: string; value?: string; icon?: ReactNode; chevron?: boolean; onClick?: () => void; sub?: string
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
        borderBottom: '1px solid var(--border-light)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {icon && (
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {value && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{value}</div>}
      {chevron && <div style={{ color: 'var(--text-3)', fontSize: 18 }}>›</div>}
    </div>
  )
}

// ── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ initials, size = 40, bg = 'var(--blue-light)', color = 'var(--blue)' }: {
  initials: string; size?: number; bg?: string; color?: string
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: bg, color, fontWeight: 700,
      fontSize: size * 0.34, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, letterSpacing: '0.01em',
    }}>
      {initials}
    </div>
  )
}

// ── Stars ────────────────────────────────────────────────────────────────────

export function Stars({ n = 4, size = 14 }: { n?: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ fontSize: size, color: i < n ? '#F59E0B' : '#E2E8F0' }}>★</span>
      ))}
    </span>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label && <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>}
      <div style={{ height: 6, background: 'var(--blue-light)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`, background: 'var(--blue)',
          borderRadius: 3, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

// ── Tab pills ────────────────────────────────────────────────────────────────

export function TabPills({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0', marginBottom: 16 }}>
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange(i)}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
            fontWeight: i === active ? 600 : 500, fontSize: 13, whiteSpace: 'nowrap',
            background: i === active ? 'var(--blue)' : 'var(--surface)',
            color: i === active ? '#fff' : 'var(--text-2)',
            boxShadow: i === active ? 'none' : 'var(--shadow-sm)',
            transition: 'all 0.18s',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ── CSS spin keyframe (injected inline for LoadingSpinner) ───────────────────
const spinStyle = document.createElement('style')
spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
if (!document.head.querySelector('#spin-kf')) {
  spinStyle.id = 'spin-kf'
  document.head.appendChild(spinStyle)
}

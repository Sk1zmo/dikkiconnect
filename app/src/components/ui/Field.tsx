import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { Check, ChevronDown, Minus, Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ═══ Text field ═══════════════════════════════════════════════════════════ */

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  label?: string
  hint?: string
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
  optional?: boolean
}

export function Field({
  label,
  hint,
  error,
  prefix,
  suffix,
  optional,
  className,
  ...rest
}: FieldProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[12.5px] font-semibold text-ink-700">{label}</span>
          {optional && <span className="text-[11px] font-medium text-ink-400">Optional</span>}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-(--radius-md) border bg-white px-3.5 transition-all duration-200',
          error
            ? 'border-danger-500 ring-4 ring-danger-500/10'
            : focused
              ? 'border-brand-600 ring-4 ring-brand-600/12'
              : 'border-ink-200 hover:border-ink-300',
        )}
      >
        {prefix && <span className="shrink-0 text-ink-400">{prefix}</span>}
        <input
          id={id}
          className="h-[50px] min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink-900 placeholder:font-normal placeholder:text-ink-400"
          onFocus={(e) => {
            setFocused(true)
            rest.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            rest.onBlur?.(e)
          }}
          {...rest}
        />
        {suffix && <span className="shrink-0 text-ink-400">{suffix}</span>}
      </div>
      {(error || hint) && (
        <p className={cn('mt-1.5 text-[11.5px]', error ? 'text-danger-600' : 'text-ink-500')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

/* ═══ Textarea ═════════════════════════════════════════════════════════════ */

export function TextArea({
  label,
  hint,
  className,
  optional,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  optional?: boolean
}) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[12.5px] font-semibold text-ink-700">{label}</span>
          {optional && <span className="text-[11px] font-medium text-ink-400">Optional</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          'w-full resize-none rounded-(--radius-md) border bg-white p-3.5 text-[14.5px] leading-[1.5] text-ink-900 transition-all duration-200 placeholder:text-ink-400',
          focused ? 'border-brand-600 ring-4 ring-brand-600/12' : 'border-ink-200 hover:border-ink-300',
        )}
        {...rest}
      />
      {hint && <p className="mt-1.5 text-[11.5px] text-ink-500">{hint}</p>}
    </div>
  )
}

/* ═══ Search ═══════════════════════════════════════════════════════════════ */

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  onClear,
  autoFocus,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onClear?: () => void
  autoFocus?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-11 items-center gap-2.5 rounded-full border border-ink-200 bg-white px-4 shadow-(--shadow-e1) focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-600/10',
        className,
      )}
    >
      <Search size={17} className="shrink-0 text-ink-400" />
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14.5px] text-ink-900 placeholder:text-ink-400"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          className="pressable-sm grid size-5 shrink-0 place-items-center rounded-full bg-ink-200 text-ink-600"
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

/* ═══ Select (native, styled) ══════════════════════════════════════════════ */

export function Select({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[50px] w-full appearance-none rounded-(--radius-md) border border-ink-200 bg-white px-3.5 pr-10 text-[15px] font-medium text-ink-900 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/12"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={17}
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-400"
        />
      </div>
    </div>
  )
}

/* ═══ Counter ══════════════════════════════════════════════════════════════ */

export function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  suffix,
  decimals = 0,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  decimals?: number
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Number(v.toFixed(decimals))))
  return (
    <div className="flex items-center gap-3 rounded-(--radius-md) border border-ink-200 bg-white p-1.5">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step))}
        className="pressable-sm grid size-10 place-items-center rounded-(--radius-sm) bg-ink-50 text-ink-700 disabled:opacity-35"
      >
        <Minus size={17} strokeWidth={2.6} />
      </button>
      <div className="tabular flex-1 text-center text-[16px] font-bold text-ink-900">
        {value.toFixed(decimals)}
        {suffix && <span className="ml-1 text-[12.5px] font-semibold text-ink-500">{suffix}</span>}
      </div>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step))}
        className="pressable-sm grid size-10 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-700 disabled:opacity-35"
      >
        <Plus size={17} strokeWidth={2.6} />
      </button>
    </div>
  )
}

/* ═══ Switch ═══════════════════════════════════════════════════════════════ */

export function Switch({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
  className?: string
}) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors duration-250',
        checked ? 'bg-brand-600' : 'bg-ink-300',
      )}
    >
      <span
        className="absolute top-[3px] size-6 rounded-full bg-white shadow-(--shadow-e2) transition-all duration-250 ease-(--ease-spring)"
        style={{ left: checked ? 25 : 3 }}
      />
    </button>
  )

  if (!label) return control

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        <p className="text-[14.5px] font-semibold text-ink-800">{label}</p>
        {description && <p className="mt-0.5 text-[12px] leading-snug text-ink-500">{description}</p>}
      </div>
      {control}
    </div>
  )
}

/* ═══ Checkbox ═════════════════════════════════════════════════════════════ */

export function Checkbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children?: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('focus-ring flex w-full items-start gap-3 text-left', className)}
    >
      <span
        className={cn(
          'mt-px grid size-[22px] shrink-0 place-items-center rounded-md border-2 transition-all duration-200',
          checked ? 'border-brand-600 bg-brand-600' : 'border-ink-300 bg-white',
        )}
      >
        {checked && <Check size={14} strokeWidth={3.4} className="text-white" />}
      </span>
      {children && <span className="text-[13px] leading-[1.5] text-ink-600">{children}</span>}
    </button>
  )
}

/**
 * Visual-only checkbox mark. Use inside a row that is itself the button —
 * nesting an interactive <Checkbox> in another button is invalid HTML.
 */
export function CheckMark({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-[22px] shrink-0 place-items-center rounded-md border-2 transition-all duration-200',
        checked ? 'border-brand-600 bg-brand-600' : 'border-ink-300 bg-white',
        className,
      )}
    >
      {checked && <Check size={14} strokeWidth={3.4} className="text-white" />}
    </span>
  )
}

/* ═══ Radio card ═══════════════════════════════════════════════════════════ */

export function RadioCard({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  trailing,
  className,
}: {
  selected: boolean
  onSelect: () => void
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'pressable focus-ring flex w-full items-center gap-3 rounded-(--radius-md) border-2 bg-white p-3.5 text-left transition-all duration-200',
        selected
          ? 'border-brand-600 bg-brand-50/60 shadow-(--shadow-brand-sm)'
          : 'border-ink-200 hover:border-ink-300',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-(--radius-sm) transition-colors',
            selected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600',
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-ink-900">{title}</span>
        {subtitle && <span className="mt-0.5 block text-[12px] text-ink-500">{subtitle}</span>}
      </span>
      {trailing ?? (
        <span
          className={cn(
            'grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-all',
            selected ? 'border-brand-600 bg-brand-600' : 'border-ink-300',
          )}
        >
          {selected && <span className="size-2 rounded-full bg-white" />}
        </span>
      )}
    </button>
  )
}

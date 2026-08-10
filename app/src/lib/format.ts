/** Formatting helpers — rupee-first, since the MVP corridor is Bangalore ↔ Mysore. */

export function inr(amount: number, opts: { decimals?: boolean } = {}) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(amount)
}

export function compactInr(amount: number) {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)}L`
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`
  return `₹${amount}`
}

export function num(n: number) {
  return new Intl.NumberFormat('en-IN').format(n)
}

/** "2:40 PM" */
export function time(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** "12 Feb" */
export function shortDate(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** "Mon, 12 Feb" */
export function dayDate(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** "12 Feb · 2:40 PM" */
export function dateTime(iso: string | Date) {
  return `${shortDate(iso)} · ${time(iso)}`
}

/** "4h ago", "in 25m", "just now" */
export function relative(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60_000)
  if (mins < 1) return 'just now'
  const suffix = (v: string) => (diff < 0 ? `${v} ago` : `in ${v}`)
  if (mins < 60) return suffix(`${mins}m`)
  const hours = Math.round(mins / 60)
  if (hours < 24) return suffix(`${hours}h`)
  const days = Math.round(hours / 24)
  if (days < 7) return suffix(`${days}d`)
  return shortDate(d)
}

/** Time held in hub — the PRD flags anything over 24h. */
export function ageInHub(iso: string) {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours < 24) return `${Math.floor(hours)} hr`
  return `${Math.floor(hours / 24)}d ${Math.floor(hours % 24)}h`
}

export function isStale(iso: string, thresholdHours = 24) {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000 > thresholdHours
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/** "+91 98450 12345" */
export function phone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(-10)
  if (digits.length !== 10) return raw
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
}

export function maskPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(-10)
  if (digits.length !== 10) return raw
  return `+91 ${digits.slice(0, 2)}••• ••${digits.slice(8)}`
}

export function kg(weight: number) {
  return weight < 1 ? `${Math.round(weight * 1000)} g` : `${weight} kg`
}

export function pct(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

/** Deterministic hour offset from now, so mock data is stable within a session. */
export function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3_600_000).toISOString()
}

export function minutesFromNow(m: number) {
  return new Date(Date.now() + m * 60_000).toISOString()
}

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Database,
  KeyRound,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   Operations.

   Reads /api/ops, which is the same event log the auth endpoints write to as
   they run — not a summary assembled for display. Every code issued, send
   failure, wrong entry, lockout and account creation lands here.

   Two deliberate choices:

     · It shows warnings before numbers. A dashboard that reads healthy while
       running on in-memory storage, or with no mail provider attached, is
       worse than no dashboard — it converts a missing environment variable
       into a silent outage nobody looks for.
     · Identifiers arrive masked from the server and are never unmasked here.
       Ops needs to know that a code went to a Gmail address and failed; it
       does not need the address.
   ═══════════════════════════════════════════════════════════════════════════ */

interface OpsFeed {
  at: string
  health: {
    storage: string
    storageDurable: boolean
    mailConfigured: boolean
    mailProvider: string | null
    warnings: string[]
  }
  counts: Record<string, number>
  failures: Array<{ at: string; kind: string; identifier?: string; detail?: string }>
  events: Array<{ at: string; kind: string; identifier?: string; detail?: string; ok?: boolean }>
}

const KEY_STORE = 'dikkiconnect.opskey'

export default function Ops() {
  const [key, setKey] = useState(() => localStorage.getItem(KEY_STORE) ?? '')
  const [feed, setFeed] = useState<OpsFeed | null>(null)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  // Test send — the only way to find out that a gateway is misconfigured
  // without waiting for a user to fail to sign in.
  const [testTo, setTestTo] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    ok: boolean
    channel?: string
    provider?: string
    detail?: string
    reason?: string
  } | null>(null)

  const sendTest = async () => {
    if (!testTo.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_ORIGIN ?? ''}/api/ops-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, to: testTo.trim() }),
      })
      setTestResult(await res.json())
    } catch {
      setTestResult({ ok: false, detail: 'Could not reach the API.' })
    } finally {
      setTesting(false)
    }
  }

  const load = useCallback(
    async (k: string) => {
      if (!k) return
      setLoading(true)
      setError(undefined)
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_ORIGIN ?? ''}/api/ops?key=${encodeURIComponent(k)}`,
        )
        const json = await res.json()
        if (!res.ok) {
          setFeed(null)
          setError(
            json.error === 'ops-disabled'
              ? 'OPS_KEY is not set on the server, so the monitoring endpoint is switched off.'
              : 'That key was rejected.',
          )
          return
        }
        localStorage.setItem(KEY_STORE, k)
        setFeed(json as OpsFeed)
      } catch {
        setError('Could not reach the API.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (key) void load(key)
  }, [key, load])

  // Live-ish without hammering: a refresh every 20 seconds while open.
  useEffect(() => {
    if (!feed) return
    const id = setInterval(() => void load(key), 20_000)
    return () => clearInterval(id)
  }, [feed, key, load])

  return (
    <div className="min-h-dvh bg-ink-50 px-5 py-8 md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10.5px] tracking-[0.3em] text-ink-400 uppercase">
              DikkiConnect
            </p>
            <h1 className="text-display mt-1.5 text-[28px] font-extrabold text-ink-900">
              Operations
            </h1>
          </div>
          {feed && (
            <button
              onClick={() => void load(key)}
              className="pressable inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-[13px] font-bold text-ink-700"
            >
              <RefreshCw size={14} className={loading ? 'anim-spin' : undefined} />
              Refresh
            </button>
          )}
        </header>

        {!feed && (
          <div className="mx-auto max-w-sm rounded-(--radius-lg) border border-ink-200 bg-white p-6">
            <span className="grid size-11 place-items-center rounded-(--radius-md) bg-ink-900 text-white">
              <KeyRound size={20} />
            </span>
            <h2 className="mt-4 text-[17px] font-extrabold text-ink-900">Ops key required</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
              This reads live server events. The key is the <code>OPS_KEY</code> environment
              variable set on the deployment.
            </p>
            <input
              type="password"
              defaultValue={key}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setKey((e.target as HTMLInputElement).value.trim())
              }}
              placeholder="Ops key"
              className="focus-ring mt-4 h-12 w-full rounded-(--radius-md) border-2 border-ink-200 px-3.5 text-[14px] outline-none focus:border-brand-500"
            />
            {error && <p className="mt-2 text-[12.5px] font-semibold text-danger-600">{error}</p>}
            <p className="mt-3 text-[11.5px] text-ink-400">Press Enter to load.</p>
          </div>
        )}

        {feed && (
          <>
            {feed.health.warnings.length > 0 && (
              <div className="mb-6 space-y-2.5">
                {feed.health.warnings.map((w) => (
                  <div
                    key={w}
                    className="flex items-start gap-3 rounded-(--radius-md) border border-warn-200 bg-warn-50 p-4"
                  >
                    <AlertTriangle size={17} className="mt-px shrink-0 text-warn-600" />
                    <p className="text-[13px] leading-relaxed font-semibold text-warn-800">{w}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <Health
                icon={<Database size={16} />}
                label="Storage"
                value={feed.health.storage}
                good={feed.health.storageDurable}
              />
              <Health
                icon={<Mail size={16} />}
                label="Email"
                value={feed.health.mailProvider ?? 'not configured'}
                good={feed.health.mailConfigured}
              />
              <Health
                icon={<ShieldCheck size={16} />}
                label="Codes"
                value="server-side, hashed"
                good
              />
            </div>

            {/* ── Test send ─────────────────────────────────────────────── */}
            <div className="mb-6 rounded-(--radius-lg) border border-ink-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-ink-800">
                <Send size={15} className="text-ink-400" />
                Send a test
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
                Sends one real email and shows the provider&apos;s own answer, including its
                error text when it refuses.
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <input
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void sendTest()}
                  placeholder="you@example.com"
                  className="focus-ring h-11 min-w-[240px] flex-1 rounded-(--radius-md) border-2 border-ink-200 px-3.5 text-[13.5px] outline-none focus:border-brand-500"
                />
                <button
                  onClick={() => void sendTest()}
                  disabled={testing || !testTo.trim()}
                  className="pressable h-11 rounded-(--radius-md) bg-ink-900 px-5 text-[13.5px] font-bold text-white disabled:opacity-50"
                >
                  {testing ? 'Sending…' : 'Send test'}
                </button>
              </div>

              {testResult && (
                <div
                  className={cn(
                    'anim-fade-in mt-3.5 rounded-(--radius-md) border p-3.5',
                    testResult.ok
                      ? 'border-success-200 bg-success-50'
                      : 'border-danger-200 bg-danger-50',
                  )}
                >
                  <p
                    className={cn(
                      'text-[13px] font-bold',
                      testResult.ok ? 'text-success-800' : 'text-danger-700',
                    )}
                  >
                    {testResult.ok
                      ? `Sent via ${testResult.provider} (${testResult.channel})`
                      : `Not sent — ${testResult.reason ?? 'failed'}`}
                  </p>
                  {testResult.detail && (
                    <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed break-words text-ink-600">
                      {testResult.detail}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(feed.counts).map(([k, v]) => (
                <div key={k} className="rounded-(--radius-md) border border-ink-200 bg-white p-4">
                  <p className="tabular text-display text-[26px] leading-none font-extrabold text-ink-900">
                    {v}
                  </p>
                  <p className="mt-1.5 text-[11.5px] font-semibold text-ink-500">{humanise(k)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-(--radius-lg) border border-ink-200 bg-white">
              <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3.5">
                <Activity size={15} className="text-ink-400" />
                <h2 className="text-[13.5px] font-bold text-ink-800">Event log</h2>
                <span className="ml-auto font-mono text-[10.5px] text-ink-400">
                  {feed.events.length} most recent
                </span>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {feed.events.length === 0 && (
                  <p className="px-5 py-8 text-center text-[13px] text-ink-400">
                    Nothing recorded yet.
                  </p>
                )}
                {feed.events.map((e, i) => (
                  <div
                    key={`${e.at}-${i}`}
                    className="flex items-center gap-3 border-b border-ink-50 px-5 py-2.5 last:border-0"
                  >
                    <span
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        e.ok === false ? 'bg-danger-500' : 'bg-success-500',
                      )}
                    />
                    <span className="tabular w-[86px] shrink-0 font-mono text-[10.5px] text-ink-400">
                      {new Date(e.at).toLocaleTimeString('en-IN', { hour12: false })}
                    </span>
                    <span className="w-[150px] shrink-0 font-mono text-[11.5px] font-bold text-ink-800">
                      {e.kind}
                    </span>
                    <span className="w-[190px] shrink-0 truncate font-mono text-[11.5px] text-ink-500">
                      {e.identifier ?? '—'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink-500">
                      {e.detail ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center font-mono text-[10.5px] text-ink-400">
              Updated {new Date(feed.at).toLocaleTimeString('en-IN', { hour12: false })} · refreshes
              every 20s
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Health({
  icon,
  label,
  value,
  good,
}: {
  icon: React.ReactNode
  label: string
  value: string
  good: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-(--radius-md) border border-ink-200 bg-white p-4">
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-(--radius-sm)',
          good ? 'bg-success-50 text-success-600' : 'bg-warn-50 text-warn-600',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold text-ink-500">{label}</p>
        <p className="truncate font-mono text-[13px] font-bold text-ink-900">{value}</p>
      </div>
    </div>
  )
}

const humanise = (k: string) =>
  k
    .replace(/([A-Z])/g, ' $1')
    .replace(/(\d+)h$/, ' · last $1h')
    .replace(/^./, (c) => c.toUpperCase())

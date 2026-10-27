/* ═══════════════════════════════════════════════════════════════════════════
   Server-side storage.

   Talks to Upstash Redis over its REST API when the environment provides
   credentials, and falls back to a process-local Map when it does not.

   The fallback is honest about what it is: a warm serverless instance keeps it,
   a cold start loses it. That is fine for a first run-through and useless for
   anything real, which is why /api/ops reports which backend is live and the
   ops dashboard says so in plain words. Setting KV_REST_API_URL and
   KV_REST_API_TOKEN is the only change needed to make every account, code and
   event durable — no code moves.
   ═══════════════════════════════════════════════════════════════════════════ */

const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

export const storageBackend = () => (URL_ && TOKEN ? 'upstash-redis' : 'in-memory')
export const storageDurable = () => Boolean(URL_ && TOKEN)

/** Process-local fallback. Survives warm invocations only. */
const mem = new Map<string, { value: string; expiresAt: number | null }>()

function sweep() {
  const now = Date.now()
  for (const [k, v] of mem) if (v.expiresAt !== null && v.expiresAt < now) mem.delete(k)
}

async function upstash(command: unknown[]): Promise<unknown> {
  const res = await fetch(URL_!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`upstash ${res.status}`)
  const json = (await res.json()) as { result?: unknown }
  return json.result
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (storageDurable()) {
    const raw = (await upstash(['GET', key])) as string | null
    return raw ? (JSON.parse(raw) as T) : null
  }
  sweep()
  const hit = mem.get(key)
  return hit ? (JSON.parse(hit.value) as T) : null
}

export async function kvSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const raw = JSON.stringify(value)
  if (storageDurable()) {
    await upstash(ttlSeconds ? ['SET', key, raw, 'EX', String(ttlSeconds)] : ['SET', key, raw])
    return
  }
  mem.set(key, { value: raw, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null })
}

/**
 * Sets a key only if it does not already exist. Returns true if this call is
 * the one that created it.
 *
 * This is the only primitive here that is genuinely atomic, and it exists for
 * one reason: claiming. Two travellers tapping "accept" on the same parcel at
 * the same moment both read "unclaimed", both write their own id, and the
 * second silently wins — so one of them drives to a hub for a parcel that is
 * no longer theirs. Redis SET NX decides that race in the one place that can,
 * which is the database.
 *
 * The in-memory fallback is not atomic across processes, but it does not need
 * to be: a single warm function instance is a single thread, and the fallback
 * is already documented as unfit for anything real.
 */
export async function kvSetIfAbsent(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<boolean> {
  const raw = JSON.stringify(value)
  if (storageDurable()) {
    const cmd = ttlSeconds
      ? ['SET', key, raw, 'NX', 'EX', String(ttlSeconds)]
      : ['SET', key, raw, 'NX']
    /* Upstash answers "OK" when it set the key and null when it did not. */
    return (await upstash(cmd)) !== null
  }
  sweep()
  if (mem.has(key)) return false
  mem.set(key, { value: raw, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null })
  return true
}

/**
 * Atomic add (or subtract, with a negative delta) — the only primitive here
 * that is safe for a bounded counter under concurrency. `INCRBY` is a single
 * Redis command, so two seats being booked in the same instant still resolve
 * to one correct total rather than a last-write-wins race. Callers that must
 * not go negative (seats left, a wallet balance) decrement first and roll
 * back if the result is negative — cheaper than a Lua script and exactly as
 * safe, because the decrement itself can never be lost or duplicated.
 */
export async function kvIncrBy(key: string, delta: number): Promise<number> {
  if (storageDurable()) {
    return Number(await upstash(['INCRBY', key, String(delta)]))
  }
  sweep()
  const hit = mem.get(key)
  const next = (hit ? Number(JSON.parse(hit.value)) : 0) + delta
  mem.set(key, { value: JSON.stringify(next), expiresAt: hit?.expiresAt ?? null })
  return next
}

export async function kvDel(key: string): Promise<void> {
  if (storageDurable()) {
    await upstash(['DEL', key])
    return
  }
  mem.delete(key)
}

/** Append to a capped list — used for the event log the ops view reads. */
export async function kvPush(key: string, value: unknown, cap = 300): Promise<void> {
  const raw = JSON.stringify(value)
  if (storageDurable()) {
    await upstash(['LPUSH', key, raw])
    await upstash(['LTRIM', key, '0', String(cap - 1)])
    return
  }
  const existing = mem.get(key)
  const list: string[] = existing ? (JSON.parse(existing.value) as string[]) : []
  list.unshift(raw)
  mem.set(key, { value: JSON.stringify(list.slice(0, cap)), expiresAt: null })
}

export async function kvList<T>(key: string, limit = 100): Promise<T[]> {
  if (storageDurable()) {
    const raw = (await upstash(['LRANGE', key, '0', String(limit - 1)])) as string[] | null
    return (raw ?? []).map((r) => JSON.parse(r) as T)
  }
  const existing = mem.get(key)
  const list: string[] = existing ? (JSON.parse(existing.value) as string[]) : []
  return list.slice(0, limit).map((r) => JSON.parse(r) as T)
}

/* ── Keys ────────────────────────────────────────────────────────────────── */

export const K = {
  challenge: (id: string) => `dkc:otp:${id}`,
  account: (id: string) => `dkc:acct:${id}`,
  accountIndex: 'dkc:accounts',
  session: (token: string) => `dkc:sess:${token}`,
  events: 'dkc:events',
  counters: 'dkc:counters',
}

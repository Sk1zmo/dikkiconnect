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

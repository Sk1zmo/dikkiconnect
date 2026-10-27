/* ═══════════════════════════════════════════════════════════════════════════
   The API, locally.

   `vite dev` serves the app and nothing under /api, because on Vercel those
   files are separate serverless functions rather than part of the bundle. That
   was fine while the only server route was sign-in and the rest of the app ran
   on localStorage. It is not fine now: booking, custody and photographs all go
   through the server, so without this there is no way to run the product on
   this machine at all — not to develop against, and not to walk the custody
   chain end to end before handing a build to a tester.

   This is a small router in front of the same handler files Vercel deploys. It
   does not reimplement them and must never diverge: it resolves a path to a
   file, builds the two objects the handler expects, and gets out of the way.

   Run:  npm run dev:api        (then VITE_API_ORIGIN=http://localhost:3001)

   Storage follows the same rule as production — Upstash when
   KV_REST_API_URL / KV_REST_API_TOKEN are in the environment, and an
   in-process Map when they are not. The Map lives as long as this process, so
   a restart is a fresh world. That is a property of running locally, not a
   bug, and it is worth knowing before you wonder where your parcel went.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const API_DIR = join(here, '..', 'api')
const PORT = Number(process.env.API_PORT ?? 3001)

/**
 * Maps a request path to a handler file, mirroring Vercel's own rules: an
 * exact file, then `index.ts` in a directory, then a single `[param].ts`
 * segment whose name becomes a query value.
 */
function resolveRoute(pathname) {
  const parts = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
  if (!parts.length) return null

  const direct = join(API_DIR, `${parts.join('/')}.ts`)
  if (existsSync(direct)) return { file: direct, params: {} }

  const index = join(API_DIR, ...parts, 'index.ts')
  if (existsSync(index)) return { file: index, params: {} }

  /* A dynamic last segment: /api/custody/intake → custody/[checkpoint].ts,
     with checkpoint = 'intake'. Only the last segment, which is all the API
     uses and all this needs to understand. */
  const last = parts[parts.length - 1]
  const parent = join(API_DIR, ...parts.slice(0, -1))
  if (existsSync(parent)) {
    const dynamic = ['checkpoint', 'id', 'slug']
      .map((name) => ({ name, file: join(parent, `[${name}].ts`) }))
      .find((c) => existsSync(c.file))
    if (dynamic) return { file: dynamic.file, params: { [dynamic.name]: last } }
  }
  return null
}

/** Reads the body, parsing JSON the way the platform does. */
async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return undefined
  const raw = Buffer.concat(chunks).toString('utf8')
  const type = String(req.headers['content-type'] ?? '')
  if (type.includes('application/json')) {
    try {
      return JSON.parse(raw)
    } catch {
      return undefined
    }
  }
  return raw
}

/** The slice of VercelResponse the handlers use. */
function shim(res) {
  let code = 200
  const api = {
    status(n) {
      code = n
      return api
    },
    setHeader(k, v) {
      res.setHeader(k, v)
      return api
    },
    getHeader: (k) => res.getHeader(k),
    json(value) {
      if (!res.hasHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
      res.statusCode = code
      res.end(JSON.stringify(value))
      return api
    },
    send(value) {
      res.statusCode = code
      res.end(value)
      return api
    },
    end(value) {
      res.statusCode = code
      res.end(value)
      return api
    },
    redirect(location) {
      res.statusCode = 302
      res.setHeader('Location', location)
      res.end()
      return api
    },
  }
  return api
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (!url.pathname.startsWith('/api')) {
    res.statusCode = 404
    res.end('Only /api is served here. The app itself comes from vite.')
    return
  }

  const route = resolveRoute(url.pathname)
  if (!route) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'no-such-route', path: url.pathname }))
    return
  }

  try {
    const mod = await import(pathToFileURL(route.file).href)
    const handler = mod.default
    if (typeof handler !== 'function') throw new Error(`${route.file} has no default export`)

    const query = { ...route.params }
    for (const [k, v] of url.searchParams) query[k] = v

    /* A route that opts out of body parsing gets the real request stream,
       exactly as it would on the platform. The payment webhook needs this:
       its signature is computed over the precise bytes the provider sent, so
       a parsed-and-re-serialised body would never verify. Without this the
       harness answered 500 where production answers 401, which is the kind
       of difference that only shows up in production. */
    const rawMode = mod.config?.api?.bodyParser === false
    const shimmedReq = rawMode
      ? Object.assign(req, { query, cookies: {} })
      : {
          method: req.method,
          url: req.url,
          headers: req.headers,
          query,
          cookies: {},
          body: await readBody(req),
        }

    await handler(shimmedReq, shim(res))
    if (!res.writableEnded) {
      /* A handler that returned without answering is a bug worth seeing
         rather than a request that hangs until the browser gives up. */
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'handler-returned-without-responding' }))
    }
    console.log(`${req.method} ${url.pathname} → ${res.statusCode}`)
  } catch (e) {
    console.error(`${req.method} ${url.pathname} threw:`, e)
    if (!res.writableEnded) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'handler-threw', detail: String(e) }))
    }
  }
})

server.listen(PORT, () => {
  const durable = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  console.log(`API on http://localhost:${PORT}/api`)
  console.log(
    durable
      ? 'Storage: Upstash Redis — data survives a restart.'
      : 'Storage: in-process Map — everything is lost when this stops.',
  )
  console.log(`Point the app at it with VITE_API_ORIGIN=http://localhost:${PORT}`)
})

import type { VercelRequest, VercelResponse } from '@vercel/node'

/* ═══════════════════════════════════════════════════════════════════════════
   CORS.

   The web app calls this API from its own origin and needs none of this. The
   APK does: Capacitor serves the bundled app from https://localhost, so every
   call to the deployment is cross-origin. Without these headers the browser
   blocks the request before it is sent, fetch throws, and the app can only
   report a network failure it cannot distinguish from being offline — which
   is exactly the "could not reach WayPool" people were seeing on Android
   while the web version worked perfectly.

   The allow-list is explicit rather than `*`. These endpoints issue sessions,
   and a wildcard on an endpoint that hands out credentials is how you end up
   letting any page on the internet start a login on your users' behalf.
   Additional origins can be added with EXTRA_ORIGINS, comma-separated.
   ═══════════════════════════════════════════════════════════════════════════ */

const ALWAYS_ALLOWED = [
  'https://localhost', // Capacitor Android
  'capacitor://localhost', // Capacitor iOS
  'http://localhost', // Capacitor on older Android WebViews
  'http://localhost:5173', // Vite dev server
]

/* A dev server on a port other than 5173 is ordinary — a second instance, a
   LAN address for testing on a phone, 127.0.0.1 rather than localhost. Each
   one used to fail at the browser with "could not reach WayPool", which looks
   exactly like being offline and sent more than one afternoon looking in the
   wrong place.

   This is allowed off production only. On a production deployment the loop
   back to a developer's own machine is not a case that exists, and a page on
   someone's localhost being able to start a session against the live API is
   not a trade worth making for convenience nobody needs there. */
const isLocalhost = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)

const onProduction = () => process.env.VERCEL_ENV === 'production'

function allowedOrigins() {
  const extra = (process.env.EXTRA_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return [...ALWAYS_ALLOWED, ...extra]
}

/** True for our own deployments, so preview URLs work without a redeploy. */
const OWN_PROJECTS = ['waypool', 'dikkiconnect', 'stowza']
const isOwnDeployment = (origin: string) =>
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) &&
  OWN_PROJECTS.some((p) => origin.includes(p))

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = String(req.headers.origin ?? '')

  const permitted =
    allowedOrigins().includes(origin) ||
    isOwnDeployment(origin) ||
    (!onProduction() && isLocalhost(origin))

  if (origin && permitted) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  /* Authorization belongs here now that routes other than sign-in exist.
     Without it the browser rejects the preflight for every call that carries
     a session token, and the APK can only report a network failure it cannot
     tell apart from being offline — the same symptom Content-Type alone
     caused before. */
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Ops-Key')
  res.setHeader('Access-Control-Max-Age', '86400')

  // Preflight ends here — answering it with 405 is what broke the APK.
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

/** Wraps a handler so every route gets identical CORS behaviour. */
export function withCors(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (applyCors(req, res)) return
    return handler(req, res)
  }
}

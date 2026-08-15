import type { VercelRequest, VercelResponse } from '@vercel/node'

/* ═══════════════════════════════════════════════════════════════════════════
   CORS.

   The web app calls this API from its own origin and needs none of this. The
   APK does: Capacitor serves the bundled app from https://localhost, so every
   call to the deployment is cross-origin. Without these headers the browser
   blocks the request before it is sent, fetch throws, and the app can only
   report a network failure it cannot distinguish from being offline — which
   is exactly the "could not reach DikkiConnect" people were seeing on Android
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

function allowedOrigins() {
  const extra = (process.env.EXTRA_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return [...ALWAYS_ALLOWED, ...extra]
}

/** True for our own deployments, so preview URLs work without a redeploy. */
const isOwnDeployment = (origin: string) =>
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) && origin.includes('dikkiconnect')

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = String(req.headers.origin ?? '')

  if (origin && (allowedOrigins().includes(origin) || isOwnDeployment(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Ops-Key')
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

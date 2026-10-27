import { createSign } from 'node:crypto'

/* ═══════════════════════════════════════════════════════════════════════════
   Firebase Cloud Messaging — waking a phone the app is not running on.

   Everything in `src/lib/push.ts` already works: the foreground alert, the
   OS tray, the scheduled reminder. All of it is triggered by the device
   itself, which means it only fires if the app is open, or if it was
   scheduled before the app was closed. A sender whose parcel is taken in at
   a hub three hours later learns nothing until they next open WayPool.

   This is the missing half: the server telling the phone.

   ── Why HTTP v1 and not the legacy server key ─────────────────────────────
   The legacy FCM endpoint took a static key in a header and was retired by
   Google. HTTP v1 wants a short-lived OAuth token, minted from a service
   account by signing a JWT — more moving parts, but the credential on disk
   cannot itself send a message, which is the point.

   ── Unconfigured is a normal state ────────────────────────────────────────
   No service account, no sends, no errors thrown at callers. Push is an
   enhancement to a product that already works without it, and a failed
   notification must never fail the hand-off that triggered it.
   ═══════════════════════════════════════════════════════════════════════════ */

const RAW = process.env.FCM_SERVICE_ACCOUNT

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

function account(): ServiceAccount | null {
  if (!RAW) return null
  try {
    const parsed = JSON.parse(RAW) as ServiceAccount
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null
    /* Env vars cannot hold real newlines, so the PEM arrives with literal
       \n sequences. Left as-is, the signer rejects the key with a message
       that says nothing about newlines. */
    return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, '\n') }
  } catch {
    return null
  }
}

export const pushConfigured = () => account() !== null

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/* Tokens last an hour; caching one saves a round trip per notification and,
   on a warm function, most of the latency. */
let cached: { token: string; expiresAt: number } | null = null

async function accessToken(): Promise<string | null> {
  const sa = account()
  if (!sa) return null
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token

  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const jwt = `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const body = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!body.access_token) return null

  cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 }
  return cached.token
}

export interface PushMessage {
  title: string
  body: string
  /** Where tapping it should land, e.g. /sender/track/WYP-4861 */
  href?: string
}

/**
 * Sends to one device token.
 *
 * Returns `'gone'` when FCM says the token is dead, so the caller can forget
 * it. Tokens expire on reinstall and app data clears, and a store that only
 * ever grows ends up spending most of its sends on phones that will never
 * receive them.
 */
export async function sendToToken(
  token: string,
  msg: PushMessage,
): Promise<'sent' | 'gone' | 'failed' | 'unconfigured'> {
  const sa = account()
  if (!sa) return 'unconfigured'
  const auth = await accessToken()
  if (!auth) return 'failed'

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: msg.title, body: msg.body },
        /* The href rides as data so the app can route on tap. Notification
           payloads cannot carry it on Android without this. */
        data: msg.href ? { href: msg.href } : undefined,
        android: { priority: 'HIGH', notification: { sound: 'default' } },
        apns: { payload: { aps: { sound: 'default' } } },
      },
    }),
  })

  if (res.ok) return 'sent'
  if (res.status === 404 || res.status === 400) {
    /* UNREGISTERED and INVALID_ARGUMENT both mean this token is no longer a
       phone. Anything else may be transient and is worth keeping. */
    const text = await res.text()
    return /UNREGISTERED|INVALID_ARGUMENT/.test(text) ? 'gone' : 'failed'
  }
  return 'failed'
}

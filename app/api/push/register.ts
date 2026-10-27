import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { requireAccount } from '../_lib/domain.js'
import { forgetDevice, rememberDevice } from '../_lib/notify.js'
import { pushConfigured } from '../_lib/fcm.js'

/**
 * POST   /api/push/register   { token, platform }   — this device wants push
 * DELETE /api/push/register   { token }             — and now it does not
 *
 * The app calls this on every launch, because FCM re-issues tokens whenever
 * it feels like it — a reinstall, a restore to a new phone, a cleared app
 * data. Registering the same token twice is a no-op by design.
 *
 * A token is a capability to ring somebody's phone, so it is stored against
 * the signed-in account and never accepted anonymously.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  const account = await requireAccount(req.headers.authorization)
  if (!account) return res.status(401).json({ error: 'unauthorised' })

  const { token, platform } = (req.body ?? {}) as { token?: string; platform?: string }
  if (!token || typeof token !== 'string' || token.length < 20) {
    return res.status(400).json({ error: 'bad-token' })
  }

  if (req.method === 'DELETE') {
    await forgetDevice(account.id, token)
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  await rememberDevice(account.id, token, String(platform ?? 'unknown'))

  /* The app is told whether anything will actually arrive. It uses this to
     avoid promising notifications it cannot deliver — a settings toggle that
     claims to be on while no server can send is worse than one that admits
     the feature is not live yet. */
  return res.status(200).json({ ok: true, deliverable: pushConfigured() })
}

export default withCors(handler)

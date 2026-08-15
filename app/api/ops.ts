import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from './_lib/http.js'
import { readEvents } from './_lib/auth.js'
import { K, kvList, storageBackend, storageDurable } from './_lib/store.js'
import { mailConfigured, mailProvider } from './_lib/mail.js'
import { smsConfigured, smsProvider } from './_lib/sms.js'

/**
 * GET /api/ops?key=…   — the monitoring feed.
 *
 * Protected by OPS_KEY. If that variable is not set the endpoint refuses
 * outright rather than defaulting to open: an ops feed that ships world
 * readable because somebody forgot a variable is worse than one that is
 * simply unavailable.
 *
 * Identifiers in the event log are masked at write time, so even with the key
 * this never discloses a full address or number.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  const expected = process.env.OPS_KEY
  if (!expected) {
    return res.status(503).json({
      error: 'ops-disabled',
      detail: 'Set OPS_KEY in the environment to enable the monitoring endpoint.',
    })
  }
  const supplied = String(req.query.key ?? req.headers['x-ops-key'] ?? '')
  if (supplied !== expected) return res.status(401).json({ error: 'unauthorised' })

  const [events, accounts] = await Promise.all([
    readEvents(150),
    kvList<{ id: string; at: string }>(K.accountIndex, 1000),
  ])

  const since = (hours: number) => Date.now() - hours * 3_600_000
  const inLast = (h: number) => events.filter((e) => new Date(e.at).getTime() > since(h))

  const tally = (kind: string, h = 24) => inLast(h).filter((e) => e.kind === kind).length

  const failures = inLast(24).filter((e) => e.ok === false)

  return res.status(200).json({
    at: new Date().toISOString(),
    health: {
      storage: storageBackend(),
      storageDurable: storageDurable(),
      mailConfigured: mailConfigured(),
      mailProvider: mailProvider(),
      smsConfigured: smsConfigured(),
      smsProvider: smsProvider(),
      // Said plainly, because a dashboard that looks green while running on a
      // Map that dies with the instance is worse than no dashboard.
      warnings: [
        ...(storageDurable()
          ? []
          : ['Storage is in-memory: accounts and codes are lost on a cold start. Set KV_REST_API_URL and KV_REST_API_TOKEN.']),
        ...(mailConfigured()
          ? []
          : [
              'No mail provider: codes cannot be emailed. Set SMTP_USER + SMTP_PASS (a Gmail App Password works), or RESEND_API_KEY.',
            ]),
        ...(smsConfigured()
          ? []
          : [
              'No SMS gateway: codes cannot be texted, so phone sign-in falls back to the email on the account. Set FAST2SMS_API_KEY, or MSG91_AUTH_KEY + MSG91_TEMPLATE_ID, or the three TWILIO_ variables.',
            ]),
      ],
    },
    counts: {
      accountsTotal: accounts.length,
      accounts24h: accounts.filter((a) => new Date(a.at).getTime() > since(24)).length,
      codesSent24h: tally('otp.sent'),
      sendFailures24h: tally('otp.send-failed'),
      signIns24h: tally('auth.signin'),
      signups24h: tally('account.created'),
      wrongCodes24h: tally('otp.wrong'),
      lockouts24h: tally('otp.locked'),
      throttled24h: tally('otp.throttled'),
      undeliverable24h: tally('otp.undeliverable'),
    },
    failures: failures.slice(0, 20),
    events,
  })
}

export default withCors(handler)

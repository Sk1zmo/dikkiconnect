import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from './_lib/http.js'
import { mask, parseIdentifier, record } from './_lib/auth.js'
import { mailProvider, sendMail } from './_lib/mail.js'
import { sendOtpSms, smsProvider } from './_lib/sms.js'

/**
 * POST /api/ops-test   { key, to }
 *
 * Sends one real message to an address or number you choose, and returns the
 * provider's actual answer — including its error text when it refuses.
 *
 * This exists because configuring a gateway is the step that goes wrong, and
 * the usual way to find out is a user failing to sign in. A wrong Gmail App
 * Password, an unapproved DLT template, a Twilio number that cannot reach
 * India: each produces a specific complaint from the provider, and this puts
 * that complaint on screen instead of leaving you to infer it.
 *
 * Behind OPS_KEY, and rate-limited by nothing — it is a manual button.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  const expected = process.env.OPS_KEY
  if (!expected) return res.status(503).json({ error: 'ops-disabled' })
  if (String(req.body?.key ?? '') !== expected) return res.status(401).json({ error: 'unauthorised' })

  const id = parseIdentifier(String(req.body?.to ?? ''))
  if (!id) return res.status(400).json({ error: 'bad-recipient' })

  // A recognisable, obviously-not-real code, so a test can never be mistaken
  // for a live one if it lands in a shared inbox.
  const CODE = '123456'

  if (id.kind === 'phone') {
    if (!smsProvider()) {
      return res.status(200).json({
        ok: false,
        channel: 'sms',
        reason: 'unconfigured',
        detail:
          'No SMS gateway configured. Set MSG91_AUTH_KEY + MSG91_TEMPLATE_ID, or FAST2SMS_API_KEY, or the three TWILIO_ variables.',
      })
    }
    const sms = await sendOtpSms(id.value, CODE)
    await record({
      kind: 'ops.test-sms',
      identifier: mask(id.value),
      ok: sms.sent,
      detail: sms.sent ? sms.provider : `${sms.reason} · ${sms.detail ?? ''}`,
    })
    return res.status(200).json({
      ok: sms.sent,
      channel: 'sms',
      provider: smsProvider(),
      ...(sms.sent ? { id: sms.id } : { reason: sms.reason, detail: sms.detail }),
    })
  }

  if (!mailProvider()) {
    return res.status(200).json({
      ok: false,
      channel: 'email',
      reason: 'unconfigured',
      detail:
        'No mail provider configured. Set SMTP_USER + SMTP_PASS (a Gmail App Password works), or RESEND_API_KEY.',
    })
  }

  const mail = await sendMail(
    id.value,
    'DikkiConnect delivery test',
    `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;">
      <h2 style="margin:0 0 8px;color:#101a38;">Delivery is working</h2>
      <p style="margin:0;color:#5b6884;line-height:1.6;">
        This is a test from the DikkiConnect operations page. If you can read it, verification
        codes will reach this address. Sent via <b>${mailProvider()}</b>.
      </p>
    </body></html>`,
    `Delivery is working. This is a test from the DikkiConnect operations page, sent via ${mailProvider()}.`,
  )

  await record({
    kind: 'ops.test-email',
    identifier: mask(id.value),
    ok: mail.sent,
    detail: mail.sent ? mail.provider : `${mail.reason} · ${mail.detail ?? ''}`,
  })

  return res.status(200).json({
    ok: mail.sent,
    channel: 'email',
    provider: mailProvider(),
    ...(mail.sent ? { id: mail.id } : { reason: mail.reason, detail: mail.detail }),
  })
}

export default withCors(handler)

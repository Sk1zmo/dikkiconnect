import nodemailer from 'nodemailer'

/* ═══════════════════════════════════════════════════════════════════════════
   Email delivery.

   Email is the channel that can be switched on without a regulator in the way,
   and there are two ways to do it — deliberately, because they suit different
   moments:

     · SMTP (SMTP_USER + SMTP_PASS). Works with a Gmail account you already
       have: turn on 2-step verification, generate an App Password, paste it
       in. No new service, no signup, live in about two minutes. Gmail caps a
       personal account at roughly 500 messages a day, which is plenty for a
       pilot and not enough for a launch.
     · Resend (RESEND_API_KEY). A proper transactional provider — better
       deliverability, a real sending domain, and headroom. The right answer
       once the app has users.

   Resend wins when both are set. Neither reports `unconfigured` and the caller
   records that on the event log; nothing anywhere pretends a message was sent
   when it was not.
   ═══════════════════════════════════════════════════════════════════════════ */

const KEY = process.env.RESEND_API_KEY

const SMTP_HOST = process.env.SMTP_HOST ?? 'smtp.gmail.com'
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 465)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS

const FROM =
  process.env.MAIL_FROM ??
  (SMTP_USER ? `DikkiConnect <${SMTP_USER}>` : 'DikkiConnect <onboarding@resend.dev>')

export function mailProvider(): 'resend' | 'smtp' | null {
  if (KEY) return 'resend'
  if (SMTP_USER && SMTP_PASS) return 'smtp'
  return null
}

export const mailConfigured = () => mailProvider() !== null

export type MailResult =
  | { sent: true; id: string; provider: string }
  | { sent: false; reason: 'unconfigured' | 'failed'; detail?: string; provider?: string }

async function viaResend(to: string, subject: string, html: string, text: string): Promise<MailResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  })
  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
  if (!res.ok) {
    return { sent: false, reason: 'failed', provider: 'resend', detail: body.message ?? `HTTP ${res.status}` }
  }
  return { sent: true, provider: 'resend', id: body.id ?? 'accepted' }
}

async function viaSmtp(to: string, subject: string, html: string, text: string): Promise<MailResult> {
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  const info = await transport.sendMail({ from: FROM, to, subject, html, text })
  return { sent: true, provider: 'smtp', id: info.messageId }
}

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<MailResult> {
  const provider = mailProvider()
  if (!provider) return { sent: false, reason: 'unconfigured' }

  try {
    return provider === 'resend'
      ? await viaResend(to, subject, html, text)
      : await viaSmtp(to, subject, html, text)
  } catch (err) {
    return { sent: false, reason: 'failed', provider, detail: String(err).slice(0, 200) }
  }
}

/** The verification email. Plain, high-contrast, and legible in any client. */
export function otpEmail(code: string, minutes: number) {
  const subject = `${code} is your DikkiConnect code`

  const text = [
    `Your DikkiConnect verification code is ${code}.`,
    ``,
    `It expires in ${minutes} minutes and can only be used once.`,
    `If you didn't ask for this, you can ignore this email — nobody can sign in without the code.`,
  ].join('\n')

  // Table layout and inline styles: every mail client still needs both.
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(16,26,56,.07);">
        <tr><td style="background:#0b0e15;padding:22px 28px;">
          <span style="color:#ffffff;font-size:17px;font-weight:800;letter-spacing:-.02em;">DikkiConnect</span>
        </td></tr>
        <tr><td style="padding:32px 28px 8px;">
          <p style="margin:0 0 6px;font-size:19px;font-weight:800;color:#101a38;">Your verification code</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#5b6884;">
            Enter this in the app to finish signing in.
          </p>
          <div style="background:#eef3ff;border:1px solid #d3e0ff;border-radius:12px;padding:18px;text-align:center;">
            <span style="font-size:34px;font-weight:800;letter-spacing:.22em;color:#1650e0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</span>
          </div>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#5b6884;">
            It expires in <b style="color:#101a38;">${minutes} minutes</b> and works only once.
          </p>
          <p style="margin:14px 0 0;font-size:12.5px;line-height:1.6;color:#8a95ab;">
            Didn't ask for this? Ignore this email — nobody can sign in without the code.
          </p>
        </td></tr>
        <tr><td style="padding:24px 28px 28px;">
          <div style="height:1px;background:#e7ecf5;margin-bottom:16px;"></div>
          <p style="margin:0;font-size:11.5px;line-height:1.6;color:#98a2b6;">
            DikkiConnect — intercity parcel delivery and cost-shared travel.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, html, text }
}

/** Sent once, when an account is first created. */
export function welcomeEmail(name: string) {
  const subject = 'Your DikkiConnect account is ready'
  const text = `Welcome to DikkiConnect, ${name}.\n\nYour account is live. Sign in any time with your mobile number or this email address — we'll send a fresh code each time. There is no password to remember or lose.`
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:18px;overflow:hidden;">
        <tr><td style="background:#0b0e15;padding:22px 28px;">
          <span style="color:#ffffff;font-size:17px;font-weight:800;letter-spacing:-.02em;">DikkiConnect</span>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <p style="margin:0 0 6px;font-size:19px;font-weight:800;color:#101a38;">Welcome, ${name}</p>
          <p style="margin:0;font-size:14px;line-height:1.65;color:#5b6884;">
            Your account is live. Sign in any time with your mobile number or this email address —
            we send a fresh code each time, so there is no password to remember or lose.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  return { subject, html, text }
}

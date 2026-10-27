/* ═══════════════════════════════════════════════════════════════════════════
   Proves the sign-in email actually arrives.

     node scripts/verify-mail.mjs you@example.com
     node scripts/verify-mail.mjs you@example.com https://your-api.vercel.app

   Sign-in is the first thing a tester does and the first thing that can
   silently not work: the API answers 200 whether or not the message was
   handed to a provider, because from the app's point of view "we accepted
   your request" is true either way. The honesty is in the response body, and
   nobody reads response bodies. This reads it.

   This replaces the old /api/ops-test route, which did the same job from a
   URL. It was removed for a blunt reason: Vercel's Hobby plan allows twelve
   serverless functions per deployment, push registration was the thirteenth,
   and a diagnostic that duplicates a command-line tool is the cheapest thing
   to give up. Nothing was lost — this reads the same provider answer and
   says what to do about it.

   It does not check that the mail was delivered to an inbox — nothing on this
   side of the internet can. It checks the two things that are actually in our
   control and that are wrong 99% of the time: that a provider is configured,
   and that the provider accepted the message rather than rejecting it.
   ═══════════════════════════════════════════════════════════════════════════ */

async function main() {
  const [, , address, originArg] = process.argv
  const origin = originArg ?? process.env.VITE_API_ORIGIN ?? 'http://localhost:3001'

  if (!address || !address.includes('@')) {
    console.error('Usage: node scripts/verify-mail.mjs <email> [api-origin]')
    return 2
  }

  const t = {
    ok: (s) => `\x1b[32m${s}\x1b[0m`,
    bad: (s) => `\x1b[31m${s}\x1b[0m`,
    dim: (s) => `\x1b[2m${s}\x1b[0m`,
    b: (s) => `\x1b[1m${s}\x1b[0m`,
  }

  console.log(`\nAsking ${t.b(origin)} to mail a sign-in code to ${t.b(address)}\n`)

  let res
  let body
  try {
    res = await fetch(`${origin}/api/auth/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: address }),
    })
    body = await res.json()
  } catch (e) {
    console.log(t.bad('✗ Could not reach the API at all.'))
    console.log(`  ${String(e)}`)
    console.log(t.dim('\n  Is it running? Locally that is `npm run dev:api`.'))
    return 1
  }

  if (res.status === 429) {
    console.log(t.bad('✗ Throttled — a code was already sent to this address recently.'))
    console.log(`  Try again in ${body.retryInSeconds ?? '30'}s, or use a different address.`)
    return 1
  }

  if (!res.ok) {
    console.log(t.bad(`✗ The API refused the request (HTTP ${res.status}).`))
    console.log(`  ${JSON.stringify(body)}`)
    return 1
  }

  /* The request was accepted. Now the part that matters. */
  if (body.delivered === true) {
    console.log(t.ok('✓ A provider accepted the message.'))
    console.log(`  Check ${address}. The code is valid for 5 minutes.`)
    console.log(t.dim('\n  If it does not arrive, it is now a deliverability problem —'))
    console.log(t.dim('  spam folder first, then the sending domain\'s SPF/DKIM records.'))
    return 0
  }

  console.log(t.bad('✗ No email was sent.'))

  if (body.reason === 'unconfigured') {
    console.log('\n  No mail provider is configured on this deployment, so the API')
    console.log('  has nothing to hand the message to. Nobody can sign in.\n')
    console.log(t.b('  Pick one and set it, then run this again:\n'))
    console.log('  A · Resend — a free tier, and nothing to maintain.')
    console.log(t.dim('      1. Sign up at resend.com, create an API key.'))
    console.log(t.dim('      2. vercel env add RESEND_API_KEY production'))
    console.log(t.dim('      3. vercel env add MAIL_FROM production'))
    console.log(t.dim('         → WayPool <onboarding@resend.dev>  (works before you own a domain)'))
    console.log('')
    console.log('  B · Gmail — no new account, but an app password is required.')
    console.log(t.dim('      1. Google Account → Security → 2-Step Verification → App passwords.'))
    console.log(t.dim('      2. vercel env add SMTP_USER production   → your gmail address'))
    console.log(t.dim('      3. vercel env add SMTP_PASS production   → the 16-character app password'))
    console.log(t.dim('      Gmail will cap you around 500/day, which is plenty for closed testing'))
    console.log(t.dim('      and not enough for launch.'))
    console.log('')
    console.log(t.dim('  Then redeploy, because env changes do not apply to a running deployment:'))
    console.log(t.dim('      vercel --prod'))
    return 1
  }

  if (body.reason === 'failed' || body.mailConfigured) {
    console.log(`\n  A provider (${body.provider ?? 'unknown'}) is configured but rejected the message.`)
    console.log(`  ${t.b(body.detail ?? 'no detail returned')}\n`)
    console.log(t.dim('  Common causes:'))
    console.log(t.dim('   · Resend: the MAIL_FROM domain is not verified in your Resend account.'))
    console.log(t.dim('   · Gmail: a normal password was used instead of an app password.'))
    console.log(t.dim('   · Either: the key was set for the wrong environment (preview vs production).'))
    return 1
  }

  console.log(`\n  ${JSON.stringify(body)}`)
  return 1
}

/* An async main with returns, rather than top-level process.exit().
   process.exit() tears the process down while stdout and the inherited stdin
   handle may still be closing, and on Windows libuv asserts on that:
   "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)". The output had
   already been printed, so it was noise rather than failure - but it is noise
   that looks exactly like a crash, at the end of a script whose entire job is
   telling you whether something worked. */
main()
  .then((code) => {
    process.exitCode = code ?? 0
  })
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })

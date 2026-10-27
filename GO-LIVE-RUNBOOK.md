# WayPool — getting from here to users

Written for: you, doing these in order.

The companion to `PLAY-CLOSED-TESTING-CHECKLIST.md`. That one is *what is
missing*. This one is *what to do about it*, in the order that unblocks the
most, with the exact command or click path and how you know each step worked.

---

## Read this first: there are two finish lines, and they are 14 days apart

**Finish line A — testers can use it.** A closed-testing track, an opt-in link,
people installing from Play. Everything below up to Stage 6.

**Finish line B — anyone can install it.** Public on Play.

Google will not let you cross B until you have crossed A and then **kept at
least 12 testers opted in continuously for 14 days**. The clock only runs while
they stay opted in; if someone drops out and rejoins, their count restarts.
That rule applies to personal developer accounts created after 13 November 2023
([Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)).

Two consequences, and they shape everything:

1. **The 14 days are a floor you cannot buy your way past.** Start the closed
   test as early as you possibly can, even with the app half-finished, because
   those days run in the background while you keep building.
2. **Recruit 12 real people before you need them.** Not 12 accounts — 12 people
   who will keep the app installed for a fortnight and actually answer you.
   This is the step that quietly kills most launches. Line them up this week.

> **The fork worth deciding now:** Google documents this requirement for
> *personal* accounts. Their page says nothing either way about organization
> accounts, and the third-party claim that organizations are exempt is not
> something I could confirm from Google. An organization account also needs a
> D-U-N-S number, which takes days to obtain. **My recommendation: register
> personal, start the 14 days immediately.** You can move to an organization
> account later; you cannot get the fortnight back.

---

## Stage 0 — Do this before you close the laptop today

**15 minutes. Free. Nothing else on this page matters if you skip it.**

- [ ] Open `app/android/keystore.properties`, copy the password into a password
      manager.
- [ ] Copy `app/android/waypool-upload.keystore` somewhere off this machine —
      another drive, a private cloud folder, anywhere you will still have in
      five years.

That file is the app's identity on Play. If you lose it, the listing can never
be updated again, by you or by Google, and WayPool would have to be republished
under a new package name with zero installs and zero reviews.

*Verify:* you can open the backed-up `.keystore` from a different folder and
the password from your manager unlocks it:

```bash
keytool -list -v -keystore <your-backup-path>/waypool-upload.keystore
```

---

## Stage 1 — Make the server real

**Done.** The API at `dikkiconnect-mail.vercel.app` is live, has Upstash Redis
connected and verified durable, and mail is flowing over Gmail SMTP.
`/api/parcels` and `/api/rides` both answer 401 (not 404) without a token, and
a real sign-in gets through end to end. The steps below are kept for the
record and in case a redeploy ever needs to rebuild this from zero.

### 1.0 — The one command that does most of it

```powershell
cd app
npm run setup:live
```

It asks for the only two things that cannot be created for you — a Gmail App
Password for **waypool1@gmail.com**, and an Upstash Redis URL + token — then
sets every other variable, deploys, and checks all three things afterwards
rather than assuming them. Passwords are read without echo and piped straight
to the Vercel CLI; none of them are written into the repo.

The sections below are the same steps by hand, if you would rather see each one.

### 1.1 — A database that remembers

Without this the server forgets every account the moment a serverless function
goes cold. Accounts, parcels, hand-off codes: all gone.

1. Vercel dashboard → your project → **Storage** → **Marketplace** →
   **Upstash** → create a Redis database (free tier is plenty for a pilot).
2. Connect it to the `dikkiconnect-mail` project. Vercel injects the variables
   automatically.

> You may see either `KV_REST_API_URL`/`KV_REST_API_TOKEN` (the older Vercel KV
> names) or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (the current
> Upstash ones) — Vercel migrated its own KV to Upstash in late 2024 and the
> naming depends on when and how you provision. **It does not matter which you
> get:** `api/_lib/store.ts` already reads both.

### 1.2 — Email, so people can sign in

Pick one. Resend is less to maintain; Gmail needs no new account.

**A · Gmail as waypool1@gmail.com** — the account you are already using, and
what `setup:live` configures. Needs an App Password (Google Account → Security
→ 2-Step Verification → App passwords), *not* your normal password. Caps near
500 mails/day, which is plenty for a closed test and not enough for launch.

```bash
vercel env add SMTP_USER production        # waypool1@gmail.com
vercel env add SMTP_PASS production        # the 16-character App Password
vercel env add MAIL_FROM production        # WayPool <waypool1@gmail.com>
```

**B · Resend** — swap to this when Gmail's cap starts to bite.
```bash
cd app
vercel env add RESEND_API_KEY production      # from resend.com
vercel env add MAIL_FROM production           # WayPool <onboarding@resend.dev>
```
`onboarding@resend.dev` works before you own a domain. Once you have one,
verify it in Resend and switch `MAIL_FROM` — codes land in spam far less often
from a domain you control.

**B · Gmail** — uses the account you already have.
```bash
vercel env add SMTP_USER production           # your gmail address
vercel env add SMTP_PASS production           # a 16-char App Password, NOT your login password
```
App passwords live under Google Account → Security → 2-Step Verification →
App passwords. Gmail caps you near 500/day: fine for a closed test, not for
launch.

### 1.3 — Lock the ops endpoint

```bash
vercel env add OPS_KEY production             # any long random string
```
Without it `/api/ops` returns 503 and you are blind to which storage backend is
actually live.

### 1.4 — Deploy

Environment variables do **not** apply to an already-running deployment. This
step is not optional.

```bash
cd app
vercel --prod
```

### 1.5 — Verify, don't assume

```bash
cd app
npm run verify:mail you@example.com https://dikkiconnect-mail.vercel.app
```

That tells you whether a provider actually accepted the message, which is the
thing the API's own `200` response does not tell you. Then:

```bash
curl -s https://dikkiconnect-mail.vercel.app/api/ops -H "X-Ops-Key: <your OPS_KEY>"
```

- [ ] `/api/ops` reports storage **upstash-redis**, not `in-memory`
- [ ] `verify:mail` says a provider accepted the message
- [ ] the code actually arrives in your inbox
- [ ] `curl https://dikkiconnect-mail.vercel.app/api/parcels` returns **401**,
      not 404 — 401 means the route exists and is refusing you correctly

---

## Stage 2 — The pages Play will not let you launch without

**Half a day of writing. Free.** These are hard requirements, not polish.
Play rejects submissions for missing or dead privacy-policy URLs more than for
almost anything else.

- [ ] **Privacy policy at a public URL.** It must honestly list what you
      collect: name, phone, email, approximate location at hand-offs, and
      photographs of parcels. Say how long you keep them — the photo route
      currently keeps hand-over shots for two years — and who they are shared
      with.
- [ ] **Terms of service**, including the bit that actually matters: what
      happens when a parcel is lost or damaged, and who carries that cost.
- [ ] **The ₹5,000 declared-value cap is already printed in the app.** Whatever
      you actually cover must match it, or the app is making a promise you have
      not made.
- [ ] **Prohibited items list**, reachable before booking. The app already
      links to one — make sure the page exists.
- [ ] **A support email that a human reads.** Play requires it and will mail it.
- [ ] **Account deletion.** Play requires both an in-app route *and* a public
      web URL for it, for any app with accounts. *This one is code — it is on
      my list, not yours.*

Host them on the download site you already have
(`dikkiconnect-download.vercel.app`) or anywhere with a stable URL.

> **Worth an hour of a lawyer's time**, specifically on two questions: your
> liability when a stranger's parcel goes missing, and whether moving parcels
> for payment needs a transport permit in Karnataka. I can draft the documents;
> I cannot tell you whether they hold up.

---

## Stage 3 — The Play Console account

**$25 once. 1–3 days of waiting, sometimes longer.** Start it the same day you
start Stage 2 — the identity check runs in the background while you write.

- [ ] Create the account at `play.google.com/console` — **$25, one time, ever**
- [ ] Complete identity verification (government ID, address). Use a name and
      address matching your ID exactly; mismatches are the usual cause of a
      rejected verification and another week gone
- [ ] Decide personal vs organization — see the fork at the top. Organization
      needs a D-U-N-S number, free from Dun & Bradstreet but slow

---

## Stage 4 — The listing

**A day. Free if you make the graphics yourself.**

- [ ] **App icon, 512×512** — done. `npm run brand:icons` regenerates it
- [ ] **Feature graphic, 1024×500** — still needed. This is the banner at the
      top of your store page
- [ ] **Phone screenshots**, at least 2, at least 1080px on the short edge. Use
      real screens: booking, the parcel timeline, the hand-off OTP
- [ ] **Short description**, 80 characters
- [ ] **Full description**, up to 4000
- [ ] **Data safety form.** Fill it from your privacy policy, not from memory.
      Declare location, photos, email, phone, name. Lying here is the one thing
      that gets an account terminated rather than an app rejected
- [ ] **Content rating questionnaire**
- [ ] **Target audience**, ads declaration (you have none), financial features
      declaration

---

## Stage 5 — Upload and open the closed track

**An hour.** This is the day the 14-day clock starts, so do not let it slip
waiting for something that is not blocking.

- [ ] Play Console → **Testing → Closed testing** → create a track
- [ ] Upload **`apks final/WayPool-2.6.0-release-signed.aab`** — the `.aab`, not
      the `.apk`. Play has not accepted APKs for new apps since 2021
- [ ] Accept **Play App Signing** when offered. Your upload key stays the key
      you sign with; Google re-signs for distribution and keeps a backup of the
      distribution key. Take it — it is the only safety net that exists for a
      lost key
- [ ] Add your 12+ testers by email, or create a Google Group and add that
- [ ] Copy the opt-in link and send it to them **with instructions**: they must
      click the link, accept, *then* install from Play. Installing the APK you
      sideloaded them does not count
- [ ] Confirm in the console that the testers show as opted in

**The build is ready today.** Signed, verified not debuggable, package
`in.waypool.app`, versionCode 15, targetSdk 36 — which already satisfies the
[August 31 2026 target-API requirement](https://developer.android.com/google/play/requirements/target-sdk).

---

## Stage 6 — The 14 days

This is not dead time. It is the only period where real people use the app
before strangers do, and Google asks you what you learned from it.

- [ ] **Watch `/api/ops`.** It is the event log — sign-ins, bookings, custody
      steps, failed OTPs. If a tester hits a wall, it shows up here first
- [ ] **Run one full physical hand-off yourself.** Two phones, two accounts,
      a real parcel between two real places: book → drop at hub → traveller
      collects → arrives → receiver collects. This is the one test that cannot
      be done at a desk
- [ ] **Ask testers specific questions**, not "how was it". *Did the OTP arrive?
      Did the camera open? Did the price match what you were charged?*
- [ ] **Keep the testers opted in.** The count is continuous. Someone
      uninstalling on day 9 costs you their nine days
- [ ] Write down what you changed because of their feedback — Google asks for
      exactly this when you apply

---

## Stage 7 — Apply for production

- [ ] Play Console → **Dashboard → Apply for production**
- [ ] Three sections to complete: how easy testers were to recruit and how they
      engaged, your target audience and expected first-year installs, and what
      you changed based on testing
- [ ] Review usually takes **under 7 days**, sometimes longer. They can send you
      back to keep testing

Meeting the 12/14 threshold does not guarantee approval. The questions about
engagement and what you changed are read by a human.

---

## Stage 8 — Before real money moves

You can run a closed test without any of this, as long as the app stays honest
on screen about what is not live — it currently is. You **cannot** take a
stranger's money without it.

| | What | Why it blocks |
|---|---|---|
| 🔑 | **Payment gateway** — Razorpay or Cashfree | Needs a registered business, PAN and a current account. Allow 1–2 weeks |
| | **Payment webhook** — the only thing allowed to mark a parcel paid | Code; mine. Today "I've paid" is taken on trust |
| 🔑 | **Licensed maps key** — Ola Maps or MapmyIndia | The OSM demo endpoints the app falls back to **forbid production use**. Fine while you test, not fine with real users |
| | **Payouts to travellers and hub partners** | Code; mine. Earnings are a local number that goes up |
| | **Wallet as a server ledger** | Code; mine. A local balance is a number, not money |
| 🔑 | **Vercel plan** | Vercel's Hobby tier is for non-commercial projects. Once WayPool takes money you need Pro — budget **$20/month**. Worth confirming against your account's terms |

**Play billing does not apply to you**, and keep it that way: parcel delivery
and a car seat are real-world services, so UPI and a gateway are allowed. The
moment anything *digital* is sold in-app, Google Play billing becomes mandatory
and takes a cut.

---

## What costs what

| | Cost | When |
|---|---|---|
| Play Console | **$25** once | Stage 3 |
| Upstash Redis | free tier | Stage 1 |
| Resend | free tier | Stage 1 |
| Vercel | free now, **$20/mo** when commercial | Stage 8 |
| Maps licence | varies; Ola Maps has a free tier | Stage 8 |
| Payment gateway | ~2% per transaction, no setup fee | Stage 8 |
| Apple, if you go there | **$99/year** | later |

**To get to testers: $25.** Everything else on the path to Finish Line A is
free.

---

## The split

**Only you can do these** — they need an identity, a card, or a legal position:
the keystore backup, Upstash and mail credentials, the Play account and
verification, privacy policy and terms, the payment gateway, the maps licence,
and recruiting 12 humans.

**I can do these, and they are not blocking Stage 5** — say the word on any:

- Deploy the API to Vercel (I did not do it unprompted; it is your account)
- In-app account deletion + the public web URL Play requires
- Accept-a-job endpoint — two travellers can currently claim the same parcel
- Trips, seats and ride bookings on the server — carpooling is still entirely
  local, and its boarding OTP is still computed on-device
- Payment webhook, wallet ledger, payouts
- Push notifications (FCM) — local notifications only fire if the app is open
- Feature graphic and store screenshots
- Draft privacy policy and terms for a lawyer to check
- Turn on R8 minification before production

---

## If you only do one thing this week

Recruit the 12 testers and open the closed track. The fortnight is the only
part of this that cannot be compressed, parallelised or paid for, and
everything else on this page can happen while it runs.

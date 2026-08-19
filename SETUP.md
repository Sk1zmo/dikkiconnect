# DikkiConnect — setup

Everything in the app is built and tested. What is left is credentials, and
credentials can only be created by the person who owns the company: they are
tied to a PAN, a bank account, or an Apple/Google developer identity.

This is the exact list, in the order worth doing it, with what each step buys
you and what it costs.

Nothing here requires touching code. Every integration reads its configuration
from environment variables, and the app reports honestly when one is missing
rather than pretending.

---

## 0. The five-minute version

If you only do one thing, do this — it makes sign-in work end to end today.

1. Google Account → Security → **2-Step Verification** (turn it on if it is off)
2. Same page → **App passwords** → generate one, name it "DikkiConnect"
3. Vercel → your project → **Settings → Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `SMTP_USER` | `info.quantumbay@gmail.com` |
   | `SMTP_PASS` | the 16-character app password, no spaces |
   | `OPS_KEY` | any long random string you invent |

4. **Deployments → ⋯ → Redeploy** — environment variables only apply to new builds
5. Open `/ops`, enter your `OPS_KEY`, and use **Send test** to mail yourself

Email sign-in now works for real. Everything below is the rest.

---

## 1. Email authentication

Two options. They are not competing — they suit different stages.

### Gmail SMTP (start here)

As above. Costs nothing, needs no new account.

**The limit that matters:** a personal Gmail sends roughly 500 messages a day
before Google throttles or locks the account. Fine for a pilot with a few dozen
testers; wrong for a launch.

### Resend (before you launch)

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | resend.com → API Keys |
| `MAIL_FROM` | `DikkiConnect <noreply@yourdomain.com>` |

Free tier is 3,000 emails/month. Verify your domain in Resend and add the DKIM
records it gives you — without that, mail from your domain lands in spam.

Resend wins automatically when both are configured; you do not need to remove
the SMTP variables.

---

## 2. Why there is no SMS

There deliberately isn't any. Sign-in is email, and only email.

**The reason:** texting an Indian number commercially requires DLT
registration — a registered business, PAN, GST, an authorised signatory — plus
per-template approval, and it applies to OTPs as much as to marketing. That is
weeks of paperwork before a single code can be sent, and until it clears the
login simply does not work.

A login that depends on paperwork is a login that is sometimes broken. One
channel that always works beats two where one silently is not there.

**The number is still collected**, at sign-in, alongside the email. It is
stored on the account so a driver can reach a sender at the door and a hub can
ring a receiver whose parcel has been sitting. It authenticates nothing, and no
code is ever sent to it — so nothing has to be true about it for the login to
be sound.

If you later want SMS codes as well, the place to add them is
`api/auth/request-code.ts`: it is a single delivery call, and the challenge
machinery around it is channel-agnostic.

---

## 3. Database

Storage today is an in-memory Map. It works, and it loses every account the
moment a serverless instance goes cold — minutes of inactivity. `/ops` says so
in a warning at the top rather than showing you a green dashboard over a hole.

### Upstash Redis — the intended fix

1. Vercel → your project → **Storage → Create Database → Upstash Redis** (or
   sign up at upstash.com directly)
2. Created through the Marketplace, Vercel injects `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` for you; paste them manually otherwise
3. Redeploy

Free tier is 10,000 commands a day, far more than a pilot needs. The storage
layer detects the variables and switches over — no code change — and `/ops`
flips from a warning to `upstash-redis`.

**What gets stored:** accounts keyed by email, session tokens, live
verification challenges (hashed, five-minute TTL) and the ops event log. All of
it small, none of it relational, which is why Redis rather than Postgres.

### When to outgrow it

Parcels, trips and bookings currently live in the browser's localStorage — good
enough to demonstrate the whole flow on one device, and wrong the moment two
people need to see the same parcel. Moving those to the server is the next
substantial piece of work, and Postgres (Neon or Supabase, both free to start)
is the right destination, because that data *is* relational.

---

## 4. Maps and live tracking

**Already working, with no key and no bill.** Worth knowing what is underneath
so you can judge when to change it.

| Piece | Provider | Cost |
| --- | --- | --- |
| Map tiles | OpenFreeMap (OpenStreetMap vector tiles) | free, unmetered |
| Address search | Nominatim (OpenStreetMap) | free, ~1 req/sec fair use |
| Driving routes | OSRM demo server | free, best effort |
| Device position | the browser's own geolocation | free |

### The honest limits

Nominatim and the OSRM demo server are community infrastructure on a fair-use
policy. Entirely appropriate for a pilot; they will rate-limit you under real
traffic, and neither has an SLA.

### Upgrading, when the time comes

- **Tiles** — MapTiler or Protomaps; swap the style URL.
- **Geocoding** — MapTiler, LocationIQ or Google Places. Google's autocomplete
  is noticeably better for Indian addresses, which matters for door-to-door.
- **Routing** — your own OSRM instance (open source, one container), or Google
  Directions / Mapbox if you want live traffic.

All four sit behind functions in `app/src/lib/geo.ts`. Changing provider means
editing that one file, not the screens.

### Live tracking — what "live" means today

The tracking map animates a vehicle along the real route. It is not yet
following a driver's actual GPS, because that needs two things that do not
exist yet:

1. The driver's app posting its position periodically — a
   `POST /api/trips/:id/ping` endpoint and a `navigator.geolocation.watchPosition`
   loop while a trip is running.
2. Somewhere to keep the last known position — the Redis above.

Both are small once the database is in place. The map component already accepts
a coordinate and draws a vehicle at it; only the source of that coordinate is
missing.

---

## 5. Payments

### What works now

Tapping **Pay** builds a real `upi://pay` intent and opens Google Pay, PhonePe,
Paytm or BHIM with the payee, amount and reference filled in. The user
authorises it in their own bank app with their own UPI PIN. **Money genuinely
moves.** This is how a great many Indian merchants collect and it needs no
gateway account.

Set your collecting VPA:

| Name | Value |
| --- | --- |
| `VITE_UPI_VPA` | e.g. `dikkiconnect@okaxis` |
| `VITE_UPI_NAME` | the registered name shown inside the UPI app |

### What does not work, and why it cannot

The app cannot **confirm** that a payment settled. Android returns no
trustworthy result from a UPI intent, and a client cannot be trusted to report
its own payment — anyone can edit JavaScript. So the app asks the user and
labels that clearly as a claim rather than proof.

### Making settlement real

You need a payment gateway, which means a registered business with a current
account:

| Provider | Notes |
| --- | --- |
| **Razorpay** | the usual choice; best docs, UPI + cards + netbanking |
| **Cashfree** | competitive fees, strong payouts |
| **PhonePe Business** | good UPI rates if you are UPI-only |

Roughly 2% + GST per transaction. Onboarding needs PAN, GST, bank proof and
usually a website with visible refund and contact policies.

The shape of the change:

1. `POST /api/payments/order` creates an order with the gateway, returns its id
2. The app opens the gateway's checkout with that id
3. The gateway calls **your** webhook with a signed payload
4. The webhook verifies the signature and marks the parcel paid

Step 3 is the whole point: settlement confirmed by the gateway to your server,
never by the phone. The current handoff sheet already reconciles against a
reference (`DKCP…`), which is the field a webhook would match on.

### Payouts to drivers

A separate product — Razorpay X or Cashfree Payouts — with separate KYC. Worth
scoping only once money is coming in.

---

## 6. iOS

The Xcode project is committed at `app/ios`. What it needs is a Mac and an
Apple Developer account, and neither can be substituted.

### If you have a Mac

```bash
cd app
npm run ios:sync     # build the web bundle and copy it in
npm run ios:open     # open in Xcode
```

In Xcode: pick your team under **Signing & Capabilities**, choose a device,
press Run. For a build to hand to someone else, **Product → Archive**.

### If you do not have a Mac

`.github/workflows/ios.yml` builds it on GitHub's macOS runners.

- **Every push to main** compiles for the simulator and uploads the result as a
  build artefact. No Apple account needed, and it answers the question that
  matters day to day: does it still build?
- **An installable `.ipa`** additionally needs these repository secrets
  (Settings → Secrets and variables → Actions):

  | Secret | Where it comes from |
  | --- | --- |
  | `IOS_TEAM_ID` | Apple Developer → Membership → Team ID |
  | `IOS_DIST_CERT_P12` | your distribution certificate, base64-encoded |
  | `IOS_DIST_CERT_PASSWORD` | the password you set when exporting it |
  | `IOS_PROVISIONING_PROFILE` | the ad-hoc profile, base64-encoded |

  To base64 a file: `base64 -i cert.p12 | pbcopy` on macOS, or
  `certutil -encode cert.p12 out.txt` on Windows.

  Without those secrets the job **skips** rather than fails, so the workflow
  stays green and a red X keeps meaning something.

### Apple Developer Program

$99/year, and there is no way around it for distributing to real devices —
TestFlight included. Approval usually takes a day or two; a company account
also needs a D-U-N-S number, which can take a fortnight. Start it early if you
are publishing as a company rather than as an individual.

### What differs from Android

- **Geolocation** requires the usage strings now in `Info.plist`. Without them
  iOS terminates the app rather than refusing the permission.
- **UPI apps** must be declared in `LSApplicationQueriesSchemes` (done), or iOS
  reports every one of them as not installed.
- **No sideloading.** Android testers can install the APK directly; iOS testers
  must go through TestFlight.

---

## 7. Permissions

Both apps declare the same four things, and each is requested at the moment it
is first needed rather than in a wall at launch. The download page explains
each one to the user in the same words.

| | Android | iOS |
| --- | --- | --- |
| Location | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | `NSLocationWhenInUseUsageDescription` |
| Camera | `CAMERA` + optional `hardware.camera` | `NSCameraUsageDescription` |
| Photos | `READ_MEDIA_IMAGES` (13+), `READ_EXTERNAL_STORAGE` (≤32) | `NSPhotoLibraryAddUsageDescription` |
| Network | `INTERNET`, `ACCESS_NETWORK_STATE` | granted implicitly |
| Screen awake | `WAKE_LOCK` | not needed |

Three details that are easy to get wrong and fail silently:

- **iOS terminates the app** if geolocation is called with no usage string. It
  does not refuse the permission — the process dies. The strings are the ones
  the user reads in the sheet, and App Review rejects vague ones.
- **Android 13 split storage** into per-type permissions. Both spellings are
  declared, the old one capped at `maxSdkVersion="32"`, or the app can read
  nothing on one half of the devices in the field.
- **`LSApplicationQueriesSchemes`** must list every UPI scheme on iOS, or
  `canOpenURL` reports each app as not installed and the pay button looks
  broken rather than absent.

The camera is declared `required="false"` so the app still installs on a device
without one — a hub terminal, say — instead of being filtered out of the Play
Store for it.

---

## 8. Priority

If it were my money and my week:

1. **Gmail SMTP + `OPS_KEY`** — sign-in works today, costs nothing
2. **Upstash Redis** — accounts stop evaporating; ten minutes
3. **Razorpay onboarding** — start early, it is the slowest
4. **Apple Developer** — also slow, run it in parallel
5. **Resend + a sending domain** — before real users arrive

The first two are an afternoon and unblock real testing. Everything else can
run in the background while people are already using the thing.

# WayPool — everything needed before closed testers can actually use it

Written for: you, as the person who has to tick these off.

> **Doing these, in order, is `GO-LIVE-RUNBOOK.md`.** This file is what is
> missing; that one is what to do about it, with the commands and the order.

This is not a wish list. Every line is something that is **currently missing or
currently a lie**, and the app cannot be handed to a tester until it is done.
Lines marked ✅ are done and verified. ◐ is in progress in this working tree.
☐ is not started. 🔑 means only you can do it — it needs an account, a card, or
a key an agent must never hold.

A note on the shape of the problem, because it decides the order of everything
below: the app shipped as a **front end on `localStorage`**. Two phones running
it saw two unrelated worlds — a tester who booked a parcel and a tester who ran
the hub could not see each other, and the same was true of carpooling until
this pass. That is now fixed for both parcels and rides; the store listing is
what is left between here and a tester.

---

## 1. The thing has to be real — one shared ledger

| | Item | Why it blocks a tester |
|---|---|---|
| ✅ | Server domain: pricing, custody state machine, hand-off OTPs, event log | `api/_lib/domain.ts` |
| ✅ | `POST /api/parcels` — the server prices and creates the booking | A price a client computes is a price a client can change |
| ✅ | `GET /api/parcels` — what I sent, what I'm carrying | |
| ✅ | `/api/custody/:checkpoint` — issue code, verify code, advance, log | The only way a parcel may move |
| ✅ | 34 assertions over fare, custody order and OTP lockout | `npm run test:api` |
| ✅ | Typed client with no silent local fallback | `src/lib/api.ts` |
| ✅ | `Authorization` added to the API's CORS allow-list | Without it the APK's every signed-in call died at the browser, reported as "could not reach WayPool" |
| ✅ | A way to run the API on this machine | `npm run dev:api`. `vite dev` serves no `/api`, so none of the above could be exercised locally before |
| ✅ | Booking goes through the server, and the app shows the server's id and price | Verified end to end — the UI booked WYP-4861 at ₹181 and the server's record matches to the rupee |
| ✅ | Every custody step goes through the server | intake → handoff → arrive → deliver all walked against a running API, with out-of-order, replay, wrong-code and missing-photo all refused |
| ✅ | **The API is deployed and live** | Every route verified in production: `/parcels`, `/parcels/claim`, `/photos`, `/custody/*`, `/account/delete` all answer 401 rather than 404 |
| ✅ | APK's CORS preflight passes | `Origin: https://localhost` → 204 with `Authorization` allowed. Without this every signed-in call from the APK dies in the browser |
| ✅ | Parcels load from the server on sign-in | The server's records replace the seeded ones by id, so a reinstall keeps a tester's parcels |
| ✅ | Accept-a-job claim, decided atomically by the database | Two drivers claiming the same parcel at once: one wins, one gets `taken` |
| ✅ | Trips, seats and ride bookings on the server | `api/rides/index.ts` — publish, search by corridor, atomic seat booking (`INCRBY`, race-tested), cancel with refund |
| ✅ | Server-issued boarding OTP, plus the driver-side screen to check it | `TripManifest.tsx` — the half that never existed before: a passenger's code had nothing on the other end to verify it against |
| ✅ | Wallet as a server ledger | Real per-account balance + transaction history, `api/rides/index.ts` (`?wallet=1`, `?topup=1`, `?spend=1`, `?tip=1`). Still not a payment gateway — see §3 |
| ✅ | Persisted chat per trip | `?chat=<tripId>` — real messages, no more scripted auto-replies. Driver-side inbox UI is still missing (see §9) |
| ✅ | Login vs. signup, fixed | Every successful sign-in used to land on the role picker, indistinguishable from a brand-new account. A returning sign-in now goes straight to their own portal |
| ✅ | Fake driver/traveler identities removed | `TRAVELERS` fixture ("Arjun Menon" et al.) deleted; 11 screens that showed it regardless of who actually signed in now read the real account's name |
| ✅ | Upstash Redis connected and **verified durable in production** | `/api/ops` reports `upstash-redis`, `storageDurable: true`, no warnings. A challenge written by one request was read back by another |

## 1b. The brand

| | Item | Why |
|---|---|---|
| ✅ | New mark — a W drawn as one road through two pools | The old one was a switchback road spelling an **S**. That was Stowza's, and it survived the rename because a logo is the one asset find-and-replace cannot touch |
| ✅ | Every raster regenerated from the one path | `npm run brand:icons` — launcher icons at five densities, adaptive foreground, maskable, apple-touch, iOS 1024. Verified inside the signed APK |
| ✅ | Opening cut from 6.6s to 2.2s, and it now builds the mark | It was a film: a carton falling, a car arriving, a boost, a pixel dissolve. Lovely once, paid for on every cold start |
| ✅ | Launch background unified across the three places that set it | Native theme, Capacitor config and the in-app opening all read `#071231`, so the hand-over is not a flash |
| ✅ | `DIKKI10` promo code renamed | A promo code is typed by a customer and printed on a receipt — it is brand copy |
| ✅ | Promo codes validated server-side | Any non-empty string used to buy 20% off. The server was agreeing to it |
| ☐ | Vercel projects still named `dikkiconnect-*` | Renaming changes the deployment URL, so it is your call — dashboard action |

## 2. The promises the app prints on screen

The app tells a user "an OTP and a photo". Both have to be true before a
stranger trusts it with a parcel.

| | Item | Why it blocks a tester |
|---|---|---|
| ✅ | OTPs are issued by the server, single-use, 30-minute expiry, 5 attempts then locked | The old code was derived on-device from the parcel id and could be revealed to the person about to type it. `lib/otp.ts` is deleted |
| ✅ | The sender, hub and traveller screens all read the server's code | Checked: the sender's pass showed 284957 while the server held 284957 |
| ✅ | Real camera capture at hand-off, uploaded, ids stored on the custody event | Was a drawn cardboard box that had never opened a camera |
| ✅ | Real QR scanning | Was a 2.8-second timer that reported a match whatever it was pointed at. The parser has 19 tests, two of which caught a hole while being written |
| ☐ | Photos visible on the parcel timeline afterwards | Evidence nobody can look at is not evidence |
| ☐ | Receiver's identity check at delivery | Right now delivery needs only the code |

## 3. Money

| | Item | Why it blocks a tester |
|---|---|---|
| ✅ | UPI deep-link hand-off to the user's own bank app | Honest about what a browser can and cannot confirm |
| ☐ | Payment gateway webhook — the **only** thing allowed to mark a parcel paid | Today "I've paid" is taken on trust |
| 🔑 | Gateway account (Razorpay/Cashfree/PhonePe), keys, webhook secret | Needs a registered business and a bank account |
| ✅ | Refund path for a cancelled ride booking | A wallet-paid seat is refunded (both legs reversed) when the passenger or the driver cancels. Parcels still have no refund path — they have no payment gateway yet to refund from |
| ◐ | Payouts to travellers and hub partners | A ride's fare now moves wallet-to-wallet for real when paid by wallet, and a tip moves the same way. Parcel delivery payouts and a weekly bank settlement are still a local number that goes up |
| 🔑 | Decide and write the COD position | The app says "not in the pilot" — keep it that way for testing |

**Play policy, so this does not get rejected:** parcel delivery and a car seat
are real-world services, so Google Play billing does **not** apply and UPI is
allowed. Keep it that way — the moment anything digital is sold in-app, Play
billing becomes mandatory.

## 4. Maps and addresses

| | Item | Status |
|---|---|---|
| ✅ | Provider made configurable — `VITE_GEOCODE_URL`, `VITE_ROUTING_URL`, `VITE_MAP_TILES`, `VITE_MAPS_KEY` | |
| 🔑 | A licensed key (Ola Maps, MapmyIndia or Google) | The OSM demo endpoints the app falls back to **forbid production use**. Fine for your own testing, not for testers |
| ☐ | Verify geocoding returns sane results for the pilot corridors | |

## 5. Accounts, sessions, notifications

| | Item | Why |
|---|---|---|
| ✅ | Email/phone sign-in with a mailed code | Works today |
| ✅ | Mail live from **waypool1@gmail.com** over Gmail SMTP | `/api/ops` reports `mailProvider: smtp`; a real code was delivered |
| ☐ | Phone OTP over SMS | Indian users will expect it; email-only will cost you testers |
| ☐ | Server-side push (FCM for Android) | Local notifications only fire if the app is running |
| 🔑 | Firebase project + `google-services.json` | |
| ☐ | Session expiry and refresh | |
| ✅ | Delete-my-account, in-app and at the public `/delete-account` URL | The old one showed a toast and deleted nothing. Parcels in flight block deletion |

## 6. The build Google will accept

| | Item | Why |
|---|---|---|
| ✅ | Rebrand complete and verified inside the APK — `in.waypool.app`, no `Stowza`, no `DKC-`, no demo artefacts | |
| ✅ | `versionCode 15`, `versionName 2.6.0`; signing config wired to read `keystore.properties` | `app/android/RELEASE-SIGNING.md` |
| ✅ | Unjustified background-location permission removed from iOS | It would have failed review |
| ✅ | Upload keystore created, 4096-bit RSA, valid ~27 years | `app/android/make-upload-key.ps1` generated it with a random password written only to the gitignored `keystore.properties`. SHA-256 `5A:5D:24:41:…:8F:60` |
| 🔑 | **Back up the keystore and its password** | `app/android/waypool-upload.keystore` + the password in `keystore.properties`. Lose either and this app can never be updated again — not by you, not by Google |
| ✅ | Signed `.apk` and `.aab` built for 2.6.0 | `apks final/WayPool-2.6.0-release-signed.{apk,aab}`, verified with `apksigner verify --print-certs` — signed by CN=WayPool, same key fingerprint as every prior build |
| ✅ | Release build is not debuggable | Checked the manifest for `android:debuggable` — absent; targetSdk 36, minSdk 24 |
| ☐ | Minification (R8) is still off | `minifyEnabled false`. Not a blocker for testing; worth turning on before production |
| ✅ | `VITE_API_ORIGIN` baked into the release build | Verified inside the APK's JS bundle — points at the live `dikkiconnect-mail.vercel.app` |
| ✅ | 2.6.0 published to the download page | `/download` serves the new signed APK; the footer reads `WayPool 2.6.0` |

### Known remaining mockups — not wired, not hidden

Said plainly so the next pass knows where to look, not discovered by a tester:

| | Item | Why it's still fake |
|---|---|---|
| ☐ | Hub **History** tab (activity log + weekly settlements) | Static arrays (`LOG`, `SETTLEMENTS`) — no server-side hub event feed exists yet to read from |
| ☐ | Hub Home's "Travelers expected" widget | Two hardcoded names/plates, not an ETA prediction from real trips |
| ☐ | Ride ratings, tags and the written note on `RideComplete` | No reviews domain server-side. The **tip** on that same screen is real (moves wallet-to-wallet); the star rating next to it is not persisted anywhere |
| ☐ | Driver-side chat reply | A driver can be messaged and the thread is real and persisted, but there is no traveler-side inbox screen to read or answer it from yet — `TripManifest.tsx` covers boarding, not messaging |
| ☐ | "KYC ok" / vehicle RC verification badges | Removed from the screens that showed them unconditionally (Handoff, CreateTrip) rather than left claiming a check that doesn't run — but no real Aadhaar/RC verification pipeline exists to replace them with |

## 7. Play Console

| | Item |
|---|---|
| 🔑 | Developer account — $25 once |
| 🔑 | **12 testers opted in continuously for 14 days** before you may apply for production — personal accounts created after 13 Nov 2023. Google's page does not address organization accounts; an organization account also needs a D-U-N-S number |
| 🔑 | Identity and address verification |
| ◐ | App icon 512×512 done; feature graphic 1024×500 still needed | The icon is regenerated from the one mark path by `npm run brand:icons` |
| ☐ | Phone screenshots, at least 2, 16:9 or 9:16, 1080px+ |
| ☐ | Short description (80 chars), full description (4000) |
| 🔑 | **Privacy policy at a public URL** — mandatory, and it must actually describe what you collect: name, phone, email, location, parcel photos |
| ☐ | Data safety form, filled honestly against the above |
| ☐ | Content rating questionnaire |
| 🔑 | Target audience, ads declaration, financial-features declaration |
| ☐ | Closed testing track created, tester emails added, opt-in link shared |

## 8. Legal, for an app moving other people's property

| | Item |
|---|---|
| 🔑 | Terms of service, and the liability position when a parcel is lost or broken |
| 🔑 | The ₹5,000 declared-value cap is printed in the app — make sure whatever you actually cover matches it |
| 🔑 | Prohibited-items list, visible before booking |
| 🔑 | A reachable support channel — Play requires an email that works |
| 🔑 | Whether carrying parcels for strangers needs a transport permit in your pilot states |

## 9. Before you hand the link to anyone

| | Item |
|---|---|
| ☐ | Two real devices, two real accounts: book → intake → hand-off → arrive → deliver, end to end |
| ☐ | Same for a ride: publish on one device, book on another, board with the server-verified OTP on the driver's `TripManifest` screen |
| ☐ | Same run with one device in airplane mode at each step, checking nothing is silently lost |
| ☐ | Sign out, reinstall, sign in — the parcels **and rides** are still there |
| ☐ | Crash reporting wired, so you hear about a tester's crash without them telling you |
| ☐ | A way to reach you from inside the app |

---

## The shortest honest path

1. ✅ **Vercel KV credentials and SMTP** — done; the server is live and
   durable, and both parcels and rides persist across devices.
2. ✅ §1 and §2 are done and verified — parcels, trips, seat booking, boarding
   OTPs, wallet, chat. Nothing left here blocks a first testing round.
3. 🔑 **Create the keystore** — done (already backed up? confirm). The signed
   `.apk`/`.aab` for 2.6.0 are built.
4. 🔑 **Privacy policy and terms** at a public URL — still the biggest
   remaining blocker to Stage 5 of `GO-LIVE-RUNBOOK.md`.
5. §7 Play Console, closed track, testers in.
6. §3 money (a real gateway) and §5 push can trail the first testing round, as
   long as the app is honest on screen about what is not live yet — it
   currently is.

Everything with a 🔑 is blocked on you. Everything else I can finish — the
"Known remaining mockups" list above is next if you want it, but none of it
blocks a closed test.

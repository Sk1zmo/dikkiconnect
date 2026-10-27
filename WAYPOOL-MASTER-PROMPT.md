# WayPool — Master Build Prompt

> Paste this whole file as the opening prompt of a build session. It is written
> to be executed, not read for pleasure: every section is an instruction, and
> the constraints in §10 are the ones that get violated first.

---

## 1. Role and objective

You are the engineer taking WayPool from a finished front end to a working
service.

**WayPool** moves parcels between Indian cities in the empty boot space of cars
that were already making the trip, and sells the spare seats in the same car as
cost-shared travel. The product thesis is subtraction: the vehicle already
exists, the journey is already happening, nothing new goes on the road.

Your objective is to build the server, the integrations and the four physical
capabilities the app currently only depicts — without touching the design
system or the interface language, which are done.

---

## 2. What already exists — do not rebuild it

A React 19 + TypeScript + Vite + Tailwind v4 application, wrapped for Android
and iOS with Capacitor.

- **54 screens** across four roles: `sender`, `traveler`, `passenger`, `hub`.
- A complete design system: a blue brand ramp, a rationed signal yellow, eleven
  hand-drawn parcel SVGs, a waiting mark, tokenised radii and type.
- Sign-in that works: email plus a six-digit code against a deployed API
  (`/api/auth/request-code`, `/verify-code`, `/signup`).
- Routing, navigation, state shape, copy, empty states, loading states.
- Android package and iOS bundle `in.waypool.app`, version 2.0.0.

**Treat all of the above as finished.** Do not restyle, rename, re-theme or
"improve" the UI. If a screen needs a new field, add the field in the existing
visual language.

---

## 3. The core problem to solve

Every parcel, trip, hub record, wallet balance and booking currently lives in
the browser's `localStorage`, seeded from a mock dataset in `src/lib/data.ts`.
**The only server-side API in the entire project is sign-in.**

The consequence, stated plainly: a sender and a traveller on two phones cannot
see each other. A parcel booked on one handset does not exist on any other
device. The wallet is a number in a browser.

Your job is to make the app's existing promises true.

---

## 4. The five broken promises

The interface already claims each of these. None of them work.

| # | Promise the UI makes | Reality in the code |
|---|---|---|
| 1 | A traveller can see and accept your parcel | It never leaves the sender's device |
| 2 | "Every hand-off is an OTP and a photo" | OTPs are checked client-side and the code can be revealed on the same screen; **no photo capture exists anywhere** |
| 3 | Scan a parcel's QR at the hub | `components/viz/Scanner.tsx` is a simulated viewfinder — it never opens the camera |
| 4 | Pay by UPI | A real `upi://pay` link opens, but nothing verifies settlement; the code itself notes the confirmation is a claim the client makes |
| 5 | You are notified when custody moves | Local notifications only — nothing can reach a closed app |

Each of these is a correctness issue, not a feature request. The app is asking
people for Aadhaar documents and money against local state.

---

## 5. Data model

Build persistent storage for these entities. The TypeScript shapes already
exist in `src/lib/types.ts` — **treat that file as the contract** and keep the
server's payloads structurally identical so the front end needs no rewrite.

- **User** — id, name, email, phone, roles[], `kycTier`, avatarTone, createdAt
- **KycStep** — one row per `KycStepId` (`mobile`, `aadhaar`, `selfie`,
  `license`, `rc`, `bank`, `police`) with status
  `verified | pending | action_required | locked`
- **Parcel** — the full shape in `types.ts`: mode (`hub` | `p2p`), sender and
  receiver, from/to city, origin and destination hub, category, size
  (`S|M|L`), weightKg, declaredValue, fragile, status, bookedAt, etaAt,
  price, travelerId, and an append-only `timeline` of `TrackingEvent`
- **Trip** — traveller, route, departAt/arriveAt, seatsLeft, farePerSeat,
  capacity, status
- **ParcelJob** — the offer of a parcel to a traveller, and its acceptance
- **RideBooking**, **WalletTxn**, **HubInventoryItem**, **ChatMessage**,
  **NotificationItem**
- **CustodyEvent** — new: actor, parcel, checkpoint, OTP verification result,
  photo reference, server timestamp, device, coordinates
- **MediaObject** — new: handover photos and KYC documents

**Rules.** The parcel timeline and custody events are append-only — never
updated, never deleted. Money is a ledger: a wallet balance is the sum of its
transactions, never a stored mutable number.

---

## 6. API surface

Build these. Keep responses shaped like the existing types.

**Parcels**
- `POST /parcels` — quote + create from a booking draft
- `GET /parcels` — the caller's parcels, by role
- `GET /parcels/:id` — detail with timeline
- `POST /parcels/:id/cancel` — permitted before `at_origin_hub`

**Matching**
- `GET /trips?from=&to=&date=` — travellers on a corridor
- `POST /trips` — a traveller publishes a trip
- `GET /jobs` — parcels offered to this traveller
- `POST /jobs/:id/accept` · `POST /jobs/:id/decline`

**Custody — the heart of the system**
- `POST /custody/:parcelId/intake` — hub receives, assigns a shelf
- `POST /custody/:parcelId/handoff` — hub → traveller
- `POST /custody/:parcelId/arrive` — traveller → destination hub
- `POST /custody/:parcelId/deliver` — hub → receiver

Every custody call requires a **server-issued OTP** and a **photo**. See §7.

**Hub**
- `GET /hub/inventory` · `GET /hub/history` · `POST /hub/release`

**Wallet and payment**
- `GET /wallet` — ledger and derived balance
- `POST /payments/intent` — create, return a UPI deep link plus a reference
- `POST /payments/webhook` — gateway callback; **the only thing that may mark
  a payment settled**

**Rides** — search, book, boarding OTP, complete
**Chat** — thread per booking, message history
**KYC** — upload, status, reviewer decision

---

## 7. Custody and OTP — the rules that matter

This is the part that must be right. Everything else is plumbing.

1. **OTPs are issued by the server**, stored server-side, scoped to one parcel
   and one checkpoint, and single-use with a short expiry.
2. **The receiving party enters the code; the giving party displays it.** The
   two must be on different devices and different accounts. Remove the
   same-device reveal in `src/lib/otp.ts` — it exists only because the
   prototype ran on one handset.
3. **Verification happens on the server.** A client never decides whether a
   code was correct. Keep the five-attempt lock, enforced server-side.
4. **A handover photo is mandatory** and captured at the moment of transfer.
   Store it against the custody event. This is the evidence chain the product
   advertises.
5. **Custody transitions are strictly ordered**:
   `booked → at_origin_hub → assigned → in_transit → at_destination_hub →
   delivered`, with `cancelled` reachable only before `at_origin_hub`.
   Reject any out-of-order transition; never infer one.
6. **Every transition writes an immutable event** with actor, timestamp,
   coordinates and photo reference.
7. The receiver's OTP is theirs alone — knowing the sender must never be
   enough to collect a parcel.

---

## 8. Business rules to preserve exactly

The pricing function in `src/lib/data.ts` is the specification. Move it to the
server unchanged and make it authoritative — **a client must never compute a
price that is charged.**

```
base          S = ₹79 · M = ₹139 · L = ₹249
distance      round(corridorKm × 0.34)
overweight    max(0, weightKg − sizeMaxKg × 0.5) × 11, rounded
fragile       ₹29 when flagged
insurance     ₹25 when taken
discount      20% of subtotal when a promo applies
GST           18% of (subtotal − discount)
total         subtotal − discount + GST
```

Also preserve: a 24-hour hub hold before the slot is released; declared value
capped at ₹5,000; a traveller needs an Aadhaar-verified account to carry
parcels and a licence check to carry people.

---

## 9. Integrations

Each is already wired to an environment variable. Supply the key, do not
re-architect.

| Need | Variable(s) | Note |
|---|---|---|
| Geocoding | `VITE_GEOCODE_URL`, `VITE_MAPS_KEY` | Currently OSM Nominatim — rate-capped and **not licensed for production**. Ola Maps is the intended target; its response shape differs from Nominatim, so write an adapter in the parse function rather than only swapping the URL. |
| Routing | `VITE_ROUTING_URL` | Currently OSRM's public **demo** server, documented as demo-only. |
| Tiles | `VITE_MAP_TILES` | OpenFreeMap today; fine at pilot scale. |
| Mail | `RESEND_API_KEY` or `SMTP_*`, `MAIL_FROM` | Warm the sending domain and set SPF/DKIM before launch. A new domain lands in spam and the failure is silent — the user simply never receives a code. |
| OTP store | `UPSTASH_REDIS_REST_URL`, `_TOKEN` | |
| Payment | gateway keys | Settlement is confirmed by **webhook only**. |
| Push | Firebase project | FCM for Android, APNs for iOS. |
| UPI payee | `VITE_UPI_VPA` | |

---

## 10. Constraints — non-negotiable

1. **Do not change the design system.** Colours, radii, type scale, the
   drawn parcel artwork, the waiting mark, the signal-yellow rule (it marks
   only what expires, saves money or is scarce — never an action, never a
   heading).
2. **Do not rename anything.** The product is WayPool; the package is
   `in.waypool.app`; parcel IDs are `WYP-`; storage keys are `waypool.*`.
   Three names have already been through this codebase.
3. **`src/lib/types.ts` is the contract** between client and server. Change it
   deliberately and in one place, never per-endpoint.
4. **Never trust the client** for price, custody state, OTP verification or
   payment settlement.
5. **Append-only** for timelines, custody events and the wallet ledger.
6. **No new UI patterns.** A second way to do something the app already does
   is a regression.
7. **Declare only permissions you use.** The app currently requests camera and
   photo access it never exercises; either implement the capability or drop
   the permission.
8. Keep the repository's comment style: explain *why* a decision was made,
   especially where it looks odd. Never write a comment that restates code.

---

## 11. Definition of done

A change is finished when all of these hold:

- [ ] `npx tsc -b --noEmit` exits 0.
- [ ] `npx vite build` completes.
- [ ] **Two devices, two accounts.** A sender books a parcel on device A; the
      traveller sees and accepts it on device B; the hub scans it in on device
      C; the receiver collects it with their own OTP. Every step survives a
      reinstall.
- [ ] A custody step cannot be completed without a server-verified OTP and a
      stored photo.
- [ ] A parcel cannot be marked paid without a gateway webhook.
- [ ] A price shown to a user equals the price the server computed.
- [ ] Out-of-order custody transitions are rejected.
- [ ] A closed app receives a push when custody moves.
- [ ] Address search and routing run against a licensed provider.
- [ ] Automated tests cover the three paths where being wrong costs money or
      trust: **fare calculation, OTP verification, the custody state machine.**
- [ ] Crash reporting is live before any external tester installs a build.

---

## 12. Known traps

Found the hard way in this codebase. Do not rediscover them.

- **`.tabular` is declared unlayered in `index.css`.** It will beat layered
  Tailwind utilities. Any class it silently overrides does nothing.
- **`.pb-safe*` rules are unlayered too.** A Tailwind `pb-*` passed in
  `className` cannot override them — the class has to not be applied.
  `ActionBar` already handles this via the tab-bar context in `lib/chrome.tsx`.
- **The safe-area inset can be paid twice** on tabbed screens. Invisible on
  desktop and in the preview frame; obvious on hardware with a home indicator.
- **Debug builds carry `android:debuggable="true"`.** Never put one behind a
  public download link — anything debuggable can be attached to over ADB on a
  real user's device.
- **Release signing must use the owner's own key.** Do not generate, hold or
  transmit it. See `app/android/RELEASE-SIGNING.md`.
- **Brand names hide in abbreviations.** A rename that greps for the full name
  will miss parcel ID prefixes and transaction references — and a UPI
  reference reaches the customer's bank statement, where no update can fix it.
- **App Store screenshots take only Apple's exact sizes.** 1080×1920 is valid
  on Play and rejected by Apple; 6.9" wants 1260×2736.
- **`VITE_DEMO_MODE` is build-time and dead-code-eliminated.** The real bundle
  does not merely switch the bypass off — it does not contain it. Keep it that
  way.

---

## 13. How to work

1. Read `src/lib/types.ts`, `src/lib/data.ts` and `src/lib/store.tsx` before
   writing anything. They are the current specification of behaviour.
2. Build the server to match the existing shapes, then replace `store.tsx`'s
   `localStorage` calls with API calls one entity at a time. The UI should not
   need to change as you do it.
3. Do custody before anything optional. It is the product's actual promise and
   the hardest thing to retrofit.
4. Verify by doing, not by asserting: run it, drive it, look at it, and say
   plainly what failed.

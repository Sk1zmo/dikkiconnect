# Before you hand the link to beta testers

Written for: you, deciding what is worth fixing first.

My own list, not a generic one. Ordered by what a tester will actually hit,
and honest about which of these I think you can ship without.

**Already done in this pass** — the demo seed is gone (a new account no longer
opens holding five parcels addressed to strangers and ₹1,240 it never added),
there is a four-card tour per portal, and the hub scanner now fetches a parcel
from the server instead of looking only in its own device's list.

---

## Blocking — a tester hits these in the first ten minutes

| | Item | Why |
|---|---|---|
| 🔑 | **Send the first code to yourself and check spam** | A brand-new Gmail sender lands in spam roughly once, then stops. If your first tester's code goes to spam and they give up, you have lost them before they see anything |
| 🔑 | **Tell testers parcels work and carpooling does not** | Trips, seats and the boarding OTP never touch the server. A tester who starts there will report everything as broken, and they will be right |
| ☐ | **The wallet is not real money** | It shows ₹0 now, but "Add money" still increments a local number for free. Either mark it clearly as a pilot placeholder or hide it — a tester who "tops up" and then pays with it has been misled |
| ☐ | **Two testers, two phones, one parcel, end to end** | I have proven every step against the server individually. Nobody has yet walked a real box from one hand to another. Do this before anyone else does |

## Worth fixing before you widen the test

| | Item | Why |
|---|---|---|
| ☐ | **Hub inventory has no server listing** | A hub manager sees only parcels this device has scanned. Fine for a scripted test, wrong the moment two hub testers share a counter. Needs `GET /api/parcels?hub=…` |
| ☐ | **Nothing tells a sender their parcel moved** | Push is not wired. The timeline is correct but the sender has to open the app to find out. For a fortnight-long test, that is the difference between engaged testers and silent ones |
| ☐ | **Photos are write-only** | Every hand-over is photographed and stored, and nothing ever shows them. The evidence exists but no screen displays it |
| ☐ | **The 24-hour drop-off window is not enforced** | The app says a parcel must be dropped within 24 hours. Nothing expires. Either enforce it or stop printing it |
| ☐ | **A claim can be abandoned silently** | A traveller claims a job, never collects, and the claim quietly expires after a day. Nobody is told — not the sender, not the hub |

## Polish — real, but a tester will forgive them

| | Item |
|---|---|
| ☐ | `Messages.tsx` still renders chat threads from the demo fixtures. It is the carpool side, so it is consistent with that half being unfinished, but it is visibly fake |
| ☐ | R8 minification is off (`minifyEnabled false`). The APK is 4.5 MB and could be smaller |
| ☐ | The map bundle is 954 kB — about a quarter of everything shipped |
| ☐ | No crash reporting. If a tester's app dies you will hear about it only if they tell you |
| ☐ | "Net banking" and "Cash on delivery" are shown as coming soon. Honest, but they are dead weight on the payment screen during a test |
| ☐ | The ops dashboard is behind a key but has no rate limiting |

## Things I would deliberately *not* fix before beta

Said plainly so you do not spend the fortnight on them:

- **Payment gateway.** UPI hands off to the user's own bank app and the screen
  is honest that settlement is not reconciled yet. A test does not need real
  money moving, and wiring a gateway needs a registered business.
- **Licensed maps key.** The free endpoints are fine for your own testing. It
  matters before the public, not before twelve people you know.
- **iOS.** $99 and a Mac for a build nobody in a closed Android test will use.
- **Carpooling on the server.** It is a second product. Get parcels right with
  real people first.

---

## What a tester sees now, in order

1. A 2.2-second opening that draws the mark, then the landing screen.
2. Sign in with **email or phone** — the code comes from waypool1@gmail.com.
3. A four-card tour for whichever portal they are in, once.
4. An **empty** home with a designed empty state, not somebody else's parcels.
5. Book a parcel: the id and the price both come back from the server.
6. A drop-off pass with a QR and a code **the server issued** — the hub's
   screen will accept that exact code and nothing else.
7. Hand-overs that need a real photograph and a real code, in that order.

## The link to send them

```
https://dikkiconnect-mail.vercel.app/WayPool.apk
```

Signed, versionCode 10, v2.2.0. On first install Android will warn about
installing from an unknown source — that warning goes away once the build
comes from the Play closed-testing track instead.

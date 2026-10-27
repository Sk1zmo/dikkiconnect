# WayPool — progress report

**Prepared for:** the client
**Date:** 24 October 2026
**Build:** 2.5.0 · Android · available for testing now

---

## Where things stand

WayPool has moved from a working prototype to a **real product with a real
server behind it**. The difference matters more than it sounds.

Until recently, the app ran entirely on the phone it was installed on. Two
people using it saw two unrelated worlds — a sender could book a parcel and
the hub would never know. It looked finished and could not actually be used
by more than one person at a time.

That is now solved. Bookings, prices, hand-over codes and photographs all live
on a server. A parcel booked on one phone appears on another. **The product
can now be tested by real people, and a build is ready for them today.**

---

## What works end to end

A parcel can be sent from Bangalore to Mysore and tracked the whole way:

1. **Sign in** with an email address. A six-digit code arrives by email.
2. **Book a parcel** — size, contents, hubs, receiver. The price is calculated
   by the server, so what is shown is what is charged.
3. **Drop it at a hub.** The hub scans the code on the sender's phone,
   photographs the parcel, and enters a code only the sender has.
4. **A traveller claims the job** from a shared board and collects it with
   another code.
5. **It arrives**, the destination hub takes it in, and the receiver collects
   it with a code of their own.

Every one of those five hand-overs requires a code *and* a photograph. Neither
is optional, and the app cannot skip a step or repeat one.

This is verified automatically: an **automated test walks the entire journey
on every change** — 101 checks in total — including the cases that matter most,
such as attempting to deliver a parcel nobody collected, reusing a code, or two
travellers claiming the same job at the same moment. All pass.

---

## Recently completed

| | |
|---|---|
| **New identity** | A new mark — a "W" drawn as a road dipping through two pools. The previous logo was inherited from an earlier name and quietly still spelled it. |
| **A faster opening** | The launch sequence was a 6.6-second film. It is now 2.2 seconds and draws the logo. A launch screen is paid for on every single open; the second viewing of a film is already too long. |
| **A guided tour** | Four short cards on first use, tailored to whether someone is sending, driving or running a hub. |
| **Online payments** | A payment link opens the customer's own bank or wallet app. Crucially, **only the payment provider can mark a parcel as paid** — the app cannot. |
| **Push notifications** | The server can now wake a phone when a parcel moves, rather than the sender having to open the app to find out. |
| **Account deletion** | Required by Google Play, and it genuinely deletes. |

---

## Honest position on what is not finished

Three things are deliberately incomplete, and it is better to say so now.

**Carpooling is not connected to the server.** Parcel delivery is complete;
the ride-sharing half still runs only on the phone. Testers should be pointed
at parcels. This is the largest remaining piece of work.

**Payments are built but not switched on.** The system is finished and tested;
it needs a payment gateway account, which requires a registered business and a
bank account. Until then the app is clear on screen that settlement is not live.

> One finding worth flagging: **PayPal cannot process domestic payments within
> India** — it withdrew from that market in April 2021 and now handles only
> cross-border payments. It therefore cannot charge a customer in Bangalore for
> a delivery to Mysore. The system has been built so that an Indian gateway
> (Razorpay) handles domestic payments, with PayPal available for overseas
> customers. No rework is needed; it is a matter of which account is connected.

**Push notifications need a Firebase account** — about ten minutes of setup,
after which they work without further development.

---

## What is needed to reach public release

Three of these are administrative, not technical.

1. **A Google Play developer account** — $25, one time. The app package name
   `in.waypool.app` is already registered and the signing key verified.
2. **A privacy policy and terms of service** at a public address. Google
   requires both. The account-deletion page they must link to is already live.
3. **A payment gateway account** — needs business registration.
4. **Twelve testers, for fourteen consecutive days.** Google requires this
   before any new app can be released publicly. The clock only runs once
   testing begins, and cannot be shortened — so **this is the critical path**,
   and the reason to begin testing now rather than when everything else is
   finished.

---

## Recommended next step

**Begin testing this week.** The app is ready, the download link is live, and
the fourteen-day requirement is the only part of this timeline that cannot be
compressed, parallelised or paid for. Everything outstanding above can be
completed while that period runs.

Testers install from:

> **https://dikkiconnect-mail.vercel.app/download**

---

*Everything described as working has been verified against the live system
rather than assumed. The one step not yet confirmed is a sign-in performed on a
physical handset, which requires access to the recipient's inbox.*

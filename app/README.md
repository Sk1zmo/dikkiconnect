# DikkiConnect

Intercity parcel delivery using the empty **dikki** (boot) space of cars already
making the trip — plus cost-shared carpooling on the same driver network.
Built from `PRD_DikkiConnect.pdf`; MVP corridor is **Bangalore ↔ Mysore**.

This is a complete, working front end: 59 routes, five roles, real loading and
empty states, and a desktop ops console.

## Run it

```bash
cd app
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run typecheck    # tsc, no emit
npm run build        # typecheck + production bundle
npm run preview      # serve the production build
```

## Sending it to someone for a demo

```bash
npm run package
```

Writes `demo-out/`:

| File | What it's for |
| --- | --- |
| `DikkiConnect-demo.html` | One self-contained file, ~1.2 MB. Double-click, works offline, nothing to install. Email or WhatsApp it. Uses hash URLs (`#/sender`) since it runs off disk. |
| `DikkiConnect-demo-site.zip` | The hosted version. Unzip and drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop) for a public link — best for phones. Clean URLs, installable to a home screen. |
| `HOW-TO-VIEW.txt` | A short note for whoever receives it. |

Connecting a git repo to Netlify/Vercel also works — `netlify.toml` and
`vercel.json` are already configured with the SPA fallback.

Two things that will silently break a deploy if changed:

- The hosted build's `base` must stay absolute (`/`). With a relative base, a
  nested URL like `/sender/track/DKC-4821` resolves `./assets/…` against
  `/sender/track/` and receives the SPA fallback HTML instead of the JS bundle.
  Deploying under a subfolder? Build with `VITE_BASE=/subfolder/`.
- The manifest, touch-icon and service-worker paths in `index.html` are absolute
  for the same reason.

Not covered here: a real installable `.apk`. The zip build is already a PWA, so
"Add to home screen" gives an icon and a full-screen app on both Android and
iOS, which is enough for most demos. A true store-installable build would mean
wrapping this in Capacitor and needs a JDK plus the Android SDK.

## Where to start clicking

The app opens on the splash screen. `Get Started → Login → OTP → Role` drops you
into any of the four mobile apps. Any 6 digits pass OTP; `000000` shows the
incorrect-code state.

| Role | Route | The flow worth walking |
| --- | --- | --- |
| Sender | `/sender` | Book parcel → route → parcel → hubs → review → pay → QR → track |
| Traveler | `/traveler` | Declare trip → accept a job → scan at hub → OTP → navigate → drop |
| Passenger | `/passenger` | Search → results → ride → pay → boarding OTP → live trip → rate |
| Hub manager | `/hub` | Intake scan → weigh/photo/OTP → inventory → traveler handoff → receiver |
| Admin (desktop) | `/admin` | Dashboard, users, drivers & KYC, trips, parcels, payments, disputes, analytics |

The admin console renders full-width; the four mobile roles render inside a
phone shell so they look right on a desktop screen too.

## How the PRD maps into the UI

- **Custody chain (§6).** Four OTP checkpoints — sender→hub, hub→traveler,
  traveler→hub, hub→receiver. Every completed step in the tracking timeline
  shows its OTP badge and photo count. Passenger boarding is a single OTP.
- **KYC tiers (§7).** Aadhaar + selfie unlocks parcel-only work; licence + RC
  unlocks carrying passengers. The traveler dashboard gates passenger features
  behind that, and `/traveler/kyc` shows the ladder.
- **Trust & safety (§9).** Prohibited-items declaration is required before
  booking, declared value is capped at ₹5,000, and photo evidence is captured at
  each handoff.
- **Hub module (§8).** Intake, held inventory with >24h aging flags, traveler
  handoff, receiver pickup, and a flat per-parcel handling fee.
- **Pricing.** `quote()` in `src/lib/data.ts` computes the fare and the
  courier comparison that drives the "cheaper than courier" claim.

## Structure

```
src/
  index.css              design tokens, animations, base layer
  App.tsx                every route, lazy-loaded per screen
  lib/                   types, mock data, pricing, store, hooks, formatting
  components/
    ui/                  buttons, fields, OTP, sheets, toasts, skeletons…
    layout/              phone shell, top bars, per-role bottom nav
    viz/                 maps, custody timeline, QR, scanner, illustrations
    domain/              parcel / trip / job / hub cards
    brand/               logo
  pages/                 auth · sender · traveler · passenger · hub · common · admin
```

## Notes

- All data is mock and in-memory (`src/lib/data.ts`); there is no backend. State
  resets on reload apart from the chosen role and onboarding flag.
- Maps are hand-drawn SVG, so there is no tile provider or API key to configure.
- Skeletons are wired to real pending state via `useLoaded` / `useAsync`, not
  decorative delays.
- Payment has a deliberate ~1-in-6 simulated decline so the failure path is
  reachable.
- Scanners auto-detect after ~3s so the flow can be walked without a camera.

## Conventions worth knowing before you edit

Three rules that are easy to break silently, each learned the hard way here:

1. **Base CSS must stay inside `@layer base`.** Unlayered CSS outranks *every*
   layered rule, so an unlayered `button { color: inherit }` beats
   `text-brand-700` applied directly to that button. Anything added to
   `index.css` outside `@theme` belongs in a layer.

2. **Inside an SVG, a CSS transform replaces the element's `transform`
   attribute** and defaults its origin to the viewBox corner — so an animated
   `<g transform="translate(…)">` snaps to 0,0. Put position on a parent `<g>`
   and the animation class on a child. `svg .anim-*` also sets
   `transform-box: fill-box` so scale animations stay centred on their mark.

3. **Never nest a `<button>` inside a `<button>`.** Use `CheckMark` (visual only)
   when the whole row is already the control, and put secondary actions in a
   list row's `trailing` slot rather than inside its clickable body.

Map artwork is cropped with `preserveAspectRatio="…slice"`, so route lines and
pins are kept inside roughly `y 84–212` of the 300-unit viewBox — outside that
band they get clipped when a map renders short.

## Charts

Admin charts use a validated categorical palette (blue `#2a78d6`, orange
`#eb6834`) and a single-hue blue ramp for magnitude. Bars cap at ~22px with 4px
rounded data-ends, lines are 2px, gridlines are solid hairlines, and every chart
carries a **table view toggle** so nothing is gated behind colour perception.
Status colours are reserved and never reused as a data series.

## Why the SPA rewrite excludes /api

`vercel.json` rewrites `/((?!api/).*)` rather than `/(.*)`. The negative
lookahead is load-bearing. Without it the SPA fallback also matches `/api/*`,
and every serverless call quietly receives `index.html` with status 200 instead
of JSON. The client then fails to parse it and reports a network error — which
sends you off to debug a connection that was never the problem.

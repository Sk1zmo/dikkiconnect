import { Camera, Check, Images, MapPin, Smartphone } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'

/* ═══════════════════════════════════════════════════════════════════════════
   Download page.

   Read on a laptop or a phone browser by somebody who does not have the app
   yet, so it sits outside the device shell and outside the auth gate — same
   as /ops, for the same reason.

   Two things it has to do honestly:

     · Say what the two platforms actually are today. Android is a direct APK
       and always will be during a pilot; iOS is TestFlight and cannot be
       anything else, because Apple does not permit sideloading. Pretending
       there is parity here would only produce a support ticket.
     · Explain the four permissions in the same words the app itself uses when
       it asks. A permission explained once, before install, is a permission
       granted; one that arrives cold at the moment of use is a permission
       denied and a feature that then looks broken.
   ═══════════════════════════════════════════════════════════════════════════ */

const APK = '/DikkiConnect.apk'

const PERMISSIONS = [
  {
    icon: MapPin,
    title: 'Location',
    body: 'To find the hub nearest you and to show a traveler where a door pickup is. Asked the first time you book, never in the background.',
  },
  {
    icon: Camera,
    title: 'Camera',
    body: 'To scan the QR on a parcel at handoff. Asked at the scanner, and only there.',
  },
  {
    icon: Images,
    title: 'Photos',
    body: 'To save a proof-of-condition photo at intake. Nothing is read from your library.',
  },
  {
    icon: Smartphone,
    title: 'Network',
    body: 'To reach the API for sign-in and tracking. Granted at install on both platforms.',
  },
]

const ANDROID_STEPS = [
  'Download the APK using the button above.',
  'Open it. Android will warn that it is from an unknown source — that is expected for a pilot build, and is the same prompt every pre-release app produces.',
  'Tap Settings, allow installs from your browser, then go back and tap Install.',
  'Open DikkiConnect and sign in with your email.',
]

export default function Download() {
  return (
    <div className="min-h-dvh bg-white text-ink-900">
      <div className="mx-auto w-full max-w-[820px] px-6 py-16 sm:py-24">
        {/* ── Masthead ──────────────────────────────────────────────────── */}
        <header className="flex items-center gap-3">
          <LogoMark size={34} tone="brand" />
          <span className="text-display text-[22px] font-extrabold tracking-[-0.035em]">
            DikkiConnect
          </span>
        </header>

        <h1 className="text-display mt-12 max-w-[13ch] text-[44px] leading-[1.04] font-extrabold tracking-[-0.045em] sm:text-[60px]">
          Get the pilot build.
        </h1>
        <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.6] text-ink-600">
          Intercity parcels in the boot space of a car that was already making the trip.
          Bangalore to Mysore, with hub-to-hub custody and an OTP at every handoff.
        </p>

        {/* ── The two platforms ─────────────────────────────────────────── */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <section className="rounded-(--radius-lg) border border-ink-200 p-6">
            <h2 className="text-[15px] font-bold">Android</h2>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-500">
              Direct install. Android 8.0 or newer.
            </p>
            <a
              href={APK}
              download
              className="springy focus-ring mt-5 flex h-[52px] w-full items-center justify-center rounded-(--radius-md) bg-action px-5 text-[15px] font-semibold text-white hover:bg-action-hover"
            >
              Download APK
            </a>
          </section>

          <section className="rounded-(--radius-lg) border border-ink-200 p-6">
            <h2 className="text-[15px] font-bold">iPhone</h2>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-500">
              TestFlight only. Apple does not allow sideloading, so there is no
              equivalent of the APK — send us the email on your Apple ID and we
              will add you to the build.
            </p>
            <a
              href="mailto:info.quantumbay@gmail.com?subject=DikkiConnect%20TestFlight"
              className="springy focus-ring mt-5 flex h-[52px] w-full items-center justify-center rounded-(--radius-md) border border-ink-300 px-5 text-[15px] font-semibold text-ink-900 hover:bg-ink-50"
            >
              Request a TestFlight invite
            </a>
          </section>
        </div>

        {/* ── Installing ────────────────────────────────────────────────── */}
        <h2 className="text-display mt-16 text-[13px] font-bold tracking-[0.14em] text-ink-400 uppercase">
          Installing on Android
        </h2>
        <ol className="mt-5 space-y-3.5">
          {ANDROID_STEPS.map((step, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="tabular mt-px grid size-6 shrink-0 place-items-center rounded-full bg-ink-100 text-[12px] font-bold text-ink-700">
                {i + 1}
              </span>
              <p className="text-[14.5px] leading-[1.6] text-ink-700">{step}</p>
            </li>
          ))}
        </ol>

        {/* ── Permissions ───────────────────────────────────────────────── */}
        <h2 className="text-display mt-16 text-[13px] font-bold tracking-[0.14em] text-ink-400 uppercase">
          What it asks for
        </h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded-(--radius-lg) border border-ink-200 bg-ink-200 sm:grid-cols-2">
          {PERMISSIONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white p-5">
              <div className="flex items-center gap-2.5">
                <Icon size={17} strokeWidth={1.9} className="text-ink-500" />
                <h3 className="text-[14px] font-bold">{title}</h3>
              </div>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-500">{body}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-start gap-2.5 text-[13px] leading-[1.55] text-ink-500">
          <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-ink-400" />
          Each one is requested at the moment it is first needed, not in a wall at launch.
          Declining any of them leaves the rest of the app working.
        </p>

        <footer className="mt-20 border-t border-ink-200 pt-6 text-[12.5px] text-ink-400">
          DikkiConnect 1.0.0 · pilot build · Bangalore to Mysore
        </footer>
      </div>
    </div>
  )
}

import { BRAND } from '@/lib/brand'

/* ═══════════════════════════════════════════════════════════════════════════
   The public account-deletion page.

   Google Play requires two routes to deletion for any app with accounts: one
   inside the app, and one at a URL anyone can open without installing it. The
   second exists for people who have already uninstalled, or who never want to
   install again — which is exactly the population most likely to want their
   data gone.

   So this page is deliberately plain and deliberately outside the app shell:
   no bottom nav, no portal switcher, no sign-in wall. It renders for anyone
   with the link, on a laptop, with the app nowhere on the device.

   It does not delete anything by itself. Deleting needs proof it is your
   account, and the only proof this product has is the sign-in code — so the
   page explains the two ways through and sends you to the one that fits.
   ═══════════════════════════════════════════════════════════════════════════ */

const SUPPORT = 'waypool1@gmail.com'

export default function DeleteAccount() {
  return (
    <main className="mx-auto min-h-dvh max-w-[680px] bg-white px-6 py-14 text-ink-800">
      <p className="text-[12px] font-bold tracking-[0.28em] text-brand-600 uppercase">
        {BRAND.name}
      </p>
      <h1 className="text-display mt-3 text-[34px] leading-[1.1] font-extrabold text-ink-900">
        Deleting your {BRAND.name} account
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-ink-600">
        You can delete your account at any time. Here is exactly what goes, what
        stays, and why.
      </p>

      <section className="mt-10">
        <h2 className="text-[19px] font-extrabold text-ink-900">From inside the app</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-600">
          <li>Open {BRAND.name} and sign in.</li>
          <li>Go to <strong className="text-ink-900">Profile → Settings</strong>.</li>
          <li>
            Scroll to <strong className="text-ink-900">Delete my account</strong> and confirm.
          </li>
        </ol>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          It happens immediately. There is no waiting period and nothing to cancel.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[19px] font-extrabold text-ink-900">
          If you have already uninstalled
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Email{' '}
          <a href={`mailto:${SUPPORT}?subject=Delete my WayPool account`} className="font-bold text-brand-700 underline">
            {SUPPORT}
          </a>{' '}
          from the address on the account, or tell us the mobile number you signed
          up with. We will delete it and write back to confirm. Allow up to 30 days,
          though in practice it is far quicker.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[19px] font-extrabold text-ink-900">What is deleted</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-600">
          <li>Your name, email address and mobile number.</li>
          <li>Every way of looking you up by any of them.</li>
          <li>All your sign-in sessions, on every device.</li>
          <li>Your saved addresses and your notification history.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[19px] font-extrabold text-ink-900">What is kept, and why</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Records of parcels that were <strong className="text-ink-900">already delivered</strong>{' '}
          stay, with your name and contact details stripped out of them. {BRAND.name}{' '}
          is a chain of custody: each delivered parcel is the record of who handed
          what to whom, and the traveller who carried it and the hub that held it
          both rely on that record existing. Removing it would erase their evidence
          along with your details, so your details go and the chain remains.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Hand-over photographs attached to those deliveries are kept for two years
          and then removed.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[19px] font-extrabold text-ink-900">
          If a parcel is still on its way
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Deletion is blocked until it arrives or is cancelled. Someone is carrying
          a physical box to an address on your behalf, and removing the person who
          sent it halfway through helps nobody — least of all whoever is waiting
          for it. Once it is delivered, delete away.
        </p>
      </section>

      <footer className="mt-14 border-t border-ink-100 pt-6 text-[13.5px] text-ink-500">
        Questions:{' '}
        <a href={`mailto:${SUPPORT}`} className="font-semibold text-brand-700 underline">
          {SUPPORT}
        </a>
      </footer>
    </main>
  )
}

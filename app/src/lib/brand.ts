/* ═══════════════════════════════════════════════════════════════════════════
   The brand, in one place.

   The product was DikkiConnect until September 2026 and is Stowza now. The
   wordmark, the launch screen, the page title, the manifest and the native
   app labels read the name from here; the prose that mentions it in passing
   ("Stowza is built for intercity moves") was swept by search and should be
   again on the next rename. Storage keys, the API hosts and the demo
   account's address still carry the old name on purpose: they are identifiers,
   not copy, and changing them would sign every user out and break every link.
   ═══════════════════════════════════════════════════════════════════════════ */

export const BRAND = {
  name: 'Stowza',
  tagline: 'Move more. Together.',
  /** Under the wordmark on the landing screen. */
  promise: 'Store. Travel. Freely.',
  /** What the app is, in one line — meta descriptions, the download page. */
  description:
    'Intercity parcel delivery in the empty boot space of cars already making your route, plus cost-shared carpooling.',
  /** The deep-link scheme the QR codes use. Mirrored in strings.xml on Android. */
  scheme: 'stowza',
  /** A hub's display name is "<name> Hub · <area>". */
  hubPrefix: 'Stowza Hub',
} as const

/** Marketing version, shown on the download page and in Settings. */
export const APP_VERSION = '1.2.0'

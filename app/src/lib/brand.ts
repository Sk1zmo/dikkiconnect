/* ═══════════════════════════════════════════════════════════════════════════
   The brand, in one place.

   The product was DikkiConnect, then Stowza, and is WayPool from October 2026.
   The wordmark, the launch screen, the page title, the manifest and the native
   app labels all read the name from here.

   This rename went further than the last one. The previous note said storage
   keys and identifiers were deliberately left on the old name because changing
   them would sign every user out and break every link — true while people were
   using it. Nothing is published yet, so this was the last moment the package
   id, the deep-link scheme and the storage keys could be changed for free.
   They were. There is no cheaper time to do it than before the first install.
   ═══════════════════════════════════════════════════════════════════════════ */

export const BRAND = {
  name: 'WayPool',
  tagline: 'Move more. Together.',
  /** Under the wordmark on the landing screen. */
  promise: 'Store. Travel. Freely.',
  /** What the app is, in one line — meta descriptions, the download page. */
  description:
    'Intercity parcel delivery in the empty boot space of cars already making your route, plus cost-shared carpooling.',
  /** The deep-link scheme the QR codes use. Mirrored in strings.xml on Android. */
  scheme: 'waypool',
  /** A hub's display name is "<name> Hub · <area>". */
  hubPrefix: 'WayPool Hub',
} as const

/**
 * The field the app opens on.
 *
 * Three things have to agree on this exact value or the first moment of the
 * app is a flash of the wrong colour: the Android splash theme
 * (`android/app/src/main/res/values/styles.xml`), the Capacitor splash config
 * (`capacitor.config.ts`), and the in-app opening that takes over from them.
 * The hand-over is only invisible when all three are the same navy.
 */
export const LAUNCH_BG = '#071231'

/** Marketing version, shown on the download page and in Settings. */
export const APP_VERSION = '2.6.0'

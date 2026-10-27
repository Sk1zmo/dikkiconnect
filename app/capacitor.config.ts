import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Android wrapper for the WayPool PWA.
 *
 * The web build in `dist/` is bundled into the APK, so the app runs offline and
 * does not point at a server. Build order is always:
 *   npm run build   →  npx cap sync android  →  gradlew assembleDebug
 * (`npm run android:apk` does all three.)
 *
 * `androidScheme: 'https'` is required: on the default `http` scheme Android
 * treats the WebView origin as insecure and silently disables localStorage,
 * geolocation and the camera — all of which this app uses.
 */
const config: CapacitorConfig = {
  appId: 'in.waypool.app',
  appName: 'WayPool',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    // The app is light-surfaced; keep the WebView background matching so there
    // is no white flash on rotate or resume.
    backgroundColor: '#F7F8FC',
  },
  ios: {
    backgroundColor: '#F7F8FC',
    // Stops the whole WebView bouncing past the content on an overscroll —
    // the app has its own scroll containers and the rubber-band underneath
    // them reads as a bug.
    scrollEnabled: false,
    contentInset: 'never',
  },
  plugins: {
    /* The native plate is a solid dusk field (the splash.png in each Android
       drawable folder, and the iOS Splash imageset) — no mark, no artwork.
       The branded opening is drawn by the app itself
       (components/brand/LaunchScreen), which starts from that same colour and
       hides the plate the moment it has painted, so the hand-over is
       invisible. `launchShowDuration` is only a ceiling for the case where the
       web layer never gets that far. */
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      launchFadeOutDuration: 180,
      backgroundColor: '#071231',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#091A4A',
    },
  },
}

export default config

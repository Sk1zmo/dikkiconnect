import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Android wrapper for the DikkiConnect PWA.
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
  appId: 'in.dikkiconnect.app',
  appName: 'DikkiConnect',
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
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: '#091A4A',
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

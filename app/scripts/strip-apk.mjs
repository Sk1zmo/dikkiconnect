import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

/* ═══════════════════════════════════════════════════════════════════════════
   Remove the downloadable APK from dist/ before Capacitor syncs it.

   The download page serves the APK from public/, which Vite copies into dist/.
   Capacitor then copies the whole of dist/ into the Android project's assets —
   so without this step the APK is built with the previous APK inside it, and
   every build is 5 MB bigger than the last. Nothing warns you; the app just
   quietly doubles.

   Web deploys still get the file: Vercel and Netlify build dist/ and never run
   this. It is wired into `android:sync` and `ios:sync` only.
   ═══════════════════════════════════════════════════════════════════════════ */

const dist = 'dist'
if (!existsSync(dist)) process.exit(0)

let removed = 0
for (const name of readdirSync(dist)) {
  if (!name.endsWith('.apk')) continue
  rmSync(join(dist, name), { force: true })
  console.log(`strip-apk: removed dist/${name} before native sync`)
  removed++
}
if (!removed) console.log('strip-apk: nothing to remove')

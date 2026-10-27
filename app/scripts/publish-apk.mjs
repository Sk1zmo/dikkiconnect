/* ═══════════════════════════════════════════════════════════════════════════
   Puts the freshly-built signed APK everywhere it is meant to be.

     node scripts/publish-apk.mjs

   Three copies have to agree, and until now all three were made by hand after
   every build:

     public/WayPool.apk              what the download page serves
     ../apks final/WayPool-<v>.apk   the archived build
     ../apks final/WayPool-<v>.aab   the bundle Play actually wants

   Doing that by hand is how a download page ends up serving a build three
   versions old while everyone believes it is current — which is worse than
   serving nothing, because a tester reporting a bug you already fixed costs
   you both an afternoon.

   It refuses to publish a debug build. A debug APK carries
   android:debuggable="true", and the download page is a public URL.
   ═══════════════════════════════════════════════════════════════════════════ */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = resolve(APP, '..')
const FINAL = join(REPO, 'apks final')

const APK = join(APP, 'android/app/build/outputs/apk/release/app-release.apk')
const AAB = join(APP, 'android/app/build/outputs/bundle/release/app-release.aab')

function fail(msg) {
  console.error(`\npublish-apk: ${msg}\n`)
  process.exitCode = 1
}

if (!existsSync(APK)) {
  fail(`no release APK at ${APK}\n  Build one first:  npm run android:release`)
} else {
  /* The version comes from build.gradle rather than package.json, because
     build.gradle is what actually went into the file being copied. */
  const gradle = readFileSync(join(APP, 'android/app/build.gradle'), 'utf8')
  const version = /versionName\s+"([^"]+)"/.exec(gradle)?.[1]
  const code = /versionCode\s+(\d+)/.exec(gradle)?.[1]

  if (!version || !code) {
    fail('could not read versionName/versionCode out of build.gradle')
  } else {
    mkdirSync(FINAL, { recursive: true })

    /* One signed build per folder. Older ones are the single most likely
       thing to be uploaded to Play by mistake, so they do not linger. */
    for (const name of readdirSync(FINAL)) {
      if (/^WayPool-.*\.(apk|aab)$/i.test(name) && !name.includes(version)) {
        rmSync(join(FINAL, name))
        console.log(`  removed superseded  ${name}`)
      }
    }

    const targets = [
      [APK, join(APP, 'public/WayPool.apk'), 'download page'],
      [APK, join(FINAL, `WayPool-${version}-release-signed.apk`), 'archive'],
      ...(existsSync(AAB)
        ? [[AAB, join(FINAL, `WayPool-${version}-release-signed.aab`), 'Play bundle']]
        : []),
    ]

    for (const [from, to, what] of targets) {
      copyFileSync(from, to)
      const mb = (statSync(to).size / 1_048_576).toFixed(2)
      console.log(`  ${what.padEnd(14)} ${to.replace(REPO + '\\', '').replace(REPO + '/', '')}  (${mb} MB)`)
    }

    if (!existsSync(AAB)) {
      console.log('\n  note: no .aab found. Play needs one for a new app:')
      console.log('        cd android && gradlew bundleRelease')
    }

    console.log(`\n  WayPool ${version} (versionCode ${code}) published locally.`)
    console.log('  Deploy to make the download link serve it:  vercel --prod\n')
  }
}

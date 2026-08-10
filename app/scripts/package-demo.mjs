/**
 * Bundles the two demo artifacts into ./demo-out:
 *   DikkiConnect-demo-site.zip  → drag onto a static host (Netlify drop etc.)
 *   DikkiConnect-demo.html      → one file, opens offline by double-clicking
 *
 * Uses the zip support built into Windows/PowerShell or `zip` on unix, so there
 * is no extra dependency to install.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'demo-out')
const DIST = path.join(ROOT, 'dist')
const SINGLE = path.join(ROOT, 'dist-single', 'index.html')

function must(p, what) {
  if (!fs.existsSync(p)) {
    console.error(`Missing ${what} at ${p}\nRun: npm run build && npm run build:single`)
    process.exit(1)
  }
}

must(DIST, 'static build')
must(SINGLE, 'single-file build')

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

// 1. Single self-contained page
const singleDest = path.join(OUT, 'DikkiConnect-demo.html')
fs.copyFileSync(SINGLE, singleDest)

// 2. Zip of the static site
const zipDest = path.join(OUT, 'DikkiConnect-demo-site.zip')
if (process.platform === 'win32') {
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${DIST}\\*' -DestinationPath '${zipDest}' -Force`,
    ],
    { stdio: 'inherit' },
  )
} else {
  execFileSync('zip', ['-r', '-q', zipDest, '.'], { cwd: DIST, stdio: 'inherit' })
}

// 3. A short note for whoever receives it
fs.writeFileSync(
  path.join(OUT, 'HOW-TO-VIEW.txt'),
  `DikkiConnect — demo build
=========================

Two ways to view it. Both are the same app.

1) DikkiConnect-demo.html
   Double-click it. Opens in any browser, works offline, nothing to install.
   Best for emailing or WhatsApp-ing to one person.

2) DikkiConnect-demo-site.zip
   The hosted version. Unzip and drop the folder on https://app.netlify.com/drop
   to get a public link that works on phones. (Do not open index.html from the
   unzipped folder directly — use file 1 for that.)

Walking the demo
----------------
Get Started -> Login -> enter any 10 digits -> any 6-digit OTP -> pick a role.
Type 000000 at the OTP step to see the error state.

  Sender      book a parcel end to end, then track it
  Traveler    accept a job, scan at the hub, confirm with OTP
  Passenger   search a ride, pay, boarding OTP, live trip
  Hub manager parcel intake, inventory, handoffs
  Admin       add /admin to the URL for the desktop ops console

All data is sample data. Nothing is sent anywhere and there is no backend.
`,
  'utf8',
)

const kb = (p) => `${(fs.statSync(p).size / 1024).toFixed(0)} KB`
console.log(`\nWrote ${path.relative(ROOT, OUT)}/`)
console.log(`  DikkiConnect-demo.html       ${kb(singleDest)}`)
console.log(`  DikkiConnect-demo-site.zip   ${kb(zipDest)}`)
console.log(`  HOW-TO-VIEW.txt`)

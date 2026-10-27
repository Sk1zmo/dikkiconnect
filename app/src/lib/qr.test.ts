/* ═══════════════════════════════════════════════════════════════════════════
   Tests for reading a scan.

   Run:  npm run test:qr

   This is a short file for a short function, and it is here because of what
   the function decides: whether a code pointed at by a camera in a hub
   doorway is treated as a WayPool pass. Getting that wrong in either
   direction is expensive — a stranger's QR accepted as a parcel, or a real
   pass rejected while a traveller waits.

   Same shape as api/_lib/domain.test.ts: no framework, exits non-zero on a
   failure. Adding a runner is a decision for the repository, not for this
   file.
   ═══════════════════════════════════════════════════════════════════════════ */

import { parcelIdFromScan, scanIntent } from './qr.js'

let failures = 0
let checks = 0

function check(label: string, pass: boolean, detail = '') {
  checks++
  if (pass) console.log(`  ok    ${label}`)
  else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`)
  }
}

const eq = (label: string, actual: unknown, expected: unknown) =>
  check(label, Object.is(actual, expected), `got ${String(actual)}, expected ${String(expected)}`)

console.log('\naccepted')
eq('a drop-off pass', parcelIdFromScan('waypool://parcel/WYP-4861/dropoff'), 'WYP-4861')
eq('a pickup pass', parcelIdFromScan('waypool://parcel/WYP-4861/pickup'), 'WYP-4861')
eq('a bare id, as typed by hand', parcelIdFromScan('WYP-4861'), 'WYP-4861')
eq('a bare id with stray spaces', parcelIdFromScan('  WYP-4861 '), 'WYP-4861')
eq('lower case, as a keyboard produces it', parcelIdFromScan('wyp-4861'), 'WYP-4861')

console.log('\nrejected')
const rejected: Array<[string, string]> = [
  ['', 'nothing at all'],
  ['Parcel WYP-4861 to Mysore', 'an id inside a sentence — no scanner produces this'],
  ['   ', 'whitespace'],
  ['https://example.com/parcel/WYP-4861', "somebody else's URL that happens to contain an id"],
  ['waypool://parcel/NOPE-1/dropoff', 'our scheme with an id we never mint'],
  ['waypool://parcel//dropoff', 'our scheme with no id'],
  ['WYP-12', 'too few digits to be a real parcel'],
  ['4861', 'digits with no prefix'],
  ['https://pay.example.com/qr?amt=500', 'a payment QR, which is what is actually on parcels'],
]
for (const [input, why] of rejected) {
  eq(`${JSON.stringify(input)} — ${why}`, parcelIdFromScan(input), null)
}

/* The one that matters most: our own scheme must be checked as a whole, not
   scanned for anything id-shaped. A link that merely contains a valid id is
   not a pass issued for that parcel. */
console.log('\nthe prefix is checked as a whole')
eq(
  'a foreign scheme carrying one of our ids',
  parcelIdFromScan('otherapp://parcel/WYP-4861/dropoff'),
  null,
)

console.log('\nintent')
eq('dropoff', scanIntent('waypool://parcel/WYP-4861/dropoff'), 'dropoff')
eq('pickup', scanIntent('waypool://parcel/WYP-4861/pickup'), 'pickup')
eq('a bare id carries no intent', scanIntent('WYP-4861'), null)
eq('an unknown tail carries no intent', scanIntent('waypool://parcel/WYP-4861/sideways'), null)

console.log(
  `\n${checks - failures}/${checks} passed` + (failures ? ` — ${failures} FAILED` : ''),
)
process.exit(failures ? 1 : 0)

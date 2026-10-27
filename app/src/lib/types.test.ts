/* ═══════════════════════════════════════════════════════════════════════════
   Tests for roleHome.

   Run:  npm run test:types

   The bug this guards against: a returning sign-in routed to the wrong
   portal, or to no portal at all, because the mapping it reads drifted from
   the one the role picker uses. Same shape as qr.test.ts — no framework,
   exits non-zero on a failure.
   ═══════════════════════════════════════════════════════════════════════════ */

import { roleHome, type Role } from './types.js'

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

const roles: Role[] = ['sender', 'traveler', 'passenger', 'hub']

for (const role of roles) {
  const home = roleHome(role)
  check(`${role} → ${home}`, home === `/${role}`)
}

console.log(`\n${checks - failures}/${checks} passed`)
if (failures > 0) process.exit(1)

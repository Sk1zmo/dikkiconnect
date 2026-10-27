/* ═══════════════════════════════════════════════════════════════════════════
   Tests for the three paths where being wrong costs money or trust:
   the fare, the hand-off OTP, and the custody state machine.

   Run:  npx tsx api/_lib/domain.test.ts

   No framework. The API has no test runner and adding one is a decision for
   the repository, not for this file; a script that exits non-zero is enough
   to put these three behaviours under a net today. It runs against the
   in-memory store fallback, so it needs no credentials and touches nothing
   real.
   ═══════════════════════════════════════════════════════════════════════════ */

import { kvGet, kvList, kvPush, kvSetIfAbsent } from './store.js'
import {
  CANCELLABLE,
  HANDOFF_MAX_ATTEMPTS,
  canTransition,
  checkHandoffOtp,
  issueHandoffOtp,
  quote,
  statusAfter,
  type Checkpoint,
  type ParcelStatus,
} from './domain.js'

let failures = 0
let checks = 0

function check(label: string, pass: boolean, detail = '') {
  checks++
  if (pass) {
    console.log(`  ok    ${label}`)
  } else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`)
  }
}

const eq = (label: string, actual: unknown, expected: unknown) =>
  check(label, Object.is(actual, expected), `got ${String(actual)}, expected ${String(expected)}`)

/* ── 1. The fare ─────────────────────────────────────────────────────────
   Worked by hand from the published rules so the test is independent of the
   implementation: a Small on Bangalore→Mysore, 1 kg, nothing added.
     base 79 · distance round(145 × 0.34) = 49 · overweight max(0, 1 − 1.5) = 0
     subtotal 128 · gst round(128 × 0.18) = 23 · total 151
   ───────────────────────────────────────────────────────────────────────── */
console.log('\nfare')
{
  const q = quote({
    fromCityId: 'blr', toCityId: 'mys', size: 'S',
    weightKg: 1, fragile: false, insured: false,
  })
  eq('base is the size base', q.base, 79)
  eq('distance is km × 0.34, rounded', q.distance, 49)
  eq('half the size ceiling is free', q.weight, 0)
  eq('gst is 18% of subtotal', q.gst, 23)
  eq('total', q.total, 151)

  /* 4 kg in a Small: 4 − (3 × 0.5) = 2.5 over, × 11 = 27.5 → 28 */
  const heavy = quote({
    fromCityId: 'blr', toCityId: 'mys', size: 'S',
    weightKg: 4, fragile: false, insured: false,
  })
  eq('overweight is charged on the excess only', heavy.weight, 28)

  const extras = quote({
    fromCityId: 'blr', toCityId: 'mys', size: 'S',
    weightKg: 1, fragile: true, insured: true,
  })
  eq('fragile', extras.fragile, 29)
  eq('insurance', extras.insurance, 25)

  const promo = quote({
    fromCityId: 'blr', toCityId: 'mys', size: 'S',
    weightKg: 1, fragile: false, insured: false, promo: 'FIRSTDROP',
  })
  eq('a known promo takes its rate off the subtotal', promo.discount, Math.round(128 * 0.2))
  check('a promo lowers the total', promo.total < q.total)

  /* The one that matters: the code is typed by the customer, so anything the
     server does not know must be worth nothing. */
  const madeUp = quote({
    fromCityId: 'blr', toCityId: 'mys', size: 'S',
    weightKg: 1, fragile: false, insured: false, promo: 'GIVEMEMONEY',
  })
  eq('an unknown code is worth nothing', madeUp.discount, 0)
  eq('and changes no total', madeUp.total, q.total)

  const lower = quote({
    fromCityId: 'blr', toCityId: 'mys', size: 'S',
    weightKg: 1, fragile: false, insured: false, promo: '  firstdrop ',
  })
  eq('codes are matched case- and space-insensitively', lower.discount, promo.discount)

  const unknown = quote({
    fromCityId: 'xxx', toCityId: 'yyy', size: 'M',
    weightKg: 1, fragile: false, insured: false,
  })
  eq('an unknown corridor falls back to 200 km', unknown.km, 200)
}

/* ── 2. The custody state machine ───────────────────────────────────────── */
console.log('\ncustody order')
{
  const legal: Array<[ParcelStatus, Checkpoint]> = [
    ['booked', 'intake'],
    ['at_origin_hub', 'handoff'],
    ['in_transit', 'arrive'],
    ['at_destination_hub', 'deliver'],
  ]
  for (const [from, cp] of legal) {
    check(`${from} → ${cp} is allowed`, canTransition(from, cp))
  }

  /* The forgeries worth naming: each of these is someone claiming a parcel
     reached a place it never did. */
  const illegal: Array<[ParcelStatus, Checkpoint, string]> = [
    ['booked', 'deliver', 'delivered without ever being collected'],
    ['booked', 'arrive', 'arrived at the destination from the sender'],
    ['at_origin_hub', 'deliver', 'delivered straight off the origin shelf'],
    ['in_transit', 'intake', 'taken in again while already moving'],
    ['delivered', 'deliver', 'delivered twice'],
    ['cancelled', 'intake', 'a cancelled parcel re-entering the chain'],
  ]
  for (const [from, cp, why] of illegal) {
    check(`${from} → ${cp} is rejected (${why})`, !canTransition(from, cp))
  }

  eq('intake lands at_origin_hub', statusAfter('intake'), 'at_origin_hub')
  eq('deliver lands delivered', statusAfter('deliver'), 'delivered')
  check('only a booked parcel may be cancelled',
    CANCELLABLE.length === 1 && CANCELLABLE[0] === 'booked')
}

/* ── 3. The hand-off OTP ─────────────────────────────────────────────────── */
console.log('\nhand-off otp')
{
  const parcel = 'WYP-TEST-1'

  const code = await issueHandoffOtp(parcel, 'intake')
  check('a code is six digits', /^\d{6}$/.test(code), code)

  const again = await issueHandoffOtp(parcel, 'intake')
  eq('asking twice returns the live code, not a new one', again, code)

  const other = await issueHandoffOtp(parcel, 'deliver')
  check('a different checkpoint gets its own code', other !== code)

  const wrong = await checkHandoffOtp(parcel, 'intake', '000000')
  check('a wrong code fails', !wrong.ok)
  if (!wrong.ok) eq('and costs an attempt', wrong.attemptsLeft, HANDOFF_MAX_ATTEMPTS - 1)

  const right = await checkHandoffOtp(parcel, 'intake', code)
  check('the real code passes', right.ok)

  const replay = await checkHandoffOtp(parcel, 'intake', code)
  check('the same code cannot be used twice', !replay.ok)
  if (!replay.ok) eq('and reports as locked', replay.reason, 'locked')

  /* Grind a fresh checkpoint down to the lock. */
  const p2 = 'WYP-TEST-2'
  await issueHandoffOtp(p2, 'handoff')
  let last = await checkHandoffOtp(p2, 'handoff', '111111')
  for (let i = 1; i < HANDOFF_MAX_ATTEMPTS; i++) {
    last = await checkHandoffOtp(p2, 'handoff', '111111')
  }
  check('five wrong entries lock the checkpoint', !last.ok && last.reason === 'locked')

  const missing = await checkHandoffOtp('WYP-NOPE', 'intake', '123456')
  check('a checkpoint with no issued code cannot be passed',
    !missing.ok && missing.reason === 'no-code')
}

/* -- 4. The storage primitives two features now depend on ----------------
   Both have already been got wrong once. The claim race needs set-if-absent
   to be genuinely exclusive; account deletion read a pushed list with a plain
   GET, got null, and cheerfully deleted an account with a parcel in flight.
   ----------------------------------------------------------------------- */
console.log('\nstorage')
{
  const key = 'test:claim:1'
  const first = await kvSetIfAbsent(key, { who: 'a' })
  const second = await kvSetIfAbsent(key, { who: 'b' })
  check('the first caller to claim a key wins', first)
  check('the second is refused', !second)
  const held = await kvGet<{ who: string }>(key)
  eq('and the first writer value is the one that stuck', held?.who, 'a')

  const listKey = 'test:list:1'
  await kvPush(listKey, 'WYP-1')
  await kvPush(listKey, 'WYP-2')
  eq('kvList reads a pushed list', (await kvList<string>(listKey)).length, 2)
  /* Newest first - kvPush prepends. Every "my parcels" list in the product
     relies on that order, so it is worth pinning down. */
  eq('newest first', (await kvList<string>(listKey))[0], 'WYP-2')

  /* The matching negative - that kvGet returns null for a pushed list - is
     true on Upstash, where the key is a real Redis LIST and GET refuses it,
     and false on the in-memory fallback, where everything is a JSON string.
     Asserting it here would be asserting the fallback's behaviour and would
     pass whether or not production worked. The rule is in the comment on
     kvSetIfAbsent and in the one on the account-deletion route, which is
     where someone reaching for the wrong primitive will actually be. */
}

console.log(
  `\n${checks - failures}/${checks} passed` + (failures ? ` — ${failures} FAILED` : ''),
)
process.exit(failures ? 1 : 0)

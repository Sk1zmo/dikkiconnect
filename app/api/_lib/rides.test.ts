/* ═══════════════════════════════════════════════════════════════════════════
   Tests for the ride domain: the seat counter, the boarding OTP, and the
   wallet ledger — the three places a race or a silent assumption costs a
   seat, lets an unverified passenger board, or moves money that was never
   there.

   Run:  npx tsx api/_lib/rides.test.ts

   No framework, same shape as domain.test.ts. Runs against the in-memory
   store fallback — no credentials, touches nothing real.
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  BOARDING_MAX_ATTEMPTS,
  applyWalletTxn,
  checkBoardingOtp,
  getBalance,
  issueBoardingOtp,
  listChat,
  releaseSeats,
  sendChat,
  tryBookSeats,
} from './rides.js'

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

/* ── 1. Seats ────────────────────────────────────────────────────────────── */
console.log('\nseats')
{
  const trip = `test-trip-${Date.now()}-a`
  // tryBookSeats decrements a counter that starts undefined/0 in the
  // in-memory store; seed it the way the route does on publish.
  await releaseSeats(trip, 3) // 0 + 3 = 3 seats published

  const first = await tryBookSeats(trip, 2)
  check('first booking of 2 succeeds', first.ok)
  if (first.ok) eq('one seat left after booking 2 of 3', first.seatsLeft, 1)

  const second = await tryBookSeats(trip, 2)
  check('a second booking of 2 is refused — only one seat left', !second.ok)

  const third = await tryBookSeats(trip, 1)
  check('the last seat can still be booked', third.ok)
  if (third.ok) eq('zero seats left', third.seatsLeft, 0)

  const fourth = await tryBookSeats(trip, 1)
  check('sold out — the counter never goes negative', !fourth.ok)

  await releaseSeats(trip, 2)
  const afterCancel = await tryBookSeats(trip, 2)
  check('a cancellation gives the seats back', afterCancel.ok)
}

{
  // Concurrency: two bookings racing for the same two seats. INCRBY being a
  // single atomic command is the entire claim this test is checking — if it
  // were read-then-write in application code, both could read "2 left" and
  // both would think they won.
  const trip = `test-trip-${Date.now()}-race`
  await releaseSeats(trip, 2)
  const [a, b] = await Promise.all([tryBookSeats(trip, 2), tryBookSeats(trip, 2)])
  const winners = [a, b].filter((r) => r.ok).length
  eq('exactly one of two simultaneous claims for the same 2 seats wins', winners, 1)
}

/* ── 2. Boarding OTP ─────────────────────────────────────────────────────── */
console.log('\nboarding otp')
{
  const booking = `test-booking-${Date.now()}`
  const code = await issueBoardingOtp(booking)
  eq('a six-digit code is issued', code.length, 6)

  const wrong = await checkBoardingOtp(booking, '000000')
  check('a wrong code fails', !wrong.ok)
  if (!wrong.ok) eq('and costs an attempt', wrong.attemptsLeft, BOARDING_MAX_ATTEMPTS - 1)

  const right = await checkBoardingOtp(booking, code)
  check('the real code passes', right.ok)

  const replay = await checkBoardingOtp(booking, code)
  check('the same code cannot be used twice', !replay.ok)
}

{
  const booking = `test-booking-lock-${Date.now()}`
  await issueBoardingOtp(booking)
  let last: Awaited<ReturnType<typeof checkBoardingOtp>> | null = null
  for (let i = 0; i < BOARDING_MAX_ATTEMPTS; i++) last = await checkBoardingOtp(booking, '000000')
  check('five wrong entries lock the booking', Boolean(last && !last.ok && last.reason === 'locked'))
}

/* ── 3. Wallet ───────────────────────────────────────────────────────────── */
console.log('\nwallet')
{
  const account = `test-account-${Date.now()}`
  eq('a new account has a zero balance', await getBalance(account), 0)

  const credit = await applyWalletTxn(account, {
    label: 'Added to wallet',
    sub: 'test',
    amount: 500,
    kind: 'credit',
    method: 'wallet',
  })
  check('a credit succeeds', credit.ok)
  if (credit.ok) eq('balance after a ₹500 credit', credit.balance, 500)

  const overdraw = await applyWalletTxn(account, {
    label: 'Ride booked',
    sub: 'test',
    amount: 600,
    kind: 'debit',
    method: 'wallet',
  })
  check('a debit larger than the balance is refused', !overdraw.ok)
  eq('refusing it leaves the balance unchanged', await getBalance(account), 500)

  const debit = await applyWalletTxn(account, {
    label: 'Ride booked',
    sub: 'test',
    amount: 500,
    kind: 'debit',
    method: 'wallet',
  })
  check('a debit for exactly the balance succeeds', debit.ok)
  if (debit.ok) eq('balance after spending it all', debit.balance, 0)
}

/* ── 4. Chat ─────────────────────────────────────────────────────────────── */
console.log('\nchat')
{
  const trip = `test-trip-chat-${Date.now()}`
  await sendChat(trip, 'acct-1', 'Driver', "I'm at the pickup point")
  await sendChat(trip, 'acct-2', 'Passenger', 'On my way')

  const messages = await listChat(trip)
  eq('both messages are stored', messages.length, 2)
  eq('newest first, as kvPush stores it', messages[0].text, 'On my way')
}

console.log(`\n${checks - failures}/${checks} passed`)
if (failures > 0) process.exit(1)

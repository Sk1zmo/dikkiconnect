/* ═══════════════════════════════════════════════════════════════════════════
   One run through everything a beta tester does.

     npm run dev:api          (in another terminal, with DEV_PRINT_CODES=1)
     npm run smoke

   Walks the whole product against a real server: sign up with an email and
   no phone number, book a parcel, have a second account claim it, then carry
   it through all four custody checkpoints with codes and photographs, and
   finally delete an account.

   It asserts the things that would actually hurt — that an out-of-order
   hand-off is refused, that a wrong code is counted, that a used code cannot
   be replayed, that two travellers cannot both win the same job — rather than
   just checking for HTTP 200s. A smoke test that only proves the server
   answered is a smoke test that passes while the product is broken.

   Reads sign-in codes from the dev API's own log, which is why it is a local
   tool: on a deployment the code goes to an inbox and nothing may print it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs'

const API = process.env.SMOKE_API ?? 'http://localhost:3001'
const LOG = process.env.SMOKE_LOG ?? null

let checks = 0
let failures = 0
const c = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  bad: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

function check(label, pass, detail = '') {
  checks++
  if (pass) console.log(`  ${c.ok('ok')}    ${label}`)
  else {
    failures++
    console.log(`  ${c.bad('FAIL')}  ${label}${detail ? c.dim(' — ' + detail) : ''}`)
  }
}

async function call(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json
  try {
    json = await res.json()
  } catch {
    json = null
  }
  return { status: res.status, body: json }
}

/** The dev API prints codes when DEV_PRINT_CODES=1. This reads the last one. */
function lastCode() {
  if (!LOG) return null
  try {
    const hits = readFileSync(LOG, 'utf8').match(/→ (\d{6})/g)
    return hits ? hits[hits.length - 1].slice(-6) : null
  } catch {
    return null
  }
}

/** Signs up a brand-new account with an email and deliberately no phone. */
async function signUp(email, name, role) {
  await call('/auth/request-code', { method: 'POST', body: { identifier: email } })
  const code = lastCode()
  if (!code) throw new Error('no sign-in code available — run the API with DEV_PRINT_CODES=1 and set SMOKE_LOG')
  const verified = await call('/auth/verify-code', {
    method: 'POST',
    body: { identifier: email, code },
  })
  const ticket = verified.body?.ticket
  if (!ticket) throw new Error(`verify-code gave no ticket: ${JSON.stringify(verified.body)}`)
  const up = await call('/auth/signup', { method: 'POST', body: { ticket, name, role } })
  if (!up.body?.token) throw new Error(`signup failed: ${JSON.stringify(up.body)}`)
  return { token: up.body.token, account: up.body.account }
}

/** A real 1×1 JPEG, so the route's content-type check is genuinely exercised. */
const JPEG =
  'data:image/jpeg;base64,' +
  Buffer.from(
    'ffd8ffe000104a46494600010100000100010000ffdb004300ffffffffffffffffffffffffffffffffffffff' +
      'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc00011080001000101011100ff' +
      'c40014000100000000000000000000000000000003ffda0008010100003f00d2cf20ffd9',
    'hex',
  ).toString('base64')

const stamp = Date.now()
const addr = (who) => `smoke-${who}-${stamp}@waypool.test`

console.log(`\nWayPool smoke — ${API}\n`)

try {
  /* ── Accounts ──────────────────────────────────────────────────────────── */
  console.log('accounts')
  const sender = await signUp(addr('sender'), 'Smoke Sender', 'sender')
  check('sign up with an email and no phone number', Boolean(sender.token))
  check('no phone is stored rather than an invented one', sender.account.phone === '')

  const driverA = await signUp(addr('driver-a'), 'Driver A', 'traveler')
  const driverB = await signUp(addr('driver-b'), 'Driver B', 'traveler')
  const hub = await signUp(addr('hub'), 'Hub Manager', 'hub')
  check('three more accounts', Boolean(driverA.token && driverB.token && hub.token))

  const anon = await call('/parcels')
  check('an anonymous caller is refused', anon.status === 401)

  /* ── Pricing ───────────────────────────────────────────────────────────── */
  console.log('\npricing')
  const quoted = await call('/parcels?quote=1', {
    method: 'POST',
    token: sender.token,
    body: { fromCityId: 'blr', toCityId: 'mys', size: 'S', category: 'documents', weightKg: 1 },
  })
  check('a quote prices without creating anything', quoted.body?.breakdown?.total === 151,
    `got ${quoted.body?.breakdown?.total}`)

  const madeUp = await call('/parcels?quote=1', {
    method: 'POST',
    token: sender.token,
    body: {
      fromCityId: 'blr', toCityId: 'mys', size: 'S', category: 'documents',
      weightKg: 1, promo: 'FREESTUFF',
    },
  })
  check('an invented promo code is worth nothing', madeUp.body?.breakdown?.discount === 0)

  /* ── Booking ───────────────────────────────────────────────────────────── */
  console.log('\nbooking')
  const created = await call('/parcels', {
    method: 'POST',
    token: sender.token,
    body: {
      mode: 'hub', fromCityId: 'blr', toCityId: 'mys', size: 'S', category: 'documents',
      weightKg: 1, receiverName: 'Smoke Receiver', receiverPhone: '9845012345',
      originHubId: 'blr-kor', destinationHubId: 'mys-sar',
    },
  })
  const parcel = created.body?.parcel
  check('a booking is created', created.status === 201 && Boolean(parcel?.id))
  check('the server sets the price, not the client', parcel?.price === 151, `got ${parcel?.price}`)
  check('it starts unpaid', parcel?.paid === false)
  check('it starts at "booked"', parcel?.status === 'booked')

  const mine = await call('/parcels', { token: sender.token })
  check('it appears in the sender’s own list', mine.body?.sent?.some((p) => p.id === parcel.id))

  const seenByHub = await call(`/parcels?id=${parcel.id}`, { token: hub.token })
  check('a hub can read a parcel it is holding', seenByHub.body?.parcel?.id === parcel.id)

  /* ── Custody, in the order it has to happen ────────────────────────────── */
  console.log('\ncustody')
  const photo = await call('/photos', {
    method: 'POST',
    token: hub.token,
    body: { dataUrl: JPEG, parcelId: parcel.id, checkpoint: 'intake' },
  })
  const photoId = photo.body?.photoId
  check('a hand-over photograph is stored', photo.status === 201 && Boolean(photoId))

  const early = await call('/custody/deliver', {
    method: 'POST',
    token: hub.token,
    body: { parcelId: parcel.id, code: '123456', photoIds: [photoId] },
  })
  check('delivering a parcel nobody has collected is refused',
    early.status === 409 && early.body?.error === 'out-of-order')

  const noPhoto = await call('/custody/intake', {
    method: 'POST',
    token: hub.token,
    body: { parcelId: parcel.id, code: '123456' },
  })
  check('a hand-off with no photograph is refused', noPhoto.body?.error === 'photo-required')

  async function passCheckpoint(checkpoint, holder, receiver, expectStatus) {
    const issued = await call(`/custody/${checkpoint}?parcel=${parcel.id}`, { token: holder.token })
    const code = issued.body?.code
    check(`${checkpoint}: a code is issued to the holder`, /^\d{6}$/.test(code ?? ''))

    const shot = await call('/photos', {
      method: 'POST',
      token: receiver.token,
      body: { dataUrl: JPEG, parcelId: parcel.id, checkpoint },
    })

    const wrong = await call(`/custody/${checkpoint}`, {
      method: 'POST',
      token: receiver.token,
      body: { parcelId: parcel.id, code: '000000', photoIds: [shot.body.photoId] },
    })
    check(`${checkpoint}: a wrong code is refused and counted`,
      wrong.body?.error === 'wrong' && typeof wrong.body?.attemptsLeft === 'number')

    const done = await call(`/custody/${checkpoint}`, {
      method: 'POST',
      token: receiver.token,
      body: { parcelId: parcel.id, code, photoIds: [shot.body.photoId] },
    })
    check(`${checkpoint}: the right code moves it to "${expectStatus}"`,
      done.body?.parcel?.status === expectStatus, `got ${done.body?.parcel?.status}`)

    const replay = await call(`/custody/${checkpoint}`, {
      method: 'POST',
      token: receiver.token,
      body: { parcelId: parcel.id, code, photoIds: [shot.body.photoId] },
    })
    check(`${checkpoint}: the same code cannot be used twice`, replay.status >= 400)
  }

  await passCheckpoint('intake', sender, hub, 'at_origin_hub')

  /* ── The claim race ────────────────────────────────────────────────────── */
  console.log('\nthe job board')
  const [claimA, claimB] = await Promise.all([
    call('/parcels?claim=1', { method: 'POST', token: driverA.token, body: { parcelId: parcel.id } }),
    call('/parcels?claim=1', { method: 'POST', token: driverB.token, body: { parcelId: parcel.id } }),
  ])
  const winners = [claimA, claimB].filter((r) => r.status === 200)
  const losers = [claimA, claimB].filter((r) => r.body?.error === 'taken')
  check('exactly one of two simultaneous claims wins', winners.length === 1, `${winners.length} won`)
  check('the other is told it was taken', losers.length === 1)

  const winner = claimA.status === 200 ? driverA : driverB
  await passCheckpoint('handoff', hub, winner, 'in_transit')
  await passCheckpoint('arrive', winner, hub, 'at_destination_hub')
  await passCheckpoint('deliver', hub, hub, 'delivered')

  const finished = await call(`/parcels?id=${parcel.id}`, { token: sender.token })
  check('the parcel ends delivered', finished.body?.parcel?.status === 'delivered')
  check('with a full append-only timeline', finished.body?.parcel?.timeline?.length === 5,
    `${finished.body?.parcel?.timeline?.length} entries`)

  /* ── Account deletion ──────────────────────────────────────────────────── */
  console.log('\naccount deletion')
  const noConfirm = await call('/account/delete', { method: 'POST', token: driverA.token, body: {} })
  check('deletion needs a typed confirmation', noConfirm.body?.error === 'confirmation-required')

  const spare = await signUp(addr('spare'), 'Spare User', 'sender')
  const inFlight = await call('/parcels', {
    method: 'POST',
    token: spare.token,
    body: {
      mode: 'hub', fromCityId: 'blr', toCityId: 'mys', size: 'S', category: 'documents',
      weightKg: 1, receiverName: 'R', originHubId: 'a', destinationHubId: 'b',
    },
  })
  check('the spare account has a parcel in flight', inFlight.status === 201)

  const blocked = await call('/account/delete', {
    method: 'POST', token: spare.token, body: { confirm: 'DELETE' },
  })
  check('deletion is blocked while a parcel is on its way',
    blocked.body?.error === 'parcels-in-flight')

  const loser = claimA.status === 200 ? driverB : driverA
  const gone = await call('/account/delete', {
    method: 'POST', token: loser.token, body: { confirm: 'DELETE' },
  })
  check('a clean account deletes', gone.body?.ok === true)

  const deadToken = await call('/parcels', { token: loser.token })
  check('and its session dies with it', deadToken.status === 401)
} catch (e) {
  failures++
  console.log(`\n  ${c.bad('ERROR')} ${e.message}`)
}

console.log(
  `\n${checks - failures}/${checks} passed` + (failures ? c.bad(` — ${failures} FAILED`) : ''),
)
process.exitCode = failures ? 1 : 0

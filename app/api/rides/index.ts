import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors } from '../_lib/http.js'
import { record, type Account } from '../_lib/auth.js'
import { requireAccount } from '../_lib/domain.js'
import { kvPush, kvSet } from '../_lib/store.js'
import {
  K,
  applyWalletTxn,
  checkBoardingOtp,
  getBalance,
  getBooking,
  getTrip,
  issueBoardingOtp,
  listBookings,
  listChat,
  listTrips,
  listWalletTxns,
  nextBookingId,
  nextTripId,
  putBooking,
  putTrip,
  refreshSeatsLeft,
  releaseSeats,
  sendChat,
  tryBookSeats,
  type Trip,
} from '../_lib/rides.js'

/**
 * GET  /api/rides?mine=1          — trips this account published + seats they booked
 * GET  /api/rides?search=1&from=&to= — open trips on a corridor
 * GET  /api/rides?id=…            — one trip
 * GET  /api/rides?chat=<tripId>   — that trip's message thread
 * GET  /api/rides?wallet=1        — balance and recent transactions
 * POST /api/rides                 — publish a trip (traveller)
 * POST /api/rides?book=1          — book seats on a trip (passenger)
 * POST /api/rides?board=1         — verify a boarding code (driver, at pickup)
 * POST /api/rides?cancel=1        — cancel a trip or a booking, whichever id is sent
 * POST /api/rides?chat=<tripId>   — send a message on that trip's thread
 * POST /api/rides?topup=1         — add to the wallet (still not real money — see Wallet.tsx)
 * POST /api/rides?spend=1         — debit the wallet for something paid by wallet (e.g. a parcel)
 * POST /api/rides?start=1         — the driver sets off: published → running
 * GET  /api/rides?otp=<bookingId> — the passenger's own current boarding code
 * POST /api/rides?tip=1           — tip the driver of a completed trip
 *
 * Folded into one function for the same reason /api/parcels folded in
 * claiming: Vercel's plan caps serverless functions per deployment, and a
 * cleaner URL per action is not worth spending the twelfth of them.
 */

const MAX_SEATS_PER_TRIP = 6

async function search(req: VercelRequest, res: VercelResponse) {
  const from = typeof req.query.from === 'string' ? req.query.from : ''
  const to = typeof req.query.to === 'string' ? req.query.to : ''
  if (!from || !to) return res.status(400).json({ error: 'route-required' })

  const trips = await listTrips(K.openTrips(from, to))
  const open = trips.filter((t) => t.status === 'published' && t.seatsLeft > 0)
  return res.status(200).json({ trips: open })
}

async function chatThread(req: VercelRequest, res: VercelResponse, account: Account, tripId: string) {
  const trip = await getTrip(tripId)
  if (!trip) return res.status(404).json({ error: 'no-such-trip' })

  const bookings = await listBookings(K.bookingsByTrip(tripId))
  const isDriver = trip.travelerId === account.id
  const isPassenger = bookings.some((b) => b.passengerId === account.id && b.status !== 'cancelled')
  if (!isDriver && !isPassenger) return res.status(403).json({ error: 'not-on-this-trip' })

  if (req.method === 'GET') {
    const messages = await listChat(tripId)
    return res.status(200).json({ messages: messages.reverse() })
  }

  const text = String((req.body as { text?: string } | undefined)?.text ?? '').trim()
  if (!text) return res.status(400).json({ error: 'empty-message' })
  if (text.length > 1000) return res.status(400).json({ error: 'message-too-long' })

  const message = await sendChat(tripId, account.id, account.name, text)
  return res.status(201).json({ message })
}

async function book(req: VercelRequest, res: VercelResponse, account: Account) {
  const b = (req.body ?? {}) as {
    tripId?: string
    seats?: number
    boardingPoint?: string
    payWithWallet?: boolean
  }
  const tripId = String(b.tripId ?? '')
  const seats = Math.trunc(Number(b.seats ?? 1))
  if (!tripId || !Number.isFinite(seats) || seats < 1 || seats > MAX_SEATS_PER_TRIP) {
    return res.status(400).json({ error: 'bad-request' })
  }

  const trip = await getTrip(tripId)
  if (!trip) return res.status(404).json({ error: 'no-such-trip' })
  if (trip.status !== 'published') {
    return res.status(409).json({ error: 'not-bookable', status: trip.status })
  }
  if (trip.travelerId === account.id) return res.status(409).json({ error: 'own-trip' })

  const claimed = await tryBookSeats(tripId, seats)
  if (!claimed.ok) return res.status(409).json({ error: 'sold-out' })

  const fare = seats * trip.farePerSeat
  const paymentMethod: 'wallet' | 'upi' = b.payWithWallet ? 'wallet' : 'upi'

  if (b.payWithWallet) {
    const debit = await applyWalletTxn(account.id, {
      label: 'Ride booked',
      sub: `${trip.fromCityId} → ${trip.toCityId}`,
      amount: fare,
      kind: 'debit',
      method: 'wallet',
    })
    if (!debit.ok) {
      await releaseSeats(tripId, seats) // give the seats back — nothing was actually paid
      return res.status(402).json({ error: 'insufficient-balance' })
    }
    // The other half of the same entry — a debit with nowhere to land would
    // make the fare vanish rather than move, and "moves between two real
    // balances" is the entire difference between a ledger and a counter.
    await applyWalletTxn(trip.travelerId, {
      label: 'Seat sold',
      sub: `${trip.fromCityId} → ${trip.toCityId}`,
      amount: fare,
      kind: 'credit',
      method: 'wallet',
    })
  }

  await putTrip({ ...trip, seatsLeft: claimed.seatsLeft })

  const id = await nextBookingId()
  const booking = {
    id,
    tripId,
    passengerId: account.id,
    passengerName: account.name,
    seats,
    fare,
    boardingPoint: String(b.boardingPoint ?? '').trim() || 'To be confirmed with the driver',
    paymentMethod,
    status: 'upcoming' as const,
    bookedAt: new Date().toISOString(),
  }
  await putBooking(booking)
  await Promise.all([
    kvPush(K.bookingsByPassenger(account.id), id),
    kvPush(K.bookingsByTrip(tripId), id),
  ])
  await issueBoardingOtp(id)
  await record({ kind: 'ride.booked', detail: `${id} ${tripId} seats:${seats}` })

  return res.status(201).json({ booking, trip: { ...trip, seatsLeft: claimed.seatsLeft } })
}

async function board(req: VercelRequest, res: VercelResponse, account: Account) {
  const b = (req.body ?? {}) as { bookingId?: string; code?: string }
  const bookingId = String(b.bookingId ?? '')
  const code = String(b.code ?? '').replace(/\D/g, '')
  if (!bookingId || code.length !== 6) return res.status(400).json({ error: 'bad-request' })

  const booking = await getBooking(bookingId)
  if (!booking) return res.status(404).json({ error: 'no-such-booking' })

  const trip = await getTrip(booking.tripId)
  if (!trip || trip.travelerId !== account.id) {
    return res.status(403).json({ error: 'not-your-trip' })
  }
  if (booking.status !== 'upcoming') {
    return res.status(409).json({ error: 'not-boardable', status: booking.status })
  }

  const check = await checkBoardingOtp(bookingId, code)
  if (!check.ok) return res.status(401).json({ error: check.reason, attemptsLeft: check.attemptsLeft })

  const updated = { ...booking, status: 'boarding' as const }
  await putBooking(updated)
  await record({ kind: 'ride.boarded', detail: bookingId })
  return res.status(200).json({ booking: updated })
}

/**
 * Reverses both legs of a wallet-paid fare — the passenger's debit and the
 * driver's matching credit — so a cancellation actually gives the money
 * back instead of leaving it sitting with whichever side already got paid.
 */
async function refundFare(booking: { passengerId: string; fare: number }, travelerId: string) {
  await applyWalletTxn(booking.passengerId, {
    label: 'Ride cancelled — refund',
    sub: 'Wallet refund',
    amount: booking.fare,
    kind: 'credit',
    method: 'refund',
  })
  await applyWalletTxn(travelerId, {
    label: 'Seat refunded',
    sub: 'Booking cancelled',
    amount: booking.fare,
    kind: 'debit',
    method: 'refund',
  })
}

async function cancel(req: VercelRequest, res: VercelResponse, account: Account) {
  const b = (req.body ?? {}) as { tripId?: string; bookingId?: string }

  if (b.bookingId) {
    const booking = await getBooking(String(b.bookingId))
    if (!booking) return res.status(404).json({ error: 'no-such-booking' })
    if (booking.passengerId !== account.id) return res.status(403).json({ error: 'not-yours' })
    if (booking.status !== 'upcoming') return res.status(409).json({ error: 'not-cancellable' })

    const trip = await getTrip(booking.tripId)
    await putBooking({ ...booking, status: 'cancelled' })
    await releaseSeats(booking.tripId, booking.seats)
    if (trip) {
      await refreshSeatsLeft(trip)
      if (booking.paymentMethod === 'wallet') await refundFare(booking, trip.travelerId)
    }
    await record({ kind: 'ride.cancelled', detail: booking.id })
    return res.status(200).json({ ok: true })
  }

  if (b.tripId) {
    const trip = await getTrip(String(b.tripId))
    if (!trip) return res.status(404).json({ error: 'no-such-trip' })
    if (trip.travelerId !== account.id) return res.status(403).json({ error: 'not-yours' })
    if (trip.status !== 'published') return res.status(409).json({ error: 'not-cancellable' })

    await putTrip({ ...trip, status: 'cancelled' })
    const bookings = await listBookings(K.bookingsByTrip(trip.id))
    await Promise.all(
      bookings
        .filter((bk) => bk.status === 'upcoming')
        .map(async (bk) => {
          await putBooking({ ...bk, status: 'cancelled' })
          if (bk.paymentMethod === 'wallet') await refundFare(bk, trip.travelerId)
        }),
    )
    await record({ kind: 'trip.cancelled', detail: trip.id })
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'bad-request' })
}

async function topup(req: VercelRequest, res: VercelResponse, account: Account) {
  const amount = Math.trunc(Number((req.body as { amount?: number } | undefined)?.amount ?? 0))
  if (!Number.isFinite(amount) || amount <= 0 || amount > 50_000) {
    return res.status(400).json({ error: 'bad-amount' })
  }
  const result = await applyWalletTxn(account.id, {
    label: 'Added to wallet',
    sub: 'Pilot balance — not a real payment',
    amount,
    kind: 'credit',
    method: 'wallet',
  })
  if (!result.ok) return res.status(500).json({ error: 'failed' })
  return res.status(200).json({ balance: result.balance })
}

async function spend(req: VercelRequest, res: VercelResponse, account: Account) {
  const b = (req.body ?? {}) as { amount?: number; label?: string; sub?: string }
  const amount = Math.trunc(Number(b.amount ?? 0))
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'bad-amount' })

  const result = await applyWalletTxn(account.id, {
    label: String(b.label ?? 'Paid from wallet'),
    sub: String(b.sub ?? ''),
    amount,
    kind: 'debit',
    method: 'wallet',
  })
  if (!result.ok) return res.status(402).json({ error: 'insufficient-balance' })
  return res.status(200).json({ balance: result.balance })
}

/**
 * A tip, after a ride. The recipient is never taken from the client — it is
 * whoever the server's own trip record says drove — so this cannot become a
 * general "credit any account" endpoint no matter what a caller sends.
 */
async function tip(req: VercelRequest, res: VercelResponse, account: Account) {
  const b = (req.body ?? {}) as { tripId?: string; amount?: number }
  const tripId = String(b.tripId ?? '')
  const amount = Math.trunc(Number(b.amount ?? 0))
  if (!tripId || !Number.isFinite(amount) || amount <= 0 || amount > 5_000) {
    return res.status(400).json({ error: 'bad-request' })
  }

  const trip = await getTrip(tripId)
  if (!trip) return res.status(404).json({ error: 'no-such-trip' })
  if (trip.travelerId === account.id) return res.status(409).json({ error: 'own-trip' })

  const debit = await applyWalletTxn(account.id, {
    label: 'Tip sent',
    sub: `${trip.fromCityId} → ${trip.toCityId}`,
    amount,
    kind: 'debit',
    method: 'wallet',
  })
  if (!debit.ok) return res.status(402).json({ error: 'insufficient-balance' })

  await applyWalletTxn(trip.travelerId, {
    label: 'Tip received',
    sub: `${trip.fromCityId} → ${trip.toCityId}`,
    amount,
    kind: 'credit',
    method: 'wallet',
  })
  await record({ kind: 'ride.tipped', detail: `${tripId} ${amount}` })
  return res.status(200).json({ ok: true })
}

async function start(req: VercelRequest, res: VercelResponse, account: Account) {
  const tripId = String((req.body as { tripId?: string } | undefined)?.tripId ?? '')
  if (!tripId) return res.status(400).json({ error: 'bad-request' })

  const trip = await getTrip(tripId)
  if (!trip) return res.status(404).json({ error: 'no-such-trip' })
  if (trip.travelerId !== account.id) return res.status(403).json({ error: 'not-your-trip' })
  if (trip.status !== 'published') return res.status(409).json({ error: 'not-startable', status: trip.status })

  const updated = { ...trip, status: 'running' as const }
  await putTrip(updated)
  await record({ kind: 'trip.started', detail: tripId })
  return res.status(200).json({ trip: updated })
}

/** The passenger's own code for their own booking — reissued, never revealed to anyone else. */
async function otp(_req: VercelRequest, res: VercelResponse, account: Account, bookingId: string) {
  const booking = await getBooking(bookingId)
  if (!booking) return res.status(404).json({ error: 'no-such-booking' })
  if (booking.passengerId !== account.id) return res.status(403).json({ error: 'not-yours' })
  if (booking.status !== 'upcoming') {
    return res.status(409).json({ error: 'not-boardable', status: booking.status })
  }
  const code = await issueBoardingOtp(bookingId)
  return res.status(200).json({ code })
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const account = await requireAccount(req.headers.authorization)
  if (!account) return res.status(401).json({ error: 'unauthorised' })

  const chatTripId = typeof req.query.chat === 'string' ? req.query.chat : null
  if (chatTripId) return chatThread(req, res, account, chatTripId)

  const otpBookingId = typeof req.query.otp === 'string' ? req.query.otp : null
  if (otpBookingId) return otp(req, res, account, otpBookingId)

  if (req.method === 'GET') {
    if (req.query.search) return search(req, res)

    if (req.query.wallet) {
      const [balance, txns] = await Promise.all([
        getBalance(account.id),
        listWalletTxns(account.id),
      ])
      return res.status(200).json({ balance, txns })
    }

    const one = typeof req.query.id === 'string' ? req.query.id : null
    if (one) {
      const trip = await getTrip(one)
      if (!trip) return res.status(404).json({ error: 'no-such-trip' })
      const fresh = await refreshSeatsLeft(trip)
      // The driver also gets the passenger manifest for this trip — the only
      // list that lets them verify a boarding code against the right seat.
      if (trip.travelerId === account.id) {
        const bookings = await listBookings(K.bookingsByTrip(one))
        return res.status(200).json({ trip: fresh, bookings })
      }
      return res.status(200).json({ trip: fresh })
    }

    // Default / ?mine=1: what this account published, and what they booked.
    const [published, myBookings] = await Promise.all([
      listTrips(K.tripsByTraveler(account.id)),
      listBookings(K.bookingsByPassenger(account.id)),
    ])
    const bookedTrips = await Promise.all(
      myBookings.map(async (bk) => ({ booking: bk, trip: await getTrip(bk.tripId) })),
    )
    return res.status(200).json({
      published,
      bookings: bookedTrips.filter((x) => x.trip !== null),
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' })

  if (req.query.book) return book(req, res, account)
  if (req.query.board) return board(req, res, account)
  if (req.query.cancel) return cancel(req, res, account)
  if (req.query.topup) return topup(req, res, account)
  if (req.query.spend) return spend(req, res, account)
  if (req.query.start) return start(req, res, account)
  if (req.query.tip) return tip(req, res, account)

  // ── Publish a trip ──────────────────────────────────────────────────────
  const b = (req.body ?? {}) as Partial<Trip> & { vehicle?: Trip['vehicle'] }
  const missing = (['fromCityId', 'toCityId', 'departAt', 'arriveAt'] as const).filter((k) => !b[k])
  if (missing.length) return res.status(400).json({ error: 'missing-fields', fields: missing })

  const seatsTotal = Math.trunc(Number(b.seatsTotal ?? 0))
  if (!Number.isFinite(seatsTotal) || seatsTotal < 0 || seatsTotal > MAX_SEATS_PER_TRIP) {
    return res.status(400).json({ error: 'bad-seats' })
  }
  const farePerSeat = Math.trunc(Number(b.farePerSeat ?? 0))
  if (!Number.isFinite(farePerSeat) || farePerSeat < 0) {
    return res.status(400).json({ error: 'bad-fare' })
  }
  if (seatsTotal > 0 && farePerSeat <= 0) return res.status(400).json({ error: 'bad-fare' })
  if (b.fromCityId === b.toCityId) return res.status(400).json({ error: 'same-city' })

  const id = await nextTripId()
  const createdAt = new Date().toISOString()
  const trip: Trip = {
    id,
    travelerId: account.id,
    travelerName: account.name,
    travelerPhone: account.phone,
    fromCityId: String(b.fromCityId),
    toCityId: String(b.toCityId),
    departAt: String(b.departAt),
    arriveAt: String(b.arriveAt),
    seatsTotal,
    seatsLeft: seatsTotal,
    bootSlots: Array.isArray(b.bootSlots) ? b.bootSlots : [],
    farePerSeat,
    vehicle: b.vehicle ?? null,
    parcelIds: [],
    status: 'published',
    viaStops: Array.isArray(b.viaStops) ? b.viaStops.map(String) : [],
    createdAt,
  }

  await putTrip(trip)
  await kvSet(K.seatsLeft(id), seatsTotal)
  await kvPush(K.tripsByTraveler(account.id), id)
  await kvPush(K.openTrips(trip.fromCityId, trip.toCityId), id)
  await record({ kind: 'trip.published', detail: `${id} ${trip.fromCityId}>${trip.toCityId}` })

  return res.status(201).json({ trip })
}

export default withCors(handler)

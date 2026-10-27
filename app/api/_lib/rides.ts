import { K as BaseK, kvGet, kvIncrBy, kvList, kvPush, kvSet } from './store.js'

/* ═══════════════════════════════════════════════════════════════════════════
   The ride domain, server side.

   Parcels moved off localStorage first; this is the same move for carpooling.
   Before this file, a trip "published" by a traveller lived only in that
   traveller's own browser storage — a passenger on a different phone could
   never see it, book it, or take a seat that was ever actually subtracted
   from anything. Three things live here now and nowhere else, same reasoning
   as api/_lib/domain.ts:

     · the trip and its seat count, because two passengers racing for the
       last seat must be decided by one authority, not two phones agreeing to
       disagree;
     · the boarding OTP, for the same reason a parcel hand-off code is
       server-issued — a code a device both shows and checks is not a check;
     · the wallet balance, because a number that resets the moment somebody
       reinstalls, or differs between their phone and their tablet, was never
       a balance.

   Shapes mirror src/lib/types.ts's Trip, RideBooking, ChatMessage and
   WalletTxn. Reuses the `dkc:` prefix for the same reason domain.ts does:
   it is the address of data already live, not something worth a rename.
   ═══════════════════════════════════════════════════════════════════════════ */

export const K = {
  trip: (id: string) => `dkc:trip:${id}`,
  tripsByTraveler: (accountId: string) => `dkc:trips:trv:${accountId}`,
  /** Every published trip on a corridor — the board a passenger search reads. */
  openTrips: (fromCity: string, toCity: string) => `dkc:trips:open:${fromCity}>${toCity}`,
  tripCounter: 'dkc:counter:trip',
  /** Atomic seats-remaining counter. Authoritative; the trip blob's own
   *  `seatsLeft` is a cache of this, refreshed on every read that needs it. */
  seatsLeft: (tripId: string) => `dkc:seats:${tripId}`,

  booking: (id: string) => `dkc:ride:${id}`,
  bookingsByPassenger: (accountId: string) => `dkc:rides:psg:${accountId}`,
  bookingsByTrip: (tripId: string) => `dkc:rides:trip:${tripId}`,
  rideCounter: 'dkc:counter:ride',
  boardingOtp: (bookingId: string) => `dkc:botp:${bookingId}`,

  /** One thread per trip, shared by the driver and every passenger on it. */
  chat: (tripId: string) => `dkc:chat:${tripId}`,

  walletBalance: (accountId: string) => `dkc:wallet:bal:${accountId}`,
  walletTxns: (accountId: string) => `dkc:wallet:tx:${accountId}`,

  ...BaseK,
} as const

const now = () => new Date().toISOString()
const rid = () => Math.random().toString(36).slice(2, 10)
const sixDigits = () => String(Math.floor(100000 + Math.random() * 900000))

/* ── Trips ─────────────────────────────────────────────────────────────── */

export type ParcelSize = 'S' | 'M' | 'L'

export interface Trip {
  id: string
  travelerId: string
  travelerName: string
  travelerPhone: string
  fromCityId: string
  toCityId: string
  departAt: string
  arriveAt: string
  seatsTotal: number
  seatsLeft: number
  bootSlots: ParcelSize[]
  farePerSeat: number
  vehicle: { model: string; plate: string; colour: string; seats: number } | null
  /** Parcel-to-trip matching is not wired yet — always empty for now. */
  parcelIds: string[]
  status: 'published' | 'running' | 'completed' | 'cancelled'
  viaStops: string[]
  createdAt: string
}

export async function nextTripId(): Promise<string> {
  const n = await kvGet<number>(K.tripCounter)
  const next = (typeof n === 'number' ? n : 0) + 1
  await kvSet(K.tripCounter, next)
  return `TRP-${next}`
}

export const getTrip = (id: string) => kvGet<Trip>(K.trip(id))
export const putTrip = (t: Trip) => kvSet(K.trip(t.id), t)

export async function listTrips(key: string, limit = 100): Promise<Trip[]> {
  const ids = await kvList<string>(key, limit)
  const found = await Promise.all(ids.map((id) => getTrip(id)))
  return found.filter((t): t is Trip => t !== null)
}

/** The live seat count, synced back onto the trip blob so readers agree. */
export async function refreshSeatsLeft(trip: Trip): Promise<Trip> {
  const left = await kvGet<number>(K.seatsLeft(trip.id))
  if (left === null || left === trip.seatsLeft) return trip
  const next = { ...trip, seatsLeft: Math.max(0, left) }
  await putTrip(next)
  return next
}

export type BookResult =
  | { ok: true; seatsLeft: number }
  | { ok: false; reason: 'sold-out' }

/**
 * The only place seats move from "available" to "taken". `INCRBY` by a
 * negative amount is one atomic Redis command — two passengers booking the
 * last two seats at the same instant both still get a correct, distinct
 * result, which a read-then-write in application code could not promise.
 */
export async function tryBookSeats(tripId: string, seats: number): Promise<BookResult> {
  const left = await kvIncrBy(K.seatsLeft(tripId), -seats)
  if (left < 0) {
    await kvIncrBy(K.seatsLeft(tripId), seats) // rollback — never leave the counter negative
    return { ok: false, reason: 'sold-out' }
  }
  return { ok: true, seatsLeft: left }
}

export async function releaseSeats(tripId: string, seats: number): Promise<void> {
  await kvIncrBy(K.seatsLeft(tripId), seats)
}

/* ── Bookings ──────────────────────────────────────────────────────────── */

export interface RideBooking {
  id: string
  tripId: string
  passengerId: string
  passengerName: string
  seats: number
  fare: number
  boardingPoint: string
  /** Decides whether cancelling this booking owes a wallet refund. */
  paymentMethod: 'wallet' | 'upi' | 'card'
  status: 'upcoming' | 'boarding' | 'running' | 'completed' | 'cancelled'
  bookedAt: string
}

export async function nextBookingId(): Promise<string> {
  const n = await kvGet<number>(K.rideCounter)
  const next = (typeof n === 'number' ? n : 0) + 1
  await kvSet(K.rideCounter, next)
  return `RDE-${next}`
}

export const getBooking = (id: string) => kvGet<RideBooking>(K.booking(id))
export const putBooking = (b: RideBooking) => kvSet(K.booking(b.id), b)

export async function listBookings(key: string, limit = 100): Promise<RideBooking[]> {
  const ids = await kvList<string>(key, limit)
  const found = await Promise.all(ids.map((id) => getBooking(id)))
  return found.filter((b): b is RideBooking => b !== null)
}

/* ── Boarding OTP ──────────────────────────────────────────────────────────
   Same shape as a parcel hand-off code: issued and checked here, never
   derived by the phone that is about to be asked for it. A driver confirms a
   passenger boarded by reading this off their screen, not by trusting a tap.
   ───────────────────────────────────────────────────────────────────────── */

export const BOARDING_OTP_TTL_SECONDS = 24 * 60 * 60
export const BOARDING_MAX_ATTEMPTS = 5

interface BoardingOtp {
  code: string
  attempts: number
  issuedAt: string
}

export async function issueBoardingOtp(bookingId: string): Promise<string> {
  const key = K.boardingOtp(bookingId)
  const live = await kvGet<BoardingOtp>(key)
  if (live && live.attempts < BOARDING_MAX_ATTEMPTS) return live.code

  const code = sixDigits()
  await kvSet(key, { code, attempts: 0, issuedAt: now() }, BOARDING_OTP_TTL_SECONDS)
  return code
}

export type BoardingCheck =
  | { ok: true }
  | { ok: false; reason: 'no-code' | 'locked' | 'wrong'; attemptsLeft: number }

export async function checkBoardingOtp(bookingId: string, entered: string): Promise<BoardingCheck> {
  const key = K.boardingOtp(bookingId)
  const live = await kvGet<BoardingOtp>(key)
  if (!live) return { ok: false, reason: 'no-code', attemptsLeft: 0 }
  if (live.attempts >= BOARDING_MAX_ATTEMPTS) return { ok: false, reason: 'locked', attemptsLeft: 0 }

  if (live.code !== entered.trim()) {
    const attempts = live.attempts + 1
    await kvSet(key, { ...live, attempts }, BOARDING_OTP_TTL_SECONDS)
    return {
      ok: false,
      reason: attempts >= BOARDING_MAX_ATTEMPTS ? 'locked' : 'wrong',
      attemptsLeft: Math.max(0, BOARDING_MAX_ATTEMPTS - attempts),
    }
  }

  // Single use, same as a hand-off code — spent, not left live for a replay.
  await kvSet(key, { ...live, attempts: BOARDING_MAX_ATTEMPTS }, BOARDING_OTP_TTL_SECONDS)
  return { ok: true }
}

/* ── Chat ──────────────────────────────────────────────────────────────────
   One thread per trip. Simpler than one thread per booking because a trip
   with three passengers is one car at one departure time — they are already
   about to share a seat, and a driver juggling three separate inboxes for
   the same drive is worse than the other way round.
   ───────────────────────────────────────────────────────────────────────── */

export interface ChatMessage {
  id: string
  tripId: string
  fromAccountId: string
  fromName: string
  text: string
  at: string
}

export const listChat = (tripId: string, limit = 200) =>
  kvList<ChatMessage>(K.chat(tripId), limit)

export async function sendChat(
  tripId: string,
  fromAccountId: string,
  fromName: string,
  text: string,
): Promise<ChatMessage> {
  const message: ChatMessage = { id: rid(), tripId, fromAccountId, fromName, text, at: now() }
  await kvPush(K.chat(tripId), message, 200)
  return message
}

/* ── Wallet ────────────────────────────────────────────────────────────────
   Still not a payment system — nothing here moves real money, and every
   screen that shows this number keeps saying so. What changes is that the
   number is now one fact the server keeps, instead of a separate guess per
   device that drifts the moment somebody reinstalls or opens a second phone.
   ───────────────────────────────────────────────────────────────────────── */

export interface WalletTxn {
  id: string
  label: string
  sub: string
  amount: number
  at: string
  kind: 'credit' | 'debit'
  method: 'upi' | 'card' | 'wallet' | 'payout' | 'refund'
}

export const getBalance = async (accountId: string): Promise<number> =>
  Math.max(0, (await kvGet<number>(K.walletBalance(accountId))) ?? 0)

export const listWalletTxns = (accountId: string, limit = 100) =>
  kvList<WalletTxn>(K.walletTxns(accountId), limit)

/**
 * The only way the balance moves. A debit that would go negative is refused
 * rather than clamped — "we let you overspend and rounded it to zero" is a
 * worse answer than telling the top-up screen the truth before it happens.
 */
export async function applyWalletTxn(
  accountId: string,
  entry: Omit<WalletTxn, 'id' | 'at'>,
): Promise<{ ok: true; balance: number } | { ok: false; reason: 'insufficient' }> {
  const delta = entry.kind === 'credit' ? entry.amount : -entry.amount
  const balance = await kvIncrBy(K.walletBalance(accountId), delta)
  if (balance < 0) {
    await kvIncrBy(K.walletBalance(accountId), -delta)
    return { ok: false, reason: 'insufficient' }
  }
  const txn: WalletTxn = { ...entry, id: rid(), at: now() }
  await kvPush(K.walletTxns(accountId), txn, 100)
  return { ok: true, balance }
}

import { accountForToken, type Account } from './auth.js'
import { K as BaseK, kvGet, kvList, kvPush, kvSet } from './store.js'

/* ═══════════════════════════════════════════════════════════════════════════
   The parcel domain, server side.

   This is the file that turns WayPool from a front end into a service. Three
   things live here and nowhere else:

     · the price, because a client must never compute what it is charged;
     · the custody state machine, because a parcel's position in the world is
       a fact the server owns, not a value a phone reports;
     · the hand-off OTPs, because a code the client both issues and checks is
       not a check at all.

   The shapes mirror `src/lib/types.ts` exactly. That file is the contract
   between the app and this API, and the app is already written against it —
   so these payloads are structurally identical and the UI needs no rewrite.

   ── On the `dkc:` key prefix ──────────────────────────────────────────────
   Every other identifier in the product was renamed to WayPool. These keys
   were not, deliberately. The prefix is not copy, it is the address of real
   accounts and sessions already sitting in the live datastore; renaming it
   would orphan them and sign everybody out to buy nothing but tidiness. New
   keys below use the same prefix so the store stays internally consistent
   rather than half-migrated, which is the worse of the two states.
   ═══════════════════════════════════════════════════════════════════════════ */

export const K = {
  parcel: (id: string) => `dkc:parcel:${id}`,
  /** Index of parcel ids, newest first, per account. */
  parcelsBySender: (accountId: string) => `dkc:parcels:sender:${accountId}`,
  parcelsByTraveler: (accountId: string) => `dkc:parcels:trv:${accountId}`,
  /** Every parcel awaiting a carrier on a corridor — the job board. */
  openJobs: (fromCity: string, toCity: string) => `dkc:jobs:${fromCity}>${toCity}`,
  /** Push tokens for one account's phones. */
  devices: (accountId: string) => `dkc:devices:${accountId}`,
  /** The payment link issued for a parcel, so a webhook can be matched back. */
  paymentLink: (parcelId: string) => `dkc:paylink:${parcelId}`,
  /** Holds a job for one traveller. Its existence IS the claim. */
  claim: (parcelId: string) => `dkc:claim:${parcelId}`,
  /** One stored hand-over photograph. */
  photo: (id: string) => `dkc:photo:${id}`,
  /** Append-only custody log for one parcel. */
  custody: (parcelId: string) => `dkc:custody:${parcelId}`,
  /** The live code for one checkpoint of one parcel. */
  handoffOtp: (parcelId: string, checkpoint: Checkpoint) => `dkc:hotp:${parcelId}:${checkpoint}`,
  /** Monotonic source for human-facing parcel numbers. */
  parcelCounter: 'dkc:counter:parcel',
  ...BaseK,
} as const

/* ── Pricing ───────────────────────────────────────────────────────────────
   Lifted unchanged from src/lib/data.ts, which was the specification while
   the app ran on mock data. It is authoritative here now: /parcels quotes
   from this function and stores the result, and the client's own copy becomes
   a display estimate that is never the number charged. If the two ever
   disagree, this one is right.
   ───────────────────────────────────────────────────────────────────────── */

export const PARCEL_SIZES = [
  { id: 'S' as const, maxKg: 3, base: 79 },
  { id: 'M' as const, maxKg: 10, base: 139 },
  { id: 'L' as const, maxKg: 20, base: 249 },
]

const CORRIDOR_KM: Record<string, number> = {
  'blr>mys': 145,
  'blr>che': 346,
  'blr>mng': 352,
  'blr>hbl': 410,
  'mys>mng': 258,
}

export const corridorKm = (from: string, to: string) =>
  CORRIDOR_KM[`${from}>${to}`] ?? CORRIDOR_KM[`${to}>${from}`] ?? 200

export interface PriceBreakdown {
  base: number
  distance: number
  weight: number
  fragile: number
  insurance: number
  discount: number
  gst: number
  total: number
  km: number
}

/* ═══════════════════════════════════════════════════════════════════════════
   Promotions.

   This used to be `input.promo ? subtotal * 0.2 : 0` — any non-empty string
   bought 20% off. The code is typed by the customer, so that is not a promo
   system, it is a 20% discount available to anyone who types a letter into
   the box, and the server was the party agreeing to it.

   A real campaign engine belongs here eventually, with windows and budgets
   and per-account limits. Until then this is the list, on the server, which
   is the part that actually has to be true.
   ═══════════════════════════════════════════════════════════════════════════ */
const PROMOS: Record<string, number> = {
  MYSORE20: 0.2,
  FIRSTDROP: 0.2,
  BOOTSPACE10: 0.1,
}

function promoDiscount(code: string | null | undefined, subtotal: number): number {
  if (!code) return 0
  const rate = PROMOS[code.trim().toUpperCase()]
  return rate ? Math.round(subtotal * rate) : 0
}

export function quote(input: {
  fromCityId: string
  toCityId: string
  size: 'S' | 'M' | 'L'
  weightKg: number
  fragile: boolean
  insured: boolean
  promo?: string | null
}): PriceBreakdown {
  const km = corridorKm(input.fromCityId, input.toCityId)
  const sizeDef = PARCEL_SIZES.find((s) => s.id === input.size) ?? PARCEL_SIZES[1]

  const base = sizeDef.base
  const distance = Math.round(km * 0.34)
  /* Half the size's ceiling is included; only the excess is charged, so a
     1 kg parcel in a Small costs nothing extra and a 3 kg one does. */
  const overweight = Math.max(0, input.weightKg - sizeDef.maxKg * 0.5)
  const weight = Math.round(overweight * 11)
  const fragile = input.fragile ? 29 : 0
  const insurance = input.insured ? 25 : 0

  const subtotal = base + distance + weight + fragile + insurance
  const discount = promoDiscount(input.promo, subtotal)
  const gst = Math.round((subtotal - discount) * 0.18)
  const total = subtotal - discount + gst

  return { base, distance, weight, fragile, insurance, discount, gst, total, km }
}

/* ── Custody ───────────────────────────────────────────────────────────────
   A parcel's status is a position in a chain, and the only way to move along
   it is to prove the hand-off happened. The order is fixed and the server
   refuses to skip: a parcel cannot be delivered from a shelf it never
   reached, and "in transit" is not something a phone gets to assert.
   ───────────────────────────────────────────────────────────────────────── */

export type ParcelStatus =
  | 'booked'
  | 'at_origin_hub'
  | 'assigned'
  | 'in_transit'
  | 'at_destination_hub'
  | 'delivered'
  | 'cancelled'

export type Checkpoint = 'intake' | 'handoff' | 'arrive' | 'deliver'

/** checkpoint → [status required before, status after]. */
const TRANSITION: Record<Checkpoint, { from: ParcelStatus[]; to: ParcelStatus }> = {
  intake: { from: ['booked'], to: 'at_origin_hub' },
  handoff: { from: ['at_origin_hub', 'assigned'], to: 'in_transit' },
  arrive: { from: ['in_transit'], to: 'at_destination_hub' },
  deliver: { from: ['at_destination_hub'], to: 'delivered' },
}

/** Cancellation is only honest while nobody has physically taken the parcel. */
export const CANCELLABLE: ParcelStatus[] = ['booked']

export function canTransition(current: ParcelStatus, checkpoint: Checkpoint) {
  return TRANSITION[checkpoint].from.includes(current)
}

export const statusAfter = (checkpoint: Checkpoint) => TRANSITION[checkpoint].to

export interface TrackingEvent {
  id: string
  status: ParcelStatus
  title: string
  detail: string
  at: string | null
  actor?: string
  location?: string
  otpVerified?: boolean
  photos?: number
  done: boolean
}

export interface CustodyEvent {
  id: string
  parcelId: string
  checkpoint: Checkpoint
  /** Account id of whoever completed the hand-off. */
  actorId: string
  actorName: string
  otpVerified: boolean
  /* Every shot taken at this checkpoint. A hand-off is photographed from
     several angles — storing only the first would throw away the two that
     show the damage. */
  photoIds: string[]
  at: string
  coords?: { lat: number; lng: number }
}

export interface Parcel {
  id: string
  mode: 'hub' | 'p2p'
  senderId: string
  senderName: string
  receiverName: string
  receiverPhone: string
  fromCityId: string
  toCityId: string
  originHubId: string
  destinationHubId: string
  pickupAddress?: string
  dropAddress?: string
  category: string
  size: 'S' | 'M' | 'L'
  weightKg: number
  declaredValue: number
  fragile: boolean
  insured: boolean
  notes?: string
  status: ParcelStatus
  bookedAt: string
  etaAt: string
  price: number
  breakdown: PriceBreakdown
  paid: boolean
  /** When the webhook confirmed it. Absent until then. */
  paidAt?: string
  /** The provider's id for the link issued, for reconciliation. */
  paymentReference?: string
  travelerId?: string
  travelerName?: string
  timeline: TrackingEvent[]
}

/* ── Persistence ─────────────────────────────────────────────────────────── */

const now = () => new Date().toISOString()
const rid = () => Math.random().toString(36).slice(2, 10)

/** Human-facing parcel number. WYP- is the product's prefix; see the rename note. */
export async function nextParcelId(): Promise<string> {
  const n = await kvGet<number>(K.parcelCounter)
  const next = (typeof n === 'number' ? n : 4860) + 1
  await kvSet(K.parcelCounter, next)
  return `WYP-${next}`
}

export const getParcel = (id: string) => kvGet<Parcel>(K.parcel(id))
export const putParcel = (p: Parcel) => kvSet(K.parcel(p.id), p)

export async function listParcels(key: string, limit = 50): Promise<Parcel[]> {
  const ids = await kvList<string>(key, limit)
  const found = await Promise.all(ids.map((id) => getParcel(id)))
  return found.filter((p): p is Parcel => p !== null)
}

export const indexParcel = (key: string, id: string) => kvPush(key, id)

export const custodyLog = (parcelId: string) => kvList<CustodyEvent>(K.custody(parcelId), 50)

export async function appendCustody(e: Omit<CustodyEvent, 'id' | 'at'>): Promise<CustodyEvent> {
  const event: CustodyEvent = { ...e, id: rid(), at: now() }
  await kvPush(K.custody(e.parcelId), event)
  return event
}

/* ── Hand-off OTPs ─────────────────────────────────────────────────────────
   One code, one parcel, one checkpoint. Issued here, stored here, compared
   here. The prototype let a device reveal the code to itself because there
   was only ever one device; that convenience cannot survive contact with two
   real parties, so it does not exist on this side.
   ───────────────────────────────────────────────────────────────────────── */

export const HANDOFF_OTP_TTL_SECONDS = 30 * 60
export const HANDOFF_MAX_ATTEMPTS = 5

interface HandoffOtp {
  code: string
  attempts: number
  issuedAt: string
}

const sixDigits = () => String(Math.floor(100000 + Math.random() * 900000))

/** Issues, or returns the live code — so a reload does not invalidate it. */
export async function issueHandoffOtp(parcelId: string, checkpoint: Checkpoint): Promise<string> {
  const key = K.handoffOtp(parcelId, checkpoint)
  const live = await kvGet<HandoffOtp>(key)
  if (live && live.attempts < HANDOFF_MAX_ATTEMPTS) return live.code

  const code = sixDigits()
  await kvSet(key, { code, attempts: 0, issuedAt: now() }, HANDOFF_OTP_TTL_SECONDS)
  return code
}

export type HandoffCheck =
  | { ok: true }
  | { ok: false; reason: 'no-code' | 'locked' | 'wrong'; attemptsLeft: number }

export async function checkHandoffOtp(
  parcelId: string,
  checkpoint: Checkpoint,
  entered: string,
): Promise<HandoffCheck> {
  const key = K.handoffOtp(parcelId, checkpoint)
  const live = await kvGet<HandoffOtp>(key)
  if (!live) return { ok: false, reason: 'no-code', attemptsLeft: 0 }
  if (live.attempts >= HANDOFF_MAX_ATTEMPTS) return { ok: false, reason: 'locked', attemptsLeft: 0 }

  if (live.code !== entered.trim()) {
    const attempts = live.attempts + 1
    await kvSet(key, { ...live, attempts }, HANDOFF_OTP_TTL_SECONDS)
    return {
      ok: false,
      reason: attempts >= HANDOFF_MAX_ATTEMPTS ? 'locked' : 'wrong',
      attemptsLeft: Math.max(0, HANDOFF_MAX_ATTEMPTS - attempts),
    }
  }

  /* Single use: a correct code is spent, not left lying around for a second
     hand-off at the same checkpoint. */
  await kvSet(key, { ...live, attempts: HANDOFF_MAX_ATTEMPTS }, HANDOFF_OTP_TTL_SECONDS)
  return { ok: true }
}

/* ── Timeline ──────────────────────────────────────────────────────────────
   Append-only. A checkpoint that happened is never rewritten, because the
   timeline is the evidence the product sells — "custody is a chain, not a
   promise" is only true if nothing can quietly edit a link.
   ───────────────────────────────────────────────────────────────────────── */

const TITLES: Record<Checkpoint, { title: string; detail: (by: string) => string }> = {
  intake: { title: 'At origin hub', detail: (by) => `Received and shelved by ${by}.` },
  handoff: { title: 'In transit', detail: (by) => `Handed to ${by}.` },
  arrive: { title: 'At destination hub', detail: (by) => `Dropped at the hub by ${by}.` },
  deliver: { title: 'Delivered', detail: (by) => `Collected, OTP verified by ${by}.` },
}

export function timelineEntry(
  checkpoint: Checkpoint,
  actorName: string,
  photoCount: number,
): TrackingEvent {
  const t = TITLES[checkpoint]
  return {
    id: rid(),
    status: statusAfter(checkpoint),
    title: t.title,
    detail: t.detail(actorName),
    at: now(),
    actor: actorName,
    otpVerified: true,
    photos: photoCount,
    done: true,
  }
}

/** The caller, or null. Every domain route starts with this. */
export async function requireAccount(
  authorization: string | undefined,
): Promise<Account | null> {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  return accountForToken(token)
}

/* ═══════════════════════════════════════════════════════════════════════════
   The client for everything that is not sign-in.

   lib/auth.tsx has its own small fetch wrapper because it runs before a
   session exists. This one runs after, so every call carries the token and
   every call can fail in ways that matter to a person holding a parcel.

   ── Why this does not fall back to local state ────────────────────────────
   The app shipped for a year on `localStorage`, and a quiet fallback would
   have been the easy way to keep that working while the server came up. It
   is the wrong choice here. A booking that silently succeeds locally when
   the server rejected it leaves somebody standing at a hub with a parcel the
   network has never heard of, and a custody step that "works" offline is the
   exact failure the OTP chain exists to prevent.

   So: when the server is reachable it is the only authority, and when it is
   not, the caller gets a failure it has to show. `ApiError.kind` separates
   the three cases a user can act on differently — offline, signed out, and
   the server refusing on purpose.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { RideBooking, Trip, TripVehicle, WalletTxn } from './types'

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN as string | undefined) ?? ''

export type ApiErrorKind = 'offline' | 'unauthorised' | 'rejected'

export class ApiError extends Error {
  kind: ApiErrorKind
  status: number
  /** The server's machine-readable `error` field, when it sent one. */
  code?: string
  /** Anything else the route returned — attemptsLeft, the parcel's status. */
  data?: Record<string, unknown>

  constructor(kind: ApiErrorKind, status: number, message: string, body?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.code = typeof body?.error === 'string' ? body.error : undefined
    this.data = body
  }
}

/** Plain-language text for a failure, so screens do not each invent their own. */
export function explain(e: unknown): string {
  if (!(e instanceof ApiError)) return 'Something went wrong. Try again.'
  switch (e.code) {
    case 'out-of-order':
      return `This parcel is at "${String(e.data?.status ?? 'an earlier step')}" — that hand-off cannot happen yet.`
    case 'photo-required':
      return 'Take the hand-over photo before confirming.'
    case 'wrong':
      return `That code is not right. ${e.data?.attemptsLeft ?? 0} attempts left.`
    case 'locked':
      return 'Too many wrong codes. This checkpoint is locked — restart it.'
    case 'no-code':
      return 'No code has been issued for this hand-off yet.'
    case 'no-such-parcel':
      return 'That parcel no longer exists.'
    case 'taken':
      return 'Another traveller got this one first.'
    case 'already-yours':
      return 'This job is already on your manifest.'
    case 'not-claimable':
      return 'This parcel is no longer on the job board.'
    case 'no-payment-provider':
      return 'Online payment is not switched on yet. Pay by UPI or wallet instead.'
    case 'already-paid':
      return 'This parcel is already paid for.'
    case 'provider-refused':
      return 'The payment provider could not create a link. Try another method.'
    case 'parcels-in-flight':
      return String(e.data?.detail ?? 'You have parcels still on their way.')
    case 'sold-out':
      return 'Somebody else took the last seat. Try another ride.'
    case 'insufficient-balance':
      return 'Your wallet balance is not enough for this. Top it up or pay another way.'
    case 'own-trip':
      return 'You cannot book a seat on your own ride.'
    case 'not-your-trip':
      return 'This ride is not yours to manage.'
    case 'not-on-this-trip':
      return 'You are not on this ride.'
    case 'not-bookable':
      return `This ride is no longer open for booking (${String(e.data?.status ?? 'closed')}).`
    case 'not-boardable':
      return 'This booking is not ready to board.'
    case 'not-cancellable':
      return 'This can no longer be cancelled.'
    default:
      break
  }
  if (e.kind === 'offline') return 'No connection. This needs the network — nothing was saved.'
  if (e.kind === 'unauthorised') return 'Your session expired. Sign in again.'
  return 'The server refused that. Nothing was saved.'
}

function token(): string | null {
  try {
    const raw = localStorage.getItem('waypool.token')
    return raw ? (JSON.parse(raw) as string) : null
  } catch {
    return null
  }
}

async function call<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const t = token()
  let res: Response
  try {
    res = await fetch(`${API_ORIGIN}/api${path}`, {
      method: init?.method ?? (init?.body ? 'POST' : 'GET'),
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError('offline', 0, 'network unreachable')
  }

  let body: Record<string, unknown> | undefined
  try {
    body = (await res.json()) as Record<string, unknown>
  } catch {
    body = undefined
  }

  if (res.ok) return body as T
  if (res.status === 401) throw new ApiError('unauthorised', 401, 'signed out', body)
  throw new ApiError('rejected', res.status, String(body?.error ?? res.statusText), body)
}

export type Checkpoint = 'intake' | 'handoff' | 'arrive' | 'deliver'

/* ── Parcels ─────────────────────────────────────────────────────────────── */

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

export interface ServerParcel {
  id: string
  status: string
  price: number
  breakdown: PriceBreakdown
  paid: boolean
  timeline: Array<Record<string, unknown>>
  [k: string]: unknown
}

export const parcels = {
  mine: () => call<{ sent: ServerParcel[]; carrying: ServerParcel[] }>('/parcels'),

  /** One parcel by id — how a hub reads a parcel it is holding. */
  one: (id: string) =>
    call<{ parcel: ServerParcel }>(`/parcels?id=${encodeURIComponent(id)}`),

  /** The authoritative price. The client's own estimate is for the form only. */
  quote: (draft: Record<string, unknown>) =>
    call<{ breakdown: PriceBreakdown }>('/parcels?quote=1', { body: draft }),

  create: (draft: Record<string, unknown>) =>
    call<{ parcel: ServerParcel }>('/parcels', { body: draft }),

  /** Takes a job off the board. The server decides who got there first. */
  claim: (parcelId: string) =>
    call<{ parcel: ServerParcel }>('/parcels?claim=1', { body: { parcelId } }),
}

/* ── Custody ─────────────────────────────────────────────────────────────── */

export const custody = {
  /** The code the giving party shows. Never call this on the receiving device. */
  code: (parcelId: string, checkpoint: Checkpoint) =>
    call<{ code: string }>(`/custody/${checkpoint}?parcel=${encodeURIComponent(parcelId)}`),

  /** The receiving party submits what they were shown, plus the photo. */
  complete: (
    checkpoint: Checkpoint,
    input: {
      parcelId: string
      code: string
      /** Every shot taken at this checkpoint. At least one, or the server refuses. */
      photoIds: string[]
      coords?: { lat: number; lng: number }
    },
  ) => call<{ parcel: ServerParcel }>(`/custody/${checkpoint}`, { body: input }),
}

/* ── Photos ──────────────────────────────────────────────────────────────── */

export const photos = {
  /** Uploads one downscaled shot. Returns the id the custody event records. */
  store: (dataUrl: string, parcelId?: string, checkpoint?: Checkpoint) =>
    call<{ photoId: string; bytes: number }>('/photos', {
      body: { dataUrl, parcelId, checkpoint },
    }),

  /** Reads one back for display. The id alone is the capability. */
  read: (photoId: string) =>
    call<{ photoId: string; dataUrl: string; at: string }>(
      `/photos?id=${encodeURIComponent(photoId)}`,
    ),
}

/* ── Payments ────────────────────────────────────────────────────── */

export interface PaymentLinkResult {
  provider: 'razorpay' | 'paypal'
  url: string
  reference: string
}

export const payments = {
  /** A URL the sender opens in their own bank or wallet app. */
  link: (parcelId: string) =>
    call<PaymentLinkResult>('/payments/link', { body: { parcelId } }),
}

/* ── Rides ───────────────────────────────────────────────────────────────── */

export interface RideChatMessage {
  id: string
  tripId: string
  fromAccountId: string
  fromName: string
  text: string
  at: string
}

export const rides = {
  mine: () =>
    call<{ published: Trip[]; bookings: Array<{ booking: RideBooking; trip: Trip }> }>(
      '/rides?mine=1',
    ),

  one: (id: string) => call<{ trip: Trip; bookings?: RideBooking[] }>(`/rides?id=${encodeURIComponent(id)}`),

  search: (fromCityId: string, toCityId: string) =>
    call<{ trips: Trip[] }>(
      `/rides?search=1&from=${encodeURIComponent(fromCityId)}&to=${encodeURIComponent(toCityId)}`,
    ),

  publish: (draft: {
    fromCityId: string
    toCityId: string
    departAt: string
    arriveAt: string
    seatsTotal: number
    farePerSeat: number
    bootSlots?: Trip['bootSlots']
    viaStops?: string[]
    vehicle?: TripVehicle | null
  }) => call<{ trip: Trip }>('/rides', { body: draft }),

  start: (tripId: string) => call<{ trip: Trip }>('/rides?start=1', { body: { tripId } }),

  book: (input: { tripId: string; seats: number; boardingPoint?: string; payWithWallet?: boolean }) =>
    call<{ booking: RideBooking; trip: Trip }>('/rides?book=1', { body: input }),

  /** This passenger's own current boarding code — issued fresh if none is live. */
  otp: (bookingId: string) => call<{ code: string }>(`/rides?otp=${encodeURIComponent(bookingId)}`),

  /** The driver reads what the passenger shows at the kerb and submits it. */
  board: (bookingId: string, code: string) =>
    call<{ booking: RideBooking }>('/rides?board=1', { body: { bookingId, code } }),

  cancelTrip: (tripId: string) => call<{ ok: true }>('/rides?cancel=1', { body: { tripId } }),
  cancelBooking: (bookingId: string) => call<{ ok: true }>('/rides?cancel=1', { body: { bookingId } }),

  /** Debits the passenger's wallet and credits the driver's — the server
   *  decides who that is from the trip record, never from the caller. */
  tip: (tripId: string, amount: number) => call<{ ok: true }>('/rides?tip=1', { body: { tripId, amount } }),

  chat: {
    list: (tripId: string) =>
      call<{ messages: RideChatMessage[] }>(`/rides?chat=${encodeURIComponent(tripId)}`),
    send: (tripId: string, text: string) =>
      call<{ message: RideChatMessage }>(`/rides?chat=${encodeURIComponent(tripId)}`, {
        body: { text },
      }),
  },
}

/* ── Wallet ──────────────────────────────────────────────────────────────── */

export const wallet = {
  get: () => call<{ balance: number; txns: WalletTxn[] }>('/rides?wallet=1'),
  topup: (amount: number) => call<{ balance: number }>('/rides?topup=1', { body: { amount } }),
  spend: (amount: number, label: string, sub?: string) =>
    call<{ balance: number }>('/rides?spend=1', { body: { amount, label, sub } }),
}

/* ── Push ────────────────────────────────────────────────────────── */

export const push = {
  /** `deliverable` is false when no FCM credentials are set server-side. */
  register: (token: string, platform: string) =>
    call<{ ok: true; deliverable: boolean }>('/push/register', { body: { token, platform } }),

  forget: (token: string) =>
    call<{ ok: true }>('/push/register', { method: 'DELETE', body: { token } }),
}

/* ── Account ─────────────────────────────────────────────────────── */

export const account = {
  /** Irreversible. The typed confirmation is required by the server too. */
  remove: () => call<{ ok: true }>('/account/delete', { body: { confirm: 'DELETE' } }),
}

/** True when a server is configured at all. False in a bare local web build. */
export const apiConfigured = () => API_ORIGIN !== '' || typeof window !== 'undefined'

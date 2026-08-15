import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  NOTIFICATIONS,
  PARCELS,
  TRAVELERS,
  TRIPS,
  newTimeline,
  otpFor,
  quote,
  resolveHub,
  type PriceBreakdown,
} from './data'
import type {
  DeliveryMode,
  NotificationItem,
  Parcel,
  ParcelSize,
  ParcelStatus,
  RideBooking,
  Role,
  Traveler,
  Trip,
} from './types'
import { useLocalStorage } from './hooks'
import type { LngLat } from './geo'
import { useAuth } from './auth'

/* ═══════════════════════════════════════════════════════════════════════════
   App-wide state: session, the in-progress booking draft, wallet, parcels.
   Deliberately a single context — the app is small enough that splitting
   would cost more in ceremony than it saves in re-renders.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface BookingDraft {
  /** Hub-to-hub (drop at a hub) or P2P (traveler collects from your door). */
  mode: DeliveryMode
  pickupAddress: string
  dropAddress: string
  /** Resolved by geocoding, so the traveler gets a point and not just prose. */
  pickupCoord: LngLat | null
  dropCoord: LngLat | null
  fromCityId: string
  toCityId: string
  originHubId: string | null
  destinationHubId: string | null
  category: string
  size: ParcelSize
  weightKg: number
  declaredValue: number
  fragile: boolean
  insured: boolean
  notes: string
  receiverName: string
  receiverPhone: string
  acceptedProhibited: boolean
  promo: string | null
  paymentMethod: 'upi' | 'card' | 'wallet'
}

export const EMPTY_DRAFT: BookingDraft = {
  mode: 'hub',
  pickupAddress: '',
  dropAddress: '',
  pickupCoord: null,
  dropCoord: null,
  fromCityId: 'blr',
  toCityId: 'mys',
  originHubId: null,
  destinationHubId: null,
  category: 'documents',
  size: 'S',
  weightKg: 1,
  declaredValue: 500,
  fragile: false,
  insured: true,
  notes: '',
  receiverName: '',
  receiverPhone: '',
  acceptedProhibited: false,
  promo: null,
  paymentMethod: 'upi',
}

export interface SessionUser {
  name: string
  phone: string
  email: string
  since: string
}

const MONTH_YEAR: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }

interface AppState {
  /* session */
  user: SessionUser
  role: Role
  setRole: (r: Role) => void
  authed: boolean
  signOut: () => void
  onboarded: boolean
  completeOnboarding: () => void

  /* booking draft */
  draft: BookingDraft
  patchDraft: (patch: Partial<BookingDraft>) => void
  resetDraft: () => void
  price: PriceBreakdown

  /* parcels — one shared ledger across all four portals */
  parcels: Parcel[]
  lastBookedId: string | null
  commitBooking: () => string
  /**
   * Advance a parcel along the custody chain. Every portal calls this, which is
   * what makes the roles a single system: a hub intake is immediately visible
   * to the sender's tracker and removes the parcel from the driver's job feed.
   */
  advanceParcel: (
    id: string,
    to: ParcelStatus,
    detail?: { actor?: string; location?: string; photos?: number; travelerId?: string },
  ) => void

  /* trips — the driver's published rides, shared with the passenger portal */
  trips: Trip[]
  /** Publish a ride, optionally dated days ahead. Returns the new trip id. */
  publishTrip: (t: Omit<Trip, 'id' | 'status' | 'parcelIds'>) => string
  /** Driver taps "Start trip" on the day — moves published → running. */
  startTrip: (id: string) => void
  cancelTrip: (id: string) => void
  /** A passenger takes seats on a trip. Returns the booking id. */
  bookSeats: (tripId: string, seats: number, fare: number, boardingPoint?: string) => string

  /* ride bookings — the passenger side of the same trips */
  rideBookings: RideBooking[]
  advanceRide: (id: string, to: RideBooking['status']) => void
  cancelRide: (id: string) => void

  /* wallet */
  balance: number
  addMoney: (amount: number) => void
  spend: (amount: number) => void
  earn: (amount: number, label: string, sub?: string) => void

  /* notifications */
  notifications: NotificationItem[]
  unread: number
  markAllRead: () => void
  markRead: (id: string) => void
}

const AppContext = createContext<AppState | null>(null)

let bookingCounter = 4870
let tripCounter = 9060
let rideCounter = 3120

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useLocalStorage<Role>('dikkiconnect.role', 'sender')
  const [onboarded, setOnboarded] = useLocalStorage('dikkiconnect.onboarded', false)

  // The session lives in <AuthProvider> — real per-number accounts, so the
  // name on a booking is the name of whoever is actually signed in.
  const { account, authed, signOut } = useAuth()

  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT)

  // Persisted, so the app behaves like an app: book a parcel, close the tab,
  // reopen as the hub manager, and it is still sitting in the intake queue.
  const [parcels, setParcels] = useLocalStorage<Parcel[]>('dikkiconnect.parcels', PARCELS)
  const [lastBookedId, setLastBookedId] = useState<string | null>(null)
  const [trips, setTrips] = useLocalStorage<Trip[]>('dikkiconnect.trips', TRIPS)
  const [rideBookings, setRideBookings] = useLocalStorage<RideBooking[]>(
    'dikkiconnect.rides',
    [],
  )
  const [balance, setBalance] = useLocalStorage('dikkiconnect.balance', 1240)
  const [notifications, setNotifications] = useLocalStorage<NotificationItem[]>(
    'dikkiconnect.notifications',
    NOTIFICATIONS,
  )

  const patchDraft = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  const resetDraft = useCallback(() => setDraft(EMPTY_DRAFT), [])

  const price = useMemo(
    () =>
      quote({
        fromCityId: draft.fromCityId,
        toCityId: draft.toCityId,
        size: draft.size,
        weightKg: draft.weightKg,
        fragile: draft.fragile,
        insured: draft.insured,
        promo: draft.promo,
      }),
    [draft],
  )

  const commitBooking = useCallback(() => {
    const id = `DKC-${++bookingCounter}`
    const now = new Date().toISOString()
    const parcel: Parcel = {
      id,
      mode: draft.mode,
      senderName: account?.name ?? 'You',
      receiverName: draft.receiverName || 'Receiver',
      receiverPhone: draft.receiverPhone || '9000000000',
      fromCityId: draft.fromCityId,
      toCityId: draft.toCityId,
      originHubId: resolveHub(draft.originHubId, draft.fromCityId).id,
      destinationHubId: resolveHub(draft.destinationHubId, draft.toCityId).id,
      pickupAddress: draft.mode === 'p2p' ? draft.pickupAddress : undefined,
      dropAddress: draft.mode === 'p2p' ? draft.dropAddress : undefined,
      category: draft.category,
      size: draft.size,
      weightKg: draft.weightKg,
      declaredValue: draft.declaredValue,
      fragile: draft.fragile,
      notes: draft.notes,
      status: 'booked',
      bookedAt: now,
      etaAt: new Date(Date.now() + 20 * 3_600_000).toISOString(),
      price: price.total,
      timeline: newTimeline(draft.mode, now),
    }

    setParcels((p) => [parcel, ...p])
    setLastBookedId(id)
    if (draft.paymentMethod === 'wallet') setBalance((b) => Math.max(0, b - price.total))

    setNotifications((n) => [
      {
        id: `n-${id}`,
        title: 'Booking confirmed',
        body: `${id} is booked. Drop it at your chosen hub within 24 hours.`,
        at: now,
        read: false,
        kind: 'parcel',
        href: `/sender/track/${id}`,
      },
      ...n,
    ])

    return id
  }, [account, draft, price.total, setParcels, setBalance, setNotifications])

  /* ── Custody chain ─────────────────────────────────────────────────────
     Marks every timeline node up to `to` as done, stamping the one that just
     completed. Portals only ever declare the new status; the ledger owns how
     the parcel's history is written.                                        */
  const advanceParcel = useCallback<AppState['advanceParcel']>(
    (id, to, detail = {}) => {
      const now = new Date().toISOString()

      setParcels((list) =>
        list.map((p) => {
          if (p.id !== id) return p

          const target = p.timeline.findIndex((e) => e.status === to)
          if (target === -1) return p

          return {
            ...p,
            status: to,
            travelerId: detail.travelerId ?? p.travelerId,
            timeline: p.timeline.map((e, i) =>
              i > target
                ? e
                : {
                    ...e,
                    done: true,
                    at: e.at ?? (i === target ? now : now),
                    ...(i === target
                      ? {
                          actor: detail.actor ?? e.actor,
                          location: detail.location ?? e.location,
                          photos: detail.photos ?? e.photos,
                          otpVerified: to !== 'assigned' ? true : e.otpVerified,
                        }
                      : {}),
                  },
            ),
          }
        }),
      )

      const COPY: Partial<Record<ParcelStatus, { title: string; body: string }>> = {
        at_origin_hub: { title: 'Parcel received at hub', body: `${id} is logged and waiting for a traveler.` },
        assigned: { title: 'Traveler assigned', body: `${id} has been picked up by a verified traveler.` },
        in_transit: { title: 'On the way', body: `${id} has left the origin hub.` },
        at_destination_hub: { title: 'Ready for pickup', body: `${id} has arrived. Receiver OTP sent.` },
        delivered: { title: 'Delivered', body: `${id} was collected. Delivery loop closed.` },
      }
      const copy = COPY[to]
      if (copy) {
        setNotifications((n) => [
          { id: `n-${id}-${to}`, ...copy, at: now, read: false, kind: 'parcel' as const, href: `/sender/track/${id}` },
          ...n,
        ])
      }
    },
    [setParcels, setNotifications],
  )

  /* ── Trips ─────────────────────────────────────────────────────────────
     A ride published here is immediately searchable in the passenger portal —
     the two roles read the same list, which is what makes "post in advance"
     mean something rather than just showing a toast.                        */
  const publishTrip = useCallback<AppState['publishTrip']>(
    (t) => {
      const id = `TRP-${++tripCounter}`
      setTrips((list) => [{ ...t, id, status: 'published', parcelIds: [] }, ...list])
      setNotifications((n) => [
        {
          id: `n-${id}`,
          title: 'Ride published',
          body: `Your ${new Date(t.departAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          })} ride is live. We'll notify you as seats and parcels come in.`,
          at: new Date().toISOString(),
          read: false,
          kind: 'ride' as const,
          href: '/traveler/trips',
        },
        ...n,
      ])
      return id
    },
    [setTrips, setNotifications],
  )

  const startTrip = useCallback(
    (id: string) =>
      setTrips((list) => list.map((t) => (t.id === id ? { ...t, status: 'running' } : t))),
    [setTrips],
  )

  const cancelTrip = useCallback(
    (id: string) => setTrips((list) => list.filter((t) => t.id !== id)),
    [setTrips],
  )

  const bookSeats = useCallback<AppState['bookSeats']>(
    (tripId, seats, fare, boardingPoint = 'Silk Board junction') => {
      const id = `RDE-${++rideCounter}`
      setTrips((list) =>
        list.map((t) =>
          t.id === tripId ? { ...t, seatsLeft: Math.max(0, t.seatsLeft - seats) } : t,
        ),
      )
      setRideBookings((list) => [
        {
          id,
          tripId,
          seats,
          fare,
          boardingPoint,
          // The code the driver checks at the kerb, derived from the booking so
          // it is stable across reloads.
          boardingOtp: otpFor(id + 'board'),
          status: 'upcoming',
        },
        ...list,
      ])
      setNotifications((n) => [
        {
          id: `n-${id}`,
          title: 'Seat confirmed',
          body: `${seats} seat${seats > 1 ? 's' : ''} booked. Your boarding OTP is ready.`,
          at: new Date().toISOString(),
          read: false,
          kind: 'ride' as const,
          href: `/passenger/boarding/${tripId}`,
        },
        ...n,
      ])
      return id
    },
    [setTrips, setRideBookings, setNotifications],
  )

  const advanceRide = useCallback<AppState['advanceRide']>(
    (id, to) =>
      setRideBookings((list) => list.map((r) => (r.id === id ? { ...r, status: to } : r))),
    [setRideBookings],
  )

  const cancelRide = useCallback<AppState['cancelRide']>(
    (id) =>
      setRideBookings((list) =>
        list.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)),
      ),
    [setRideBookings],
  )

  const value = useMemo<AppState>(
    () => ({
      user: {
        name: account?.name ?? 'Guest',
        phone: account?.phone ?? '',
        email: account?.email ?? '',
        since: account
          ? new Date(account.createdAt).toLocaleDateString('en-IN', MONTH_YEAR)
          : '—',
      },
      role,
      setRole,
      authed,
      signOut,
      onboarded,
      completeOnboarding: () => setOnboarded(true),

      draft,
      patchDraft,
      resetDraft,
      price,

      parcels,
      lastBookedId,
      commitBooking,
      advanceParcel,

      trips,
      publishTrip,
      startTrip,
      cancelTrip,
      bookSeats,

      rideBookings,
      advanceRide,
      cancelRide,

      balance,
      addMoney: (a: number) => setBalance((b) => b + a),
      spend: (a: number) => setBalance((b) => Math.max(0, b - a)),
      earn: (a: number, label: string, sub?: string) => {
        setBalance((b) => b + a)
        setNotifications((n) => [
          {
            id: `n-earn-${Date.now()}`,
            title: label,
            body: sub ?? `₹${a} credited to your wallet.`,
            at: new Date().toISOString(),
            read: false,
            kind: 'payment' as const,
            href: '/wallet',
          },
          ...n,
        ])
      },

      notifications,
      unread: notifications.filter((n) => !n.read).length,
      markAllRead: () => setNotifications((n) => n.map((x) => ({ ...x, read: true }))),
      markRead: (id: string) =>
        setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x))),
    }),
    [
      account,
      role,
      setRole,
      authed,
      signOut,
      onboarded,
      setOnboarded,
      draft,
      patchDraft,
      resetDraft,
      price,
      parcels,
      lastBookedId,
      commitBooking,
      advanceParcel,
      trips,
      publishTrip,
      startTrip,
      cancelTrip,
      bookSeats,
      rideBookings,
      advanceRide,
      cancelRide,
      balance,
      setBalance,
      notifications,
      setNotifications,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cross-portal selectors. Each portal sees the same ledger through its own
   lens, so work done in one shows up in the others without any sync step.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Parcels physically sitting on a hub's shelves, oldest first. */
export function useHubInventory(hubId?: string) {
  const { parcels } = useApp()
  return useMemo(
    () =>
      parcels
        .filter(
          (p) =>
            p.mode === 'hub' &&
            (p.status === 'at_origin_hub' || p.status === 'assigned') &&
            (!hubId || p.originHubId === hubId),
        )
        .sort((a, b) => +new Date(a.bookedAt) - +new Date(b.bookedAt)),
    [parcels, hubId],
  )
}

/** Booked but not yet dropped — the hub's expected-intake queue. */
export function useAwaitingIntake(hubId?: string) {
  const { parcels } = useApp()
  return useMemo(
    () =>
      parcels.filter(
        (p) => p.mode === 'hub' && p.status === 'booked' && (!hubId || p.originHubId === hubId),
      ),
    [parcels, hubId],
  )
}

/** Parcels awaiting collection by their receiver. */
export function useAwaitingPickup(hubId?: string) {
  const { parcels } = useApp()
  return useMemo(
    () =>
      parcels.filter(
        (p) =>
          p.mode === 'hub' &&
          p.status === 'at_destination_hub' &&
          (!hubId || p.destinationHubId === hubId),
      ),
    [parcels, hubId],
  )
}

/** Unassigned parcels a driver can pick up — the live job feed. */
export function useOpenJobs() {
  const { parcels } = useApp()
  return useMemo(
    () =>
      parcels.filter(
        (p) =>
          !p.travelerId &&
          (p.mode === 'p2p' ? p.status === 'booked' : p.status === 'at_origin_hub'),
      ),
    [parcels],
  )
}

/** Parcels currently in a driver's custody — their manifest. */
export function useManifest(travelerId?: string) {
  const { parcels } = useApp()
  return useMemo(
    () =>
      parcels.filter(
        (p) => p.status === 'in_transit' && (!travelerId || p.travelerId === travelerId),
      ),
    [parcels, travelerId],
  )
}

/** Every ride a driver has published, soonest departure first. */
export function useTrips() {
  const { trips } = useApp()
  return useMemo(
    () => [...trips].sort((a, b) => +new Date(a.departAt) - +new Date(b.departAt)),
    [trips],
  )
}

/** One trip by id, live from the ledger. */
export function useTrip(id?: string) {
  const { trips } = useApp()
  return useMemo(() => trips.find((t) => t.id === id), [trips, id])
}

/**
 * A driver's own rides split by where they are in their life cycle. Scheduled
 * rides are the ones published in advance that have not started yet.
 */
export function useMyTrips(travelerId: string) {
  const trips = useTrips()
  return useMemo(() => {
    const mine = trips.filter((t) => t.travelerId === travelerId)
    return {
      scheduled: mine.filter((t) => t.status === 'published' || t.status === 'draft'),
      running: mine.filter((t) => t.status === 'running'),
      completed: mine.filter((t) => t.status === 'completed'),
      all: mine,
    }
  }, [trips, travelerId])
}

/**
 * The signed-in person as a driver. Identity (name, phone) comes from their
 * account; vehicle, rating and trip history come from the driver record, which
 * is what a real KYC + RC verification would populate.
 */
export function useMe(): Traveler {
  const { account } = useAuth()
  return useMemo(
    () => ({
      ...TRAVELERS[0],
      // The id stays the fixture's: it is the key the seeded trips, manifests
      // and payout history hang off, so a new sign-in inherits a populated
      // portal rather than an empty one. Everything the user sees is theirs.
      name: account?.name ?? TRAVELERS[0].name,
      phone: account?.phone ?? TRAVELERS[0].phone,
    }),
    [account],
  )
}

/**
 * The passenger's rides, split by whether they are still ahead of them.
 * A ride is "past" once it is completed or cancelled, or once its trip has
 * already arrived — otherwise a booked seat would sit in Upcoming forever.
 */
export function useMyRides() {
  const { rideBookings, trips } = useApp()
  return useMemo(() => {
    const withTrip = rideBookings
      .map((r) => ({ ride: r, trip: trips.find((t) => t.id === r.tripId) }))
      .filter((x): x is { ride: RideBooking; trip: Trip } => Boolean(x.trip))

    const done = (x: { ride: RideBooking; trip: Trip }) =>
      x.ride.status === 'completed' ||
      x.ride.status === 'cancelled' ||
      new Date(x.trip.arriveAt).getTime() < Date.now()

    return {
      upcoming: withTrip
        .filter((x) => !done(x))
        .sort((a, b) => +new Date(a.trip.departAt) - +new Date(b.trip.departAt)),
      past: withTrip
        .filter(done)
        .sort((a, b) => +new Date(b.trip.departAt) - +new Date(a.trip.departAt)),
    }
  }, [rideBookings, trips])
}

/** One ride booking for a given trip, if the passenger has one. */
export function useRideForTrip(tripId?: string) {
  const { rideBookings } = useApp()
  return useMemo(
    () => rideBookings.find((r) => r.tripId === tripId && r.status !== 'cancelled'),
    [rideBookings, tripId],
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { newTimeline, quote, hubShort, resolveHub, type PriceBreakdown } from './data'
import type {
  DeliveryMode,
  NotificationItem,
  Parcel,
  ParcelSize,
  ParcelStatus,
  RideBooking,
  Role,
  Trip,
  WalletTxn,
} from './types'
import { useLocalStorage } from './hooks'
import { parcels as parcelsApi, rides as ridesApi, wallet as walletApi, type ServerParcel } from './api'
import {
  type RecentPlace,
  type SavedPlace,
  findSaved,
  newPlaceId,
  pushRecent,
} from './places'
import type { LngLat } from './geo'
import { useAuth } from './auth'
import { parcelNotification, rideNotification, stamp } from './notifications'
import { cancelScheduled, deliver, scheduleFor } from './push'

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
  /* Flat and landmark are kept apart from the geocoded line: no lookup can
     supply them, and re-pinning the map must never wipe them. */
  pickupFlat: string
  pickupLandmark: string
  dropFlat: string
  dropLandmark: string
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
  /* 'link' is a real gateway payment: the server issues a URL, the payer
     settles in their own bank app, and a signed webhook is what marks the
     parcel paid. The other three are pre-gateway and say so on screen. */
  paymentMethod: 'upi' | 'card' | 'wallet' | 'link'
}

export const EMPTY_DRAFT: BookingDraft = {
  mode: 'hub',
  pickupAddress: '',
  dropAddress: '',
  pickupFlat: '',
  pickupLandmark: '',
  dropFlat: '',
  dropLandmark: '',
  pickupCoord: null,
  dropCoord: null,
  /* Empty on purpose: nothing is booked by default. See BookRoute. */
  fromCityId: '',
  toCityId: '',
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
  /** Books on the server. Throws ApiError — the caller must show it. */
  commitBooking: () => Promise<string>
  /**
   * Advance a parcel along the custody chain. Every portal calls this, which is
   * what makes the roles a single system: a hub intake is immediately visible
   * to the sender's tracker and removes the parcel from the driver's job feed.
   */
  advanceParcel: (
    id: string,
    to: ParcelStatus,
    detail?: {
      actor?: string
      location?: string
      photos?: number
      travelerId?: string
      travelerName?: string
    },
  ) => void
  /**
   * Takes the server's word for where a parcel is, after a custody checkpoint
   * has been passed. The server decides whether it moved — this projects that
   * verdict onto the local view every portal reads.
   */
  adoptParcel: (parcel: ServerParcel) => void
  /** True while the first load from the server is in flight. */
  parcelsLoading: boolean

  /* trips — on the server: a trip published by one account is immediately
     visible to every other account's search, not just this device's cache */
  trips: Trip[]
  tripsLoading: boolean
  /** Publishes on the server. Throws ApiError — the caller must show it. */
  publishTrip: (
    t: Pick<
      Trip,
      'fromCityId' | 'toCityId' | 'departAt' | 'arriveAt' | 'seatsTotal' | 'farePerSeat' | 'vehicle'
    > & { bootSlots?: Trip['bootSlots']; viaStops?: string[] },
  ) => Promise<Trip>
  /** Driver sets off: published → running, verified on the server. */
  startTrip: (id: string) => Promise<void>
  cancelTrip: (id: string) => Promise<void>
  /** A passenger takes seats on a trip. The server decides who got there first. */
  bookSeats: (
    tripId: string,
    seats: number,
    opts?: { boardingPoint?: string; payWithWallet?: boolean },
  ) => Promise<RideBooking>
  /** Caches a trip this device has not seen before — the search/detail path. */
  adoptTrip: (trip: Trip) => void

  /* ride bookings — the passenger side of the same trips */
  rideBookings: RideBooking[]
  cancelRide: (id: string) => Promise<void>

  /* wallet — a real per-account server balance, not a per-device guess. Still
     not a payment system: nothing here moves real money (see Wallet.tsx). */
  balance: number
  walletTxns: WalletTxn[]
  addMoney: (amount: number) => Promise<void>
  /** Debits the wallet for something paid by wallet — a ride or a parcel. */
  spend: (amount: number, label: string, sub?: string) => Promise<void>
  /** A parcel-side payout landing — hub handling fees, delivery payouts.
   *  Not yet wired to the server ledger; still a local number that goes up. */
  earn: (amount: number, label: string, sub?: string) => void

  /* notifications */
  notifications: NotificationItem[]
  unread: number
  markAllRead: () => void
  markRead: (id: string) => void

  /* address book — shared, so a pickup field and a drop field on the same
     screen are looking at one list rather than two copies of it */
  places: SavedPlace[]
  /** Creates or updates by id, and returns the stored place either way. */
  savePlace: (p: Omit<SavedPlace, 'id' | 'createdAt'> & { id?: string }) => SavedPlace
  removePlace: (id: string) => void
  /** Marks a place as just-used, which is what floats it up the list. */
  touchPlace: (id: string) => void

  recents: RecentPlace[]
  rememberRecent: (r: Omit<RecentPlace, 'at'>) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useLocalStorage<Role>('waypool.role', 'sender')
  const [onboarded, setOnboarded] = useLocalStorage('waypool.onboarded', false)

  // The session lives in <AuthProvider> — real per-number accounts, so the
  // name on a booking is the name of whoever is actually signed in.
  const { account, authed, signOut } = useAuth()

  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT)

  /* ── Nothing is seeded any more ──────────────────────────────────────────
     These used to start from the demo fixtures in data.ts: five parcels, a
     couple of trips, a page of notifications and a ₹1,240 wallet. That was
     right when the app was a front end with nobody behind it — it gave every
     screen something to draw.

     It is wrong the moment a real person signs in. A tester's first screen
     showed parcels addressed to strangers, a traveller called Arjun Menon
     carrying something to Mysore, and money they had never added. It reads as
     somebody else's account, and worse, once they book a real parcel it sits
     in the same list with the same styling as the invented ones, so there is
     no way to tell which of them is true.

     Empty is the honest first screen, and every one of these lists already has
     a designed empty state. The server fills them in. */
  const [parcels, setParcels] = useLocalStorage<Parcel[]>('waypool.parcels', [])
  const [lastBookedId, setLastBookedId] = useState<string | null>(null)
  /* Trips, bookings and the wallet balance are all server truth now — these
     are a cache of the last server answer, not the record itself. Starting
     empty/zero is still right: it is what a reinstall should show until the
     sync effect below has had its first round trip. */
  const [trips, setTrips] = useLocalStorage<Trip[]>('waypool.trips', [])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [rideBookings, setRideBookings] = useLocalStorage<RideBooking[]>(
    'waypool.rides',
    [],
  )
  const [balance, setBalance] = useLocalStorage('waypool.balance', 0)
  const [walletTxns, setWalletTxns] = useLocalStorage<WalletTxn[]>('waypool.wallettxns', [])
  const [notifications, setNotifications] = useLocalStorage<NotificationItem[]>(
    'waypool.notifications',
    [],
  )
  const [places, setPlaces] = useLocalStorage<SavedPlace[]>('waypool.places', [])
  const [recents, setRecents] = useLocalStorage<RecentPlace[]>('waypool.recents', [])

  /* ── Address book ──────────────────────────────────────────────────────── */

  const savePlace = useCallback(
    (input: Omit<SavedPlace, 'id' | 'createdAt'> & { id?: string }) => {
      const now = new Date().toISOString()
      let stored!: SavedPlace

      setPlaces((list) => {
        const existing = input.id
          ? list.find((p) => p.id === input.id)
          : findSaved(list, input.coord)

        stored = existing
          ? { ...existing, ...input, id: existing.id, createdAt: existing.createdAt, lastUsedAt: now }
          : { ...input, id: newPlaceId(), createdAt: now, lastUsedAt: now }

        /* Home and Work are singular by definition. Re-labelling an address as
           Home demotes whichever one held it, rather than leaving two. */
        const demoted =
          stored.label === 'other'
            ? list
            : list.map((p) =>
                p.id !== stored.id && p.label === stored.label ? { ...p, label: 'other' as const } : p,
              )

        return existing
          ? demoted.map((p) => (p.id === stored.id ? stored : p))
          : [...demoted, stored]
      })

      return stored
    },
    [setPlaces],
  )

  const removePlace = useCallback(
    (id: string) => setPlaces((list) => list.filter((p) => p.id !== id)),
    [setPlaces],
  )

  const touchPlace = useCallback(
    (id: string) =>
      setPlaces((list) =>
        list.map((p) => (p.id === id ? { ...p, lastUsedAt: new Date().toISOString() } : p)),
      ),
    [setPlaces],
  )

  const rememberRecent = useCallback(
    (r: Omit<RecentPlace, 'at'>) =>
      setRecents((list) => pushRecent(list, { ...r, at: new Date().toISOString() })),
    [setRecents],
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

  /* The booking is made on the server, not here.
     
     This used to mint an id locally and push a parcel into localStorage, which
     is why a sender and a traveller could never see the same thing. The server
     now owns the id, the price and the status: it is the only party that can
     tell a hub a parcel is coming. A failure is thrown rather than swallowed —
     a booking that "worked" offline is somebody standing at a hub holding a
     parcel the network has never heard of. */
  const commitBooking = useCallback(async () => {
    const originHubId = resolveHub(draft.originHubId, draft.fromCityId).id
    const destinationHubId = resolveHub(draft.destinationHubId, draft.toCityId).id

    const created = await parcelsApi.create({
      mode: draft.mode,
      receiverName: draft.receiverName.trim(),
      /* No invented fallback. The form will not let a booking through without
         a name, and a blank number is better on a parcel than a made-up one. */
      receiverPhone: draft.receiverPhone.replace(/\D/g, ''),
      fromCityId: draft.fromCityId,
      toCityId: draft.toCityId,
      originHubId,
      destinationHubId,
      pickupAddress: draft.mode === 'p2p' ? draft.pickupAddress : undefined,
      dropAddress: draft.mode === 'p2p' ? draft.dropAddress : undefined,
      category: draft.category,
      size: draft.size,
      weightKg: draft.weightKg,
      declaredValue: draft.declaredValue,
      fragile: draft.fragile,
      insured: draft.insured,
      notes: draft.notes,
      promo: draft.promo,
    })

    const id = created.parcel.id
    const now = created.parcel.bookedAt as string
    const parcel: Parcel = {
      id,
      mode: draft.mode,
      senderName: account?.name ?? 'You',
      receiverName: draft.receiverName.trim(),
      /* No invented fallback. The form will not let a booking through without
         a name, and a blank number is better on a parcel than a made-up one. */
      receiverPhone: draft.receiverPhone.replace(/\D/g, ''),
      fromCityId: draft.fromCityId,
      toCityId: draft.toCityId,
      originHubId,
      destinationHubId,
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
      etaAt: created.parcel.etaAt as string,
      /* The server's price, not the form's estimate. If they disagree the
         server is right, and the user is charged what it says. */
      price: created.parcel.price,
      timeline: newTimeline(draft.mode, now),
    }

    setParcels((p) => [parcel, ...p])
    setLastBookedId(id)
    if (draft.paymentMethod === 'wallet') {
      try {
        await walletApi.spend(created.parcel.price, 'Parcel booked', id)
        const w = await walletApi.get()
        setBalance(w.balance)
        setWalletTxns(w.txns)
      } catch {
        /* Parcel payment is not gated on this yet — the booking already
           succeeded above, and a wallet debit failing here must not undo it. */
      }
    }

    const booked = parcelNotification('booked', id, hubShort(parcel.originHubId))
    if (booked) {
      const item = stamp(booked, `n-${id}`, now)
      setNotifications((n) => [item, ...n])
      deliver(item)
    }
    /* The drop-off window is 24 hours. Two reminders from the OS, whether or
       not the app is open: one with four hours left, one with one. Cancelled
       by the hub's intake scan (see advanceParcel). */
    if (draft.mode === 'hub') {
      const hub = hubShort(parcel.originHubId)
      const t0 = Date.parse(now)
      scheduleFor(
        new Date(t0 + 20 * 3_600_000),
        stamp(
          { kind: 'parcel', tier: 'contextual', title: 'Four hours left to drop it off', body: `${id} is still expected at ${hub}. After the window closes the slot is released.`, href: `/sender/qr/${id}` },
          `n-${id}-remind-4h`,
        ),
      )
      scheduleFor(
        new Date(t0 + 23 * 3_600_000),
        stamp(
          { kind: 'parcel', tier: 'critical', title: 'One hour left', body: `${id} needs to be at ${hub} within the hour, or the booking lapses.`, href: `/sender/qr/${id}` },
          `n-${id}-remind-1h`,
        ),
      )
    }

    return id
  }, [account, draft, setParcels, setBalance, setWalletTxns, setNotifications])

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
            travelerName: detail.travelerName ?? p.travelerName,
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

      const draft = parcelNotification(to, id)
      if (draft) {
        const item = stamp(draft, `n-${id}-${to}`, now)
        setNotifications((n) => [item, ...n])
        deliver(item)
      }
      if (to === 'at_origin_hub') void cancelScheduled([`n-${id}-remind-4h`, `n-${id}-remind-1h`])
    },
    [setParcels, setNotifications],
  )

  /* The server has just said a checkpoint was passed. Its status is the fact;
     the local timeline is only how that fact is drawn, so the same projection
     the portals already read is reused rather than a second shape. */
  const adoptParcel = useCallback<AppState['adoptParcel']>(
    (server) => {
      const last = server.timeline.at(-1) as
        | { actor?: string; location?: string; photos?: number }
        | undefined

      /* Insert first if this device has never seen the parcel.

         A hub worker is neither the sender nor the carrier, so a parcel
         arriving at their counter is not in any list they hold. Before this,
         adopting one was a no-op — the update mapped over a list the parcel
         was not in — and the hub portal could not act on anything a tester
         had booked on another phone. The timeline is rebuilt locally from the
         mode and then advanced to wherever the server says it is. */
      setParcels((list) => {
        if (list.some((p) => p.id === server.id)) return list
        const fresh = {
          ...(server as unknown as Parcel),
          timeline: newTimeline(
            (server.mode as DeliveryMode) ?? 'hub',
            String(server.bookedAt ?? new Date().toISOString()),
          ),
        }
        return [fresh, ...list]
      })

      advanceParcel(server.id, server.status as ParcelStatus, {
        actor: last?.actor,
        location: last?.location,
        photos: last?.photos,
        travelerId: typeof server.travelerId === 'string' ? server.travelerId : undefined,
        travelerName: typeof server.travelerName === 'string' ? server.travelerName : undefined,
      })
    },
    [advanceParcel, setParcels],
  )

  /* ── What this account actually has ──────────────────────────────────────
     The list starts empty and is filled from the server, which is what makes
     a reinstall — or a second phone — show the same parcels rather than a
     fresh empty world.

     A failure here is deliberately quiet: the person keeps whatever the app
     already had, and the screens that act on a parcel fail loudly at the
     point of acting. Shouting on launch about a list that could not refresh
     teaches people to dismiss the one message that matters. */
  const [parcelsLoading, setParcelsLoading] = useState(false)
  useEffect(() => {
    if (!authed) return
    let cancelled = false
    setParcelsLoading(true)
    parcelsApi
      .mine()
      .then(({ sent, carrying }) => {
        if (cancelled) return
        const fromServer = [...sent, ...carrying]
        if (!fromServer.length) return
        setParcels((local) => {
          const byId = new Map(local.map((p) => [p.id, p]))
          for (const s of fromServer) {
            const existing = byId.get(s.id)
            byId.set(s.id, {
              ...(existing ?? (s as unknown as Parcel)),
              status: s.status as ParcelStatus,
              price: s.price,
              travelerId: typeof s.travelerId === 'string' ? s.travelerId : existing?.travelerId,
              travelerName:
                typeof s.travelerName === 'string' ? s.travelerName : existing?.travelerName,
            })
          }
          return [...byId.values()].sort((a, b) => +new Date(b.bookedAt) - +new Date(a.bookedAt))
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setParcelsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authed, setParcels])

  /* ── Trips ─────────────────────────────────────────────────────────────
     A ride published on the server is immediately searchable from any other
     device's passenger portal — the two roles read the same record, which is
     what makes "post in advance" mean something rather than just a toast that
     this phone remembers and nobody else's does. */
  const adoptTrip = useCallback<AppState['adoptTrip']>(
    (trip) =>
      setTrips((list) => {
        const i = list.findIndex((t) => t.id === trip.id)
        if (i === -1) return [trip, ...list]
        const next = [...list]
        next[i] = trip
        return next
      }),
    [setTrips],
  )

  const publishTrip = useCallback<AppState['publishTrip']>(
    async (t) => {
      const { trip } = await ridesApi.publish(t)
      adoptTrip(trip)
      setNotifications((n) => [
        {
          id: `n-${trip.id}`,
          title: 'Ride published',
          body: `Your ${new Date(trip.departAt).toLocaleDateString('en-IN', {
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
      return trip
    },
    [adoptTrip, setNotifications],
  )

  const startTrip = useCallback(
    async (id: string) => {
      const { trip } = await ridesApi.start(id)
      adoptTrip(trip)
    },
    [adoptTrip],
  )

  const refreshWallet = useCallback(async () => {
    try {
      const w = await walletApi.get()
      setBalance(w.balance)
      setWalletTxns(w.txns)
    } catch {
      /* Best-effort — the action that triggered this already succeeded. */
    }
  }, [setBalance, setWalletTxns])

  const cancelTrip = useCallback(
    async (id: string) => {
      await ridesApi.cancelTrip(id)
      setTrips((list) => list.map((t) => (t.id === id ? { ...t, status: 'cancelled' } : t)))
      void refreshWallet() // any wallet-paid seats on this trip were just refunded
    },
    [setTrips, refreshWallet],
  )

  const bookSeats = useCallback<AppState['bookSeats']>(
    async (tripId, seats, opts = {}) => {
      const { booking, trip } = await ridesApi.book({
        tripId,
        seats,
        boardingPoint: opts.boardingPoint,
        payWithWallet: opts.payWithWallet,
      })
      adoptTrip(trip)
      setRideBookings((list) => [booking, ...list])
      if (opts.payWithWallet) void refreshWallet()
      const confirmed = rideNotification('upcoming', tripId)
      if (confirmed) {
        const item = stamp(confirmed, `n-${booking.id}`)
        setNotifications((n) => [item, ...n])
        deliver(item)
      }
      return booking
    },
    [adoptTrip, setRideBookings, setNotifications, refreshWallet],
  )

  const cancelRide = useCallback<AppState['cancelRide']>(
    async (id) => {
      await ridesApi.cancelBooking(id)
      setRideBookings((list) =>
        list.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)),
      )
      void refreshWallet() // a wallet-paid seat is refunded on cancellation
    },
    [setRideBookings, refreshWallet],
  )

  /* What this account has actually published or booked. Same shape as the
     parcels sync above: starts from whatever this device cached, refreshed
     from the server, quiet on failure because the screens that act on a
     trip or booking fail loudly at the point of acting. */
  useEffect(() => {
    if (!authed) return
    let cancelled = false
    setTripsLoading(true)
    ridesApi
      .mine()
      .then(({ published, bookings }) => {
        if (cancelled) return
        setTrips((local) => {
          const byId = new Map(local.map((t) => [t.id, t]))
          for (const t of published) byId.set(t.id, t)
          for (const { trip } of bookings) byId.set(trip.id, trip)
          return [...byId.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        })
        setRideBookings(bookings.map((b) => b.booking))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTripsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authed, setTrips, setRideBookings])

  useEffect(() => {
    if (!authed) return
    let cancelled = false
    walletApi
      .get()
      .then((w) => {
        if (cancelled) return
        setBalance(w.balance)
        setWalletTxns(w.txns)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [authed, setBalance, setWalletTxns])

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
      adoptParcel,
      parcelsLoading,

      trips,
      tripsLoading,
      publishTrip,
      startTrip,
      cancelTrip,
      bookSeats,
      adoptTrip,

      rideBookings,
      cancelRide,

      balance,
      walletTxns,
      addMoney: async (a: number) => {
        await walletApi.topup(a)
        const w = await walletApi.get()
        setBalance(w.balance)
        setWalletTxns(w.txns)
      },
      spend: async (a: number, label: string, sub?: string) => {
        await walletApi.spend(a, label, sub)
        const w = await walletApi.get()
        setBalance(w.balance)
        setWalletTxns(w.txns)
      },
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

      places,
      savePlace,
      removePlace,
      touchPlace,
      recents,
      rememberRecent,
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
      adoptParcel,
      parcelsLoading,
      trips,
      tripsLoading,
      publishTrip,
      startTrip,
      cancelTrip,
      bookSeats,
      adoptTrip,
      rideBookings,
      cancelRide,
      balance,
      walletTxns,
      setBalance,
      setWalletTxns,
      setNotifications,
      notifications,
      places,
      savePlace,
      removePlace,
      touchPlace,
      recents,
      rememberRecent,
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

/**
 * One trip by id. Returns `undefined` while it is still loading and `null`
 * once the server has genuinely said there is no such trip — the two read
 * the same from this device's cache (both falsy), so callers that only
 * cared about "do I have it yet" never had to change, and the ones that do
 * care can tell a brief fetch apart from a dead link.
 *
 * Reused across the passenger screens for the same reason adoptParcel exists
 * for parcels: a trip reached by a direct link or a reinstall is not
 * necessarily one this device has ever fetched before.
 */
export function useTrip(id?: string): Trip | undefined | null {
  const { trips, adoptTrip } = useApp()
  const [notFound, setNotFound] = useState(false)
  const local = useMemo(() => trips.find((t) => t.id === id), [trips, id])

  useEffect(() => {
    if (!id || local) return
    let cancelled = false
    ridesApi
      .one(id)
      .then(({ trip }) => {
        if (!cancelled) adoptTrip(trip)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
    return () => {
      cancelled = true
    }
  }, [id, local, adoptTrip])

  if (local) return local
  return notFound ? null : undefined
}

/**
 * The signed-in person, as the identity a driver or traveler screen reads.
 * Name, phone and KYC tier come from the real account — nothing here is a
 * fixture standing in for them. A screen that needs a vehicle, a rating or a
 * trip count reads those from the real record that actually has them (a
 * published trip, `useMyTrips`), not from here.
 */
export function useMe() {
  const { account } = useAuth()
  return useMemo(
    () => ({
      id: account?.id ?? '',
      name: account?.name ?? 'You',
      phone: account?.phone ?? '',
      kycTier: account?.kycTier ?? ('none' as const),
    }),
    [account],
  )
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
      scheduled: mine.filter((t) => t.status === 'published'),
      running: mine.filter((t) => t.status === 'running'),
      completed: mine.filter((t) => t.status === 'completed'),
      all: mine,
    }
  }, [trips, travelerId])
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

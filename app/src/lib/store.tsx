import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { NOTIFICATIONS, PARCELS, quote, resolveHub, type PriceBreakdown } from './data'
import type { NotificationItem, Parcel, ParcelSize, ParcelStatus, Role } from './types'
import { useLocalStorage } from './hooks'

/* ═══════════════════════════════════════════════════════════════════════════
   App-wide state: session, the in-progress booking draft, wallet, parcels.
   Deliberately a single context — the app is small enough that splitting
   would cost more in ceremony than it saves in re-renders.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface BookingDraft {
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

interface AppState {
  /* session */
  user: SessionUser
  role: Role
  setRole: (r: Role) => void
  authed: boolean
  signIn: (phone: string) => void
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useLocalStorage<Role>('dikkiconnect.role', 'sender')
  const [authed, setAuthed] = useState(false)
  const [onboarded, setOnboarded] = useLocalStorage('dikkiconnect.onboarded', false)
  const [phone, setPhone] = useState('9845067890')

  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT)

  // Persisted, so the app behaves like an app: book a parcel, close the tab,
  // reopen as the hub manager, and it is still sitting in the intake queue.
  const [parcels, setParcels] = useLocalStorage<Parcel[]>('dikkiconnect.parcels', PARCELS)
  const [lastBookedId, setLastBookedId] = useState<string | null>(null)
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
      senderName: 'Aditi Sharma',
      receiverName: draft.receiverName || 'Receiver',
      receiverPhone: draft.receiverPhone || '9000000000',
      fromCityId: draft.fromCityId,
      toCityId: draft.toCityId,
      originHubId: resolveHub(draft.originHubId, draft.fromCityId).id,
      destinationHubId: resolveHub(draft.destinationHubId, draft.toCityId).id,
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
      timeline: [
        {
          id: 'ev-0',
          status: 'booked',
          title: 'Booking confirmed',
          detail: 'Payment received. Drop-off OTP sent to your phone.',
          at: now,
          done: true,
        },
        {
          id: 'ev-1',
          status: 'at_origin_hub',
          title: 'Drop at origin hub',
          detail: 'Hub manager will weigh, photograph and verify your OTP.',
          at: null,
          done: false,
        },
        {
          id: 'ev-2',
          status: 'assigned',
          title: 'Matched with a traveler',
          detail: 'We are finding a verified traveler on your route.',
          at: null,
          done: false,
        },
        {
          id: 'ev-3',
          status: 'in_transit',
          title: 'Picked up · in transit',
          detail: 'Custody moves from hub to traveler.',
          at: null,
          done: false,
        },
        {
          id: 'ev-4',
          status: 'at_destination_hub',
          title: 'Arrives at destination hub',
          detail: 'Receiver OTP is sent once the parcel lands.',
          at: null,
          done: false,
        },
        {
          id: 'ev-5',
          status: 'delivered',
          title: 'Collected by receiver',
          detail: 'Receiver OTP closes the delivery loop.',
          at: null,
          done: false,
        },
      ],
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
  }, [draft, price.total, setParcels, setBalance, setNotifications])

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

  const value = useMemo<AppState>(
    () => ({
      user: {
        name: 'Aditi Sharma',
        phone,
        email: 'aditi.sharma@gmail.com',
        since: 'March 2025',
      },
      role,
      setRole,
      authed,
      signIn: (p: string) => {
        setPhone(p || '9845067890')
        setAuthed(true)
      },
      signOut: () => setAuthed(false),
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
      phone,
      role,
      setRole,
      authed,
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
    () => parcels.filter((p) => p.status === 'booked' && (!hubId || p.originHubId === hubId)),
    [parcels, hubId],
  )
}

/** Parcels awaiting collection by their receiver. */
export function useAwaitingPickup(hubId?: string) {
  const { parcels } = useApp()
  return useMemo(
    () =>
      parcels.filter(
        (p) => p.status === 'at_destination_hub' && (!hubId || p.destinationHubId === hubId),
      ),
    [parcels, hubId],
  )
}

/** Unassigned parcels a driver can pick up — the live job feed. */
export function useOpenJobs() {
  const { parcels } = useApp()
  return useMemo(
    () => parcels.filter((p) => p.status === 'at_origin_hub' && !p.travelerId),
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

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { NOTIFICATIONS, PARCELS, quote, resolveHub, type PriceBreakdown } from './data'
import type { NotificationItem, Parcel, ParcelSize, Role } from './types'
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

  /* parcels */
  parcels: Parcel[]
  lastBookedId: string | null
  commitBooking: () => string

  /* wallet */
  balance: number
  addMoney: (amount: number) => void
  spend: (amount: number) => void

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
  const [parcels, setParcels] = useState<Parcel[]>(PARCELS)
  const [lastBookedId, setLastBookedId] = useState<string | null>(null)
  const [balance, setBalance] = useState(1240)
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS)

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
  }, [draft, price.total])

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

      balance,
      addMoney: (a: number) => setBalance((b) => b + a),
      spend: (a: number) => setBalance((b) => Math.max(0, b - a)),

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
      balance,
      notifications,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

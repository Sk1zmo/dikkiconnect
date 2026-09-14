import type { NotificationItem, ParcelStatus, RideBooking } from './types'

/* ═══════════════════════════════════════════════════════════════════════════
   Notifications — three tiers, one voice, no fatigue.

   Every notification the app raises is built here, from an event, so the
   copy is written once and the tier is never left to whoever wired the
   feature. The tiers decide how loud a thing is allowed to be:

     critical     Custody and money. Somebody is holding your parcel, an OTP
                  is needed, a payment moved. Always delivered, always plain,
                  never batched, never funny. These are the app doing its job.
     contextual   Useful because of where you are or what is about to happen:
                  a pickup window opening, a car posted on a route you asked
                  about, a receiver ready. Delivered while relevant, dropped
                  when stale.
     marketing    Offers and nudges. Off by default (see Settings), capped at
                  one a week, and it is the only tier allowed a bit of charm.

   The screen shows the tier as a colour and a word; a preference per tier
   in Settings gates what is delivered. Delivery itself — live alert in the
   foreground, the OS tray in the background, scheduled reminders — is
   lib/push, which reads `tier` for the channel's priority and sound.
   ═══════════════════════════════════════════════════════════════════════════ */

export type NotificationTier = 'critical' | 'contextual' | 'marketing'

export const TIER_META: Record<NotificationTier, { label: string; hint: string }> = {
  critical: { label: 'Custody', hint: 'Parcels, OTPs and payments — always on' },
  contextual: { label: 'Timely', hint: 'Pickup windows, matches on your route, ETAs' },
  marketing: { label: 'Offers', hint: 'Occasional. Off unless you say otherwise' },
}

export const KIND_TIER: Record<NotificationItem['kind'], NotificationTier> = {
  parcel: 'critical',
  payment: 'critical',
  kyc: 'critical',
  alert: 'critical',
  ride: 'contextual',
  promo: 'marketing',
}

export const tierOf = (n: NotificationItem): NotificationTier => n.tier ?? KIND_TIER[n.kind]

/* ── Events → notifications ─────────────────────────────────────────────── */

type Draft = Omit<NotificationItem, 'id' | 'at' | 'read'>

const PARCEL: Partial<Record<ParcelStatus, (id: string, hub?: string) => Draft>> = {
  booked: (id, hub) => ({
    kind: 'parcel',
    tier: 'critical',
    title: 'Booked — drop it at the hub',
    body: `${id} has a slot. Bring it to ${hub ?? 'your hub'} within 24 hours and show the QR at the counter.`,
    href: `/sender/qr/${id}`,
  }),
  at_origin_hub: (id) => ({
    kind: 'parcel',
    tier: 'critical',
    title: 'At the hub, in our custody',
    body: `${id} is logged, weighed and photographed. A traveler on your route picks it up next.`,
    href: `/sender/track/${id}`,
  }),
  assigned: (id) => ({
    kind: 'parcel',
    tier: 'critical',
    title: 'A traveler has it',
    body: `${id} was handed to a verified traveler — OTP matched, photo taken.`,
    href: `/sender/track/${id}`,
  }),
  in_transit: (id) => ({
    kind: 'parcel',
    tier: 'contextual',
    title: 'On the road',
    body: `${id} has left the city. Watch it move on the map.`,
    href: `/sender/track/${id}`,
  }),
  at_destination_hub: (id, hub) => ({
    kind: 'parcel',
    tier: 'critical',
    title: 'Arrived — receiver OTP sent',
    body: `${id} is at ${hub ?? 'the destination hub'}. The receiver needs their code to collect it.`,
    href: `/sender/track/${id}`,
  }),
  delivered: (id) => ({
    kind: 'parcel',
    tier: 'critical',
    title: 'Delivered',
    body: `${id} was collected, OTP verified. The custody chain is closed and kept.`,
    href: `/sender/track/${id}`,
  }),
  cancelled: (id) => ({
    kind: 'parcel',
    tier: 'critical',
    title: 'Booking cancelled',
    body: `${id} will not travel. Any payment is on its way back to your wallet.`,
    href: `/wallet`,
  }),
}

export function parcelNotification(status: ParcelStatus, id: string, hub?: string): Draft | null {
  return PARCEL[status]?.(id, hub) ?? null
}

const RIDE: Partial<Record<RideBooking['status'], (id: string, when?: string) => Draft>> = {
  upcoming: (id, when) => ({
    kind: 'ride',
    tier: 'critical',
    title: 'Seat confirmed',
    body: `You’re on. ${when ? `Be at the pickup point by ${when}.` : 'Boarding OTP is in the app.'}`,
    href: `/passenger/ride/${id}`,
  }),
  boarding: (id) => ({
    kind: 'ride',
    tier: 'contextual',
    title: 'Your car is 10 minutes out',
    body: 'Head to the pickup point. Have your boarding OTP ready.',
    href: `/passenger/boarding/${id}`,
  }),
  running: (id) => ({
    kind: 'ride',
    tier: 'contextual',
    title: 'On the way',
    body: 'Live trip started. Share it with someone who is expecting you.',
    href: `/passenger/tracking/${id}`,
  }),
  completed: (id) => ({
    kind: 'ride',
    tier: 'contextual',
    title: 'You made it',
    body: 'Fuel split. Rate the drive and your receipt is in the wallet.',
    href: `/passenger/complete/${id}`,
  }),
  cancelled: () => ({
    kind: 'ride',
    tier: 'critical',
    title: 'Ride cancelled',
    body: 'The driver can’t make it. Your fare is back in the wallet; other cars on this route are listed.',
    href: '/passenger',
  }),
}

export function rideNotification(status: RideBooking['status'], id: string, when?: string): Draft | null {
  return RIDE[status]?.(id, when) ?? null
}

export function paymentNotification(kind: 'topup' | 'refund' | 'failed', amount: string): Draft {
  return {
    topup: {
      kind: 'payment' as const,
      tier: 'critical' as const,
      title: 'Money added',
      body: `${amount} is in your wallet.`,
      href: '/wallet',
    },
    refund: {
      kind: 'payment' as const,
      tier: 'critical' as const,
      title: 'Refund received',
      body: `${amount} is back in your wallet.`,
      href: '/wallet',
    },
    failed: {
      kind: 'payment' as const,
      tier: 'critical' as const,
      title: 'Payment didn’t go through',
      body: `${amount} was not charged. Your booking is held for 15 minutes while you try again.`,
      href: '/payment-methods',
    },
  }[kind]
}

/** Stamp a draft as a fresh, unread item. */
export function stamp(draft: Draft, id: string, at = new Date().toISOString()): NotificationItem {
  return { ...draft, id, at, read: false }
}

/* ── Grouping for the inbox ─────────────────────────────────────────────── */

export type Bucket = 'today' | 'yesterday' | 'earlier'

export function bucketOf(iso: string, now = new Date()): Bucket {
  const d = new Date(iso)
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = (day(now) - day(d)) / 86_400_000
  return diff < 1 ? 'today' : diff < 2 ? 'yesterday' : 'earlier'
}

export const BUCKET_LABEL: Record<Bucket, string> = { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier' }

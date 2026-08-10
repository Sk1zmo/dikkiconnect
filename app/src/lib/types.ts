/** Domain model for DikkiConnect — mirrors the PRD's hub-to-hub custody chain. */

export type Role = 'sender' | 'traveler' | 'passenger' | 'hub'

export type ParcelStatus =
  | 'booked'
  | 'at_origin_hub'
  | 'assigned'
  | 'in_transit'
  | 'at_destination_hub'
  | 'delivered'
  | 'cancelled'

export type ParcelSize = 'S' | 'M' | 'L'

export type KycTier = 'none' | 'parcel_only' | 'passenger_ready'

export type KycStepId = 'mobile' | 'aadhaar' | 'selfie' | 'license' | 'rc' | 'bank' | 'police'

export type KycStepStatus = 'verified' | 'pending' | 'action_required' | 'locked'

export interface KycStep {
  id: KycStepId
  label: string
  detail: string
  status: KycStepStatus
  /** Which tier this step unlocks. */
  unlocks: 'parcel_only' | 'passenger_ready' | 'payouts'
  optional?: boolean
}

export interface City {
  id: string
  name: string
  state: string
  hubCount: number
}

export interface Hub {
  id: string
  name: string
  cityId: string
  address: string
  landmark: string
  openFrom: string
  openTo: string
  distanceKm: number
  rating: number
  manager: string
  capacity: number
  held: number
}

export interface Person {
  id: string
  name: string
  phone: string
  rating: number
  trips: number
  avatarTone: number
}

export interface Vehicle {
  id: string
  model: string
  plate: string
  colour: string
  type: 'hatchback' | 'sedan' | 'suv' | 'bike'
  bootCapacityKg: number
  seats: number
}

export interface Traveler extends Person {
  vehicle: Vehicle
  kycTier: KycTier
  verifiedSince: string
  languages: string[]
}

/** One node in the custody chain. `otp` present means a physical handoff. */
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

export interface Parcel {
  id: string
  senderName: string
  receiverName: string
  receiverPhone: string
  fromCityId: string
  toCityId: string
  originHubId: string
  destinationHubId: string
  category: string
  size: ParcelSize
  weightKg: number
  declaredValue: number
  fragile: boolean
  notes?: string
  status: ParcelStatus
  bookedAt: string
  etaAt: string
  price: number
  travelerId?: string
  timeline: TrackingEvent[]
}

export interface Trip {
  id: string
  travelerId: string
  fromCityId: string
  toCityId: string
  departAt: string
  arriveAt: string
  seatsTotal: number
  seatsLeft: number
  bootSlots: ParcelSize[]
  farePerSeat: number
  parcelIds: string[]
  status: 'draft' | 'published' | 'running' | 'completed'
  viaStops: string[]
}

export interface ParcelJob {
  id: string
  parcelId: string
  fromHubId: string
  toHubId: string
  size: ParcelSize
  weightKg: number
  payout: number
  detourKm: number
  expiresAt: string
  category: string
  fragile: boolean
}

export interface RideBooking {
  id: string
  tripId: string
  seats: number
  fare: number
  boardingPoint: string
  boardingOtp: string
  status: 'upcoming' | 'boarding' | 'running' | 'completed' | 'cancelled'
}

export interface WalletTxn {
  id: string
  label: string
  sub: string
  amount: number
  at: string
  kind: 'credit' | 'debit'
  method: 'upi' | 'card' | 'wallet' | 'payout' | 'refund'
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  at: string
  read: boolean
  kind: 'parcel' | 'ride' | 'payment' | 'kyc' | 'promo' | 'alert'
  href?: string
}

export interface ChatMessage {
  id: string
  from: 'me' | 'them' | 'system'
  text: string
  at: string
}

export interface HubInventoryItem {
  parcelId: string
  shelf: string
  intakeAt: string
  state: 'waiting' | 'assigned' | 'delayed' | 'lost'
  assignedTravelerId?: string
}

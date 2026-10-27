import type {
  ChatMessage,
  City,
  DeliveryMode,
  Hub,
  KycStep,
  Parcel,
  ParcelJob,
  ParcelStatus,
  TrackingEvent,
} from './types'
import { hoursFromNow } from './format'
import { HUB_COORDS, cityCoord, haversineKm, hubCoord } from './geo'

/* ═══════════════════════════════════════════════════════════════════════════
   Mock dataset. MVP corridor per the PRD: Bangalore ↔ Mysore, with the
   next-wave corridors stubbed in so search/empty states have something real
   to talk about.
   ═══════════════════════════════════════════════════════════════════════════ */

const CITY_SEED: Array<Omit<City, 'hubCount'>> = [
  { id: 'blr', name: 'Bangalore', state: 'Karnataka' },
  { id: 'mys', name: 'Mysore', state: 'Karnataka' },
  { id: 'mng', name: 'Mangalore', state: 'Karnataka' },
  { id: 'hbl', name: 'Hubballi', state: 'Karnataka' },
  { id: 'cbe', name: 'Coimbatore', state: 'Tamil Nadu' },
  { id: 'che', name: 'Chennai', state: 'Tamil Nadu' },
  { id: 'hyd', name: 'Hyderabad', state: 'Telangana' },
  { id: 'goa', name: 'Goa', state: 'Goa' },
]

/**
 * Every hub on the network.
 *
 * Each id here is also its key in `HUB_COORDS`, and the two lists are checked
 * against each other below. A hub that exists in one and not the other used to
 * fail silently — it rendered at the centre of its city, several kilometres
 * from where it actually is, and nothing said so.
 *
 * `distanceKm` is measured from the hub's own city centre rather than invented.
 * It is only the fallback shown before the app knows where the user is
 * standing; once it does, `rankHubs` replaces it with the real distance.
 */
const HUB_SEED: Array<Omit<Hub, 'distanceKm'>> = [
  /* ── Bangalore ─────────────────────────────────────────────────────────── */
  {
    id: 'hub-blr-kor',
    name: 'WayPool Hub · Koramangala',
    cityId: 'blr',
    address: '80 Feet Rd, 4th Block, Koramangala',
    landmark: 'Next to Sony World Signal',
    openFrom: '7:00 AM',
    openTo: '10:00 PM',
    rating: 4.8,
    manager: 'Ravi Shetty',
    capacity: 120,
    held: 38,
  },
  {
    id: 'hub-blr-ind',
    name: 'WayPool Hub · Indiranagar',
    cityId: 'blr',
    address: '100 Feet Rd, Indiranagar',
    landmark: 'Opposite CMH Road Junction',
    openFrom: '7:30 AM',
    openTo: '10:30 PM',
    rating: 4.7,
    manager: 'Nikhil Bhat',
    capacity: 100,
    held: 44,
  },
  {
    id: 'hub-blr-whf',
    name: 'WayPool Hub · Whitefield',
    cityId: 'blr',
    address: 'ITPL Main Rd, Whitefield',
    landmark: 'Beside Forum Value Mall',
    openFrom: '7:00 AM',
    openTo: '10:00 PM',
    rating: 4.5,
    manager: 'Anitha Reddy',
    capacity: 110,
    held: 61,
  },
  {
    id: 'hub-blr-jay',
    name: 'WayPool Hub · Jayanagar',
    cityId: 'blr',
    address: '11th Main, 4th Block, Jayanagar',
    landmark: 'Above Sri Krishna Stores',
    openFrom: '8:00 AM',
    openTo: '9:00 PM',
    rating: 4.9,
    manager: 'Lakshmi Rao',
    capacity: 60,
    held: 12,
  },
  {
    id: 'hub-blr-hbr',
    name: 'WayPool Hub · Hebbal',
    cityId: 'blr',
    address: 'Bellary Rd, Hebbal',
    landmark: 'Under the Hebbal Flyover',
    openFrom: '6:30 AM',
    openTo: '11:00 PM',
    rating: 4.4,
    manager: 'Imran Pasha',
    capacity: 95,
    held: 52,
  },
  {
    id: 'hub-blr-ele',
    name: 'WayPool Hub · Electronic City',
    cityId: 'blr',
    address: 'Phase 1, Hosur Rd, Electronic City',
    landmark: 'Inside HP Petrol Pump',
    openFrom: '6:30 AM',
    openTo: '11:00 PM',
    rating: 4.6,
    manager: 'Prakash N.',
    capacity: 90,
    held: 24,
  },

  /* ── Mysore ────────────────────────────────────────────────────────────── */
  {
    id: 'hub-mys-sar',
    name: 'WayPool Hub · Saraswathipuram',
    cityId: 'mys',
    address: '5th Main, Saraswathipuram, Mysore',
    landmark: 'Opposite Ayyappa Temple',
    openFrom: '7:30 AM',
    openTo: '9:30 PM',
    rating: 4.7,
    manager: 'Suresh Gowda',
    capacity: 80,
    held: 19,
  },
  {
    id: 'hub-mys-vij',
    name: 'WayPool Hub · Vijayanagar',
    cityId: 'mys',
    address: '2nd Stage, Vijayanagar, Mysore',
    landmark: 'Beside Ring Road Junction',
    openFrom: '8:00 AM',
    openTo: '10:00 PM',
    rating: 4.5,
    manager: 'Deepa Kulkarni',
    capacity: 70,
    held: 31,
  },
  {
    id: 'hub-mys-nan',
    name: 'WayPool Hub · Nanjangud Road',
    cityId: 'mys',
    address: 'Nanjangud Rd, Bannimantap, Mysore',
    landmark: 'Near the APMC Yard gate',
    openFrom: '7:00 AM',
    openTo: '9:00 PM',
    rating: 4.3,
    manager: 'Mahesh Urs',
    capacity: 55,
    held: 9,
  },

  /* ── Mangalore ─────────────────────────────────────────────────────────── */
  {
    id: 'hub-mng-hmp',
    name: 'WayPool Hub · Hampankatta',
    cityId: 'mng',
    address: 'Kadri Rd, Hampankatta, Mangalore',
    landmark: 'Next to Hampankatta Circle',
    openFrom: '7:30 AM',
    openTo: '9:30 PM',
    rating: 4.6,
    manager: 'Vinod Kamath',
    capacity: 75,
    held: 28,
  },
  {
    id: 'hub-mng-kad',
    name: 'WayPool Hub · Kadri',
    cityId: 'mng',
    address: 'Kadri Temple Rd, Kadri, Mangalore',
    landmark: 'Opposite the Kadri Park gate',
    openFrom: '8:00 AM',
    openTo: '9:00 PM',
    rating: 4.4,
    manager: 'Shalini Pai',
    capacity: 50,
    held: 16,
  },

  /* ── Hubballi ──────────────────────────────────────────────────────────── */
  {
    id: 'hub-hbl-vid',
    name: 'WayPool Hub · Vidyanagar',
    cityId: 'hbl',
    address: 'Gokul Rd, Vidyanagar, Hubballi',
    landmark: 'Near Vidyanagar Circle',
    openFrom: '7:30 AM',
    openTo: '9:30 PM',
    rating: 4.5,
    manager: 'Basavaraj Hiremath',
    capacity: 65,
    held: 21,
  },

  /* ── Coimbatore ────────────────────────────────────────────────────────── */
  {
    id: 'hub-cbe-gan',
    name: 'WayPool Hub · Gandhipuram',
    cityId: 'cbe',
    address: 'Cross Cut Rd, Gandhipuram, Coimbatore',
    landmark: 'Beside the Central Bus Stand',
    openFrom: '6:30 AM',
    openTo: '10:30 PM',
    rating: 4.5,
    manager: 'Karthik Raja',
    capacity: 105,
    held: 47,
  },
  {
    id: 'hub-cbe-pee',
    name: 'WayPool Hub · Peelamedu',
    cityId: 'cbe',
    address: 'Avinashi Rd, Peelamedu, Coimbatore',
    landmark: 'Opposite the PSG Tech gate',
    openFrom: '7:30 AM',
    openTo: '10:00 PM',
    rating: 4.6,
    manager: 'Divya Shankar',
    capacity: 70,
    held: 23,
  },

  /* ── Chennai ───────────────────────────────────────────────────────────── */
  {
    id: 'hub-che-tnr',
    name: 'WayPool Hub · T. Nagar',
    cityId: 'che',
    address: 'Usman Rd, T. Nagar, Chennai',
    landmark: 'Near Panagal Park',
    openFrom: '7:00 AM',
    openTo: '10:00 PM',
    rating: 4.4,
    manager: 'Arun Kumar',
    capacity: 100,
    held: 41,
  },
  {
    id: 'hub-che-vel',
    name: 'WayPool Hub · Velachery',
    cityId: 'che',
    address: '100 Feet Rd, Velachery, Chennai',
    landmark: 'Beside Phoenix MarketCity',
    openFrom: '7:30 AM',
    openTo: '10:30 PM',
    rating: 4.6,
    manager: 'Priya Balan',
    capacity: 90,
    held: 35,
  },
  {
    id: 'hub-che-anv',
    name: 'WayPool Hub · Anna Nagar',
    cityId: 'che',
    address: '2nd Avenue, Anna Nagar, Chennai',
    landmark: 'Near Anna Nagar Tower Park',
    openFrom: '8:00 AM',
    openTo: '9:30 PM',
    rating: 4.7,
    manager: 'Vignesh Iyer',
    capacity: 80,
    held: 18,
  },
  {
    id: 'hub-che-omr',
    name: 'WayPool Hub · OMR Perungudi',
    cityId: 'che',
    address: 'Rajiv Gandhi Salai, Perungudi, Chennai',
    landmark: 'Opposite the Thoraipakkam toll',
    openFrom: '6:30 AM',
    openTo: '11:00 PM',
    rating: 4.3,
    manager: 'Fathima Noor',
    capacity: 115,
    held: 72,
  },

  /* ── Hyderabad ─────────────────────────────────────────────────────────── */
  {
    id: 'hub-hyd-gac',
    name: 'WayPool Hub · Gachibowli',
    cityId: 'hyd',
    address: 'Gachibowli–Miyapur Rd, Hyderabad',
    landmark: 'Near DLF Cyber City',
    openFrom: '7:00 AM',
    openTo: '10:30 PM',
    rating: 4.6,
    manager: 'Rohit Varma',
    capacity: 110,
    held: 49,
  },
  {
    id: 'hub-hyd-sec',
    name: 'WayPool Hub · Secunderabad',
    cityId: 'hyd',
    address: 'SD Rd, Secunderabad',
    landmark: 'Near the Clock Tower',
    openFrom: '6:30 AM',
    openTo: '10:30 PM',
    rating: 4.4,
    manager: 'Sridhar Rao',
    capacity: 95,
    held: 58,
  },
  {
    id: 'hub-hyd-ban',
    name: 'WayPool Hub · Banjara Hills',
    cityId: 'hyd',
    address: 'Road No. 12, Banjara Hills, Hyderabad',
    landmark: 'Above Karachi Bakery',
    openFrom: '8:00 AM',
    openTo: '9:30 PM',
    rating: 4.8,
    manager: 'Ayesha Sultana',
    capacity: 65,
    held: 14,
  },

  /* ── Goa ───────────────────────────────────────────────────────────────── */
  {
    id: 'hub-goa-pan',
    name: 'WayPool Hub · Panjim',
    cityId: 'goa',
    address: '18th June Rd, Panjim, Goa',
    landmark: 'Near the Municipal Garden',
    openFrom: '8:00 AM',
    openTo: '9:00 PM',
    rating: 4.7,
    manager: 'Rajesh Naik',
    capacity: 55,
    held: 17,
  },
]

export const HUBS: Hub[] = HUB_SEED.map((h) => ({
  ...h,
  distanceKm: haversineKm(cityCoord(h.cityId), hubCoord(h.id, h.cityId)),
}))

/**
 * Hub counts are counted, not claimed. They were hand-written before, drifted
 * from the real list, and left five cities advertising hubs that did not exist
 * — the picker then fell through to a hub in another state.
 */
export const CITIES: City[] = CITY_SEED.map((c) => ({
  ...c,
  hubCount: HUBS.filter((h) => h.cityId === c.id).length,
}))

/* Every hub must have a real position and a city that exists. In development
   this is loud, because both failures are invisible at runtime: the hub simply
   renders at the centre of its city and nothing looks wrong. */
if (import.meta.env.DEV) {
  const orphans = HUB_SEED.filter((h) => !(h.id in HUB_COORDS))
  if (orphans.length) {
    console.error(
      `[data] ${orphans.length} hub(s) have no entry in HUB_COORDS and will render at their city centre:`,
      orphans.map((h) => h.id),
    )
  }
  const strays = HUB_SEED.filter((h) => !CITY_SEED.some((c) => c.id === h.cityId))
  if (strays.length) {
    console.error('[data] hub(s) in an unknown city:', strays.map((h) => h.id))
  }
}

/* ── Parcel categories & pricing inputs ───────────────────────────────────── */

export const PARCEL_CATEGORIES = [
  { id: 'documents', label: 'Documents', hint: 'Papers, files, certificates' },
  { id: 'electronics', label: 'Electronics', hint: 'Phones, laptops, gadgets' },
  { id: 'clothing', label: 'Clothing', hint: 'Apparel, footwear, textiles' },
  { id: 'food', label: 'Packaged Food', hint: 'Sealed, non-perishable only' },
  { id: 'medicine', label: 'Medicine', hint: 'Non-refrigerated only' },
  { id: 'gifts', label: 'Gifts', hint: 'Presents, hampers' },
  { id: 'spares', label: 'Spare Parts', hint: 'Tools, hardware, components' },
  { id: 'other', label: 'Other', hint: 'Anything else permitted' },
] as const

export const PARCEL_SIZES = [
  { id: 'S' as const, label: 'Small', dims: 'Up to 30×20×15 cm', maxKg: 3, base: 79 },
  { id: 'M' as const, label: 'Medium', dims: 'Up to 45×35×25 cm', maxKg: 10, base: 139 },
  { id: 'L' as const, label: 'Large', dims: 'Up to 60×45×40 cm', maxKg: 20, base: 249 },
]

/** Per the PRD's trust & safety layer — sender must accept this before booking. */
export const PROHIBITED_ITEMS = [
  'Cash, gold, jewellery or bullion',
  'Liquids, aerosols and flammables',
  'Perishables needing refrigeration',
  'Live animals or plants',
  'Alcohol, tobacco and narcotics',
  'Weapons, ammunition, explosives',
  'Any item illegal to transport in India',
]

/** MVP liability cap from §9 of the PRD. */
export const DECLARED_VALUE_CAP = 5000

/** Flat per-parcel handling fee paid to hub partners (PRD §8.3 suggests ₹10–20). */
export const HUB_HANDLING_FEE = 15

/* ── KYC ladder (PRD §7) ──────────────────────────────────────────────────── */

export const KYC_STEPS: KycStep[] = [
  {
    id: 'mobile',
    label: 'Mobile number',
    detail: 'Verified by OTP at signup',
    status: 'verified',
    unlocks: 'parcel_only',
  },
  {
    id: 'aadhaar',
    label: 'Aadhaar e-KYC',
    detail: 'Offline XML via a licensed KUA partner. We never store your Aadhaar number.',
    status: 'verified',
    unlocks: 'parcel_only',
  },
  {
    id: 'selfie',
    label: 'Selfie + liveness',
    detail: 'Face-matched against your Aadhaar photo',
    status: 'verified',
    unlocks: 'parcel_only',
  },
  {
    id: 'license',
    label: 'Driving licence',
    detail: 'Validity checked against the Parivahan/VAHAN registry',
    status: 'pending',
    unlocks: 'passenger_ready',
  },
  {
    id: 'rc',
    label: 'Vehicle RC',
    detail: 'Ownership confirmed against VAHAN records',
    status: 'action_required',
    unlocks: 'passenger_ready',
  },
  {
    id: 'bank',
    label: 'Bank / UPI',
    detail: 'Required before your first payout is released',
    status: 'verified',
    unlocks: 'payouts',
  },
  {
    id: 'police',
    label: 'Background check',
    detail: 'Recommended before carrying passengers regularly',
    status: 'locked',
    unlocks: 'passenger_ready',
    optional: true,
  },
]

/* ── Support chat ─────────────────────────────────────────────────────────── */

/** The one fixture thread left: a generic support opener, not a real person
 *  or a real exchange — the account it is shown against has no bearing on
 *  what it says, which is what tells it apart from the fake driver/traveller
 *  data this file used to carry. */
export const SUPPORT_THREAD: ChatMessage[] = [
  { id: 'c0', from: 'system', text: 'Connected to WayPool Support · avg reply 2 min', at: hoursFromNow(-0.5) },
  { id: 'c1', from: 'them', text: 'Hi — how can I help?', at: hoursFromNow(-0.48) },
]

/* ── Lookups ──────────────────────────────────────────────────────────────── */

export const cityById = (id: string) => CITIES.find((c) => c.id === id)
export const cityName = (id: string) => cityById(id)?.name ?? id
export const hubById = (id: string) => HUBS.find((h) => h.id === id)
export const hubName = (id: string) => hubById(id)?.name ?? id
/** "Koramangala" from "WayPool Hub · Koramangala" */
export const hubShort = (id: string) => hubById(id)?.name.split('·').pop()?.trim() ?? id
export const hubsInCity = (cityId: string) => HUBS.filter((h) => h.cityId === cityId)
/**
 * Resolves a chosen hub, falling back to the nearest one in the city. Lets any
 * booking step be opened directly (deep link, refresh) without a blank hub.
 */
export const resolveHub = (hubId: string | null | undefined, cityId: string) =>
  (hubId ? hubById(hubId) : undefined) ?? hubsInCity(cityId)[0] ?? HUBS[0]
export const categoryById = (id: string) =>
  PARCEL_CATEGORIES.find((c) => c.id === id) ?? PARCEL_CATEGORIES[7]

/* ── Pricing engine ───────────────────────────────────────────────────────── */

const CORRIDOR_KM: Record<string, number> = {
  'blr>mys': 145,
  'mys>blr': 145,
  'blr>che': 348,
  'che>blr': 348,
  'blr>mng': 352,
  'blr>hyd': 570,
  'blr>cbe': 365,
  'blr>goa': 560,
  'blr>hbl': 410,
}

export function corridorKm(from: string, to: string) {
  return CORRIDOR_KM[`${from}>${to}`] ?? CORRIDOR_KM[`${to}>${from}`] ?? 200
}

export interface PriceBreakdown {
  base: number
  distance: number
  weight: number
  fragile: number
  insurance: number
  discount: number
  gst: number
  total: number
  courierComparison: number
  savedPct: number
  km: number
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
  const overweight = Math.max(0, input.weightKg - sizeDef.maxKg * 0.5)
  const weight = Math.round(overweight * 11)
  const fragile = input.fragile ? 29 : 0
  const insurance = input.insured ? 25 : 0

  const subtotal = base + distance + weight + fragile + insurance
  const discount = input.promo ? Math.round(subtotal * 0.2) : 0
  const gst = Math.round((subtotal - discount) * 0.18)
  const total = subtotal - discount + gst

  // Courier baseline from the PRD problem statement (2–5 day incumbents).
  const courierComparison = Math.round(total * 1.85 + 40)

  return {
    base,
    distance,
    weight,
    fragile,
    insurance,
    discount,
    gst,
    total,
    courierComparison,
    savedPct: Math.round((1 - total / courierComparison) * 100),
    km,
  }
}

/**
 * Turns a real parcel sitting at a hub into the job card a driver sees.
 * Payout is the driver's share of the fare the sender actually paid, so the
 * two sides of the marketplace always reconcile.
 */
export function jobFromParcel(p: Parcel): ParcelJob {
  const isP2P = p.mode === 'p2p'
  const from = hubById(p.originHubId)
  const to = hubById(p.destinationHubId)

  // A door pickup always costs the driver more deviation than a hub that sits
  // on the corridor, and the payout carries a premium to match.
  const detourKm = isP2P
    ? Number((6 + (p.weightKg > 10 ? 2 : 0)).toFixed(1))
    : Number(((from?.distanceKm ?? 2) + (to?.distanceKm ?? 2)).toFixed(1))

  // P2P is claimable from booking; hub jobs only once the hub has taken custody.
  const openedAt = isP2P
    ? p.bookedAt
    : (p.timeline.find((e) => e.status === 'at_origin_hub')?.at ?? p.bookedAt)

  return {
    id: `JOB-${p.id.replace(/\D/g, '').slice(-4)}`,
    parcelId: p.id,
    mode: p.mode,
    fromHubId: p.originHubId,
    toHubId: p.destinationHubId,
    fromLabel: isP2P ? (p.pickupAddress ?? cityName(p.fromCityId)) : hubShort(p.originHubId),
    toLabel: isP2P ? (p.dropAddress ?? cityName(p.toCityId)) : hubShort(p.destinationHubId),
    size: p.size,
    weightKg: p.weightKg,
    // No hub fees to fund on a door run, so more of the fare reaches the driver.
    payout: Math.round(p.price * (isP2P ? 0.72 : 0.62)),
    detourKm,
    // Holds for 45 minutes once it becomes claimable. Seeded parcels can have
    // an opening timestamp older than that, so the floor keeps every open job
    // showing a live countdown rather than a stale "expired 3h ago".
    expiresAt: new Date(
      Math.max(new Date(openedAt).getTime() + 45 * 60_000, Date.now() + 12 * 60_000),
    ).toISOString(),
    category: p.category,
    fragile: p.fragile,
  }
}

/**
 * The custody chain for a new booking. Hub mode has four OTP checkpoints;
 * P2P has two, because there is no hub taking custody in between (PRD §6).
 */
export function newTimeline(mode: DeliveryMode, bookedAt: string): TrackingEvent[] {
  const node = (
    id: string,
    status: ParcelStatus,
    title: string,
    detail: string,
    done = false,
  ): TrackingEvent => ({ id, status, title, detail, at: done ? bookedAt : null, done })

  if (mode === 'p2p') {
    return [
      node('ev-0', 'booked', 'Booking confirmed', 'Payment received. Pickup OTP sent to your phone.', true),
      node('ev-1', 'assigned', 'Traveler assigned', 'A verified traveler on your route accepted this parcel.'),
      node('ev-2', 'in_transit', 'Collected from you', 'Traveler verified your OTP at your door and took custody.'),
      node('ev-3', 'delivered', 'Delivered to receiver', 'Receiver OTP verified at their door. Loop closed.'),
    ]
  }

  return [
    node('ev-0', 'booked', 'Booking confirmed', 'Payment received. Drop-off OTP sent to your phone.', true),
    node('ev-1', 'at_origin_hub', 'Drop at origin hub', 'Hub manager will weigh, photograph and verify your OTP.'),
    node('ev-2', 'assigned', 'Matched with a traveler', 'We are finding a verified traveler on your route.'),
    node('ev-3', 'in_transit', 'Picked up · in transit', 'Custody moves from hub to traveler.'),
    node('ev-4', 'at_destination_hub', 'Arrives at destination hub', 'Receiver OTP is sent once the parcel lands.'),
    node('ev-5', 'delivered', 'Collected by receiver', 'Receiver OTP closes the delivery loop.'),
  ]
}

/**
 * Deterministic 6-digit code, computed on the device.
 *
 * ── Do not use this for a parcel ──────────────────────────────────────────
 * It used to generate every custody OTP, which meant the code releasing a
 * parcel was computable by anyone holding the parcel id, and the device
 * deciding whether a code was right was the device that wanted it to be.
 * Those codes are now issued and checked by the server; see `lib/custody.ts`.
 *
 * What is left is the carpool boarding code, where the whole ride side of the
 * app is still local — a driver and a passenger in the same car, with no
 * server between them and nothing of value gated on it. When rides move to
 * the server this goes with them, and then this function should be deleted
 * rather than found and reused.
 */
export function otpFor(seed: string) {
  let h = 7
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1_000_000
  return String(h).padStart(6, '0')
}

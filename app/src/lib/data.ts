import type {
  ChatMessage,
  City,
  DeliveryMode,
  Hub,
  HubInventoryItem,
  KycStep,
  NotificationItem,
  Parcel,
  ParcelJob,
  ParcelStatus,
  TrackingEvent,
  Traveler,
  Trip,
  WalletTxn,
} from './types'
import { hoursFromNow, minutesFromNow } from './format'
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
    name: 'DikkiConnect Hub · Koramangala',
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
    name: 'DikkiConnect Hub · Indiranagar',
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
    name: 'DikkiConnect Hub · Whitefield',
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
    name: 'DikkiConnect Hub · Jayanagar',
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
    name: 'DikkiConnect Hub · Hebbal',
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
    name: 'DikkiConnect Hub · Electronic City',
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
    name: 'DikkiConnect Hub · Saraswathipuram',
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
    name: 'DikkiConnect Hub · Vijayanagar',
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
    name: 'DikkiConnect Hub · Nanjangud Road',
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
    name: 'DikkiConnect Hub · Hampankatta',
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
    name: 'DikkiConnect Hub · Kadri',
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
    name: 'DikkiConnect Hub · Vidyanagar',
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
    name: 'DikkiConnect Hub · Gandhipuram',
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
    name: 'DikkiConnect Hub · Peelamedu',
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
    name: 'DikkiConnect Hub · T. Nagar',
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
    name: 'DikkiConnect Hub · Velachery',
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
    name: 'DikkiConnect Hub · Anna Nagar',
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
    name: 'DikkiConnect Hub · OMR Perungudi',
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
    name: 'DikkiConnect Hub · Gachibowli',
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
    name: 'DikkiConnect Hub · Secunderabad',
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
    name: 'DikkiConnect Hub · Banjara Hills',
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
    name: 'DikkiConnect Hub · Panjim',
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

export const TRAVELERS: Traveler[] = [
  {
    id: 'trv-1',
    name: 'Arjun Menon',
    phone: '9845012345',
    rating: 4.9,
    trips: 214,
    avatarTone: 0,
    kycTier: 'passenger_ready',
    verifiedSince: '2025-03-14',
    languages: ['English', 'Kannada', 'Malayalam'],
    vehicle: {
      id: 'veh-1',
      model: 'Hyundai Creta',
      plate: 'KA 05 MJ 4417',
      colour: 'Titan Grey',
      type: 'suv',
      bootCapacityKg: 40,
      seats: 4,
    },
  },
  {
    id: 'trv-2',
    name: 'Divya Nair',
    phone: '9880123456',
    rating: 4.8,
    trips: 132,
    avatarTone: 1,
    kycTier: 'passenger_ready',
    verifiedSince: '2025-06-02',
    languages: ['English', 'Hindi', 'Tamil'],
    vehicle: {
      id: 'veh-2',
      model: 'Maruti Swift',
      plate: 'KA 03 NB 8821',
      colour: 'Pearl White',
      type: 'hatchback',
      bootCapacityKg: 22,
      seats: 3,
    },
  },
  {
    id: 'trv-3',
    name: 'Karthik Reddy',
    phone: '9900234567',
    rating: 4.7,
    trips: 88,
    avatarTone: 2,
    kycTier: 'parcel_only',
    verifiedSince: '2025-09-21',
    languages: ['Telugu', 'English'],
    vehicle: {
      id: 'veh-3',
      model: 'Honda City',
      plate: 'KA 51 AC 2093',
      colour: 'Radiant Red',
      type: 'sedan',
      bootCapacityKg: 32,
      seats: 4,
    },
  },
  {
    id: 'trv-4',
    name: 'Sneha Bhat',
    phone: '9741045678',
    rating: 5.0,
    trips: 41,
    avatarTone: 3,
    kycTier: 'passenger_ready',
    verifiedSince: '2026-01-08',
    languages: ['Kannada', 'English'],
    vehicle: {
      id: 'veh-4',
      model: 'Tata Nexon EV',
      plate: 'KA 04 ME 7710',
      colour: 'Midnight Blue',
      type: 'suv',
      bootCapacityKg: 36,
      seats: 4,
    },
  },
]

/* ── Parcel categories & pricing inputs ───────────────────────────────────── */

export const PARCEL_CATEGORIES = [
  { id: 'documents', label: 'Documents', emoji: '📄', hint: 'Papers, files, certificates' },
  { id: 'electronics', label: 'Electronics', emoji: '📱', hint: 'Phones, laptops, gadgets' },
  { id: 'clothing', label: 'Clothing', emoji: '👕', hint: 'Apparel, footwear, textiles' },
  { id: 'food', label: 'Packaged Food', emoji: '🍱', hint: 'Sealed, non-perishable only' },
  { id: 'medicine', label: 'Medicine', emoji: '💊', hint: 'Non-refrigerated only' },
  { id: 'gifts', label: 'Gifts', emoji: '🎁', hint: 'Presents, hampers' },
  { id: 'spares', label: 'Spare Parts', emoji: '🔧', hint: 'Tools, hardware, components' },
  { id: 'other', label: 'Other', emoji: '📦', hint: 'Anything else permitted' },
] as const

export const PARCEL_SIZES = [
  { id: 'S' as const, label: 'Small', dims: 'Up to 30×20×15 cm', maxKg: 3, base: 79, emoji: '🥡' },
  { id: 'M' as const, label: 'Medium', dims: 'Up to 45×35×25 cm', maxKg: 10, base: 139, emoji: '📦' },
  { id: 'L' as const, label: 'Large', dims: 'Up to 60×45×40 cm', maxKg: 20, base: 249, emoji: '🗄️' },
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

/* ── Tracking chain factory ───────────────────────────────────────────────── */

function chain(stageIndex: number, opts: { traveler?: string; originHub: string; destHub: string }) {
  const steps: Array<{
    status: Parcel['status']
    title: string
    detail: string
    actor?: string
    location?: string
    otpVerified?: boolean
    photos?: number
    offsetH: number
  }> = [
    {
      status: 'booked',
      title: 'Booking confirmed',
      detail: 'Payment received. Drop-off OTP sent to your phone.',
      offsetH: -26,
    },
    {
      status: 'at_origin_hub',
      title: 'Dropped at origin hub',
      detail: 'Weighed, photographed and logged by the hub manager.',
      location: opts.originHub,
      otpVerified: true,
      photos: 3,
      offsetH: -22,
    },
    {
      status: 'assigned',
      title: 'Matched with a traveler',
      detail: 'A verified traveler heading your way accepted this parcel.',
      actor: opts.traveler,
      offsetH: -8,
    },
    {
      status: 'in_transit',
      title: 'Picked up · in transit',
      detail: 'Custody moved from hub to traveler. OTP verified at handoff.',
      actor: opts.traveler,
      location: opts.originHub,
      otpVerified: true,
      photos: 2,
      offsetH: -3,
    },
    {
      status: 'at_destination_hub',
      title: 'Arrived at destination hub',
      detail: 'Traveler handed the parcel over. Receiver OTP dispatched.',
      location: opts.destHub,
      otpVerified: true,
      photos: 2,
      offsetH: 1,
    },
    {
      status: 'delivered',
      title: 'Collected by receiver',
      detail: 'Receiver OTP verified. Delivery loop closed.',
      location: opts.destHub,
      otpVerified: true,
      photos: 1,
      offsetH: 3,
    },
  ]

  return steps.map((s, i): Parcel['timeline'][number] => ({
    id: `ev-${i}`,
    status: s.status,
    title: s.title,
    detail: s.detail,
    at: i <= stageIndex ? hoursFromNow(s.offsetH) : null,
    actor: s.actor,
    location: s.location,
    otpVerified: i <= stageIndex ? s.otpVerified : undefined,
    photos: i <= stageIndex ? s.photos : undefined,
    done: i <= stageIndex,
  }))
}

export const PARCELS: Parcel[] = [
  {
    id: 'DKC-4821',
    mode: 'hub',
    senderName: 'Aditi Sharma',
    receiverName: 'Rohit Sharma',
    receiverPhone: '9845567890',
    fromCityId: 'blr',
    toCityId: 'mys',
    originHubId: 'hub-blr-kor',
    destinationHubId: 'hub-mys-sar',
    category: 'electronics',
    size: 'M',
    weightKg: 2.4,
    declaredValue: 3200,
    fragile: true,
    notes: 'Laptop charger and accessories. Handle with care.',
    status: 'in_transit',
    bookedAt: hoursFromNow(-26),
    etaAt: hoursFromNow(2),
    price: 189,
    travelerId: 'trv-1',
    timeline: chain(3, {
      traveler: 'Arjun Menon',
      originHub: 'Koramangala Hub',
      destHub: 'Saraswathipuram Hub',
    }),
  },
  {
    id: 'DKC-4796',
    mode: 'hub',
    senderName: 'Aditi Sharma',
    receiverName: 'Meera Iyer',
    receiverPhone: '9900112233',
    fromCityId: 'blr',
    toCityId: 'mys',
    originHubId: 'hub-blr-jay',
    destinationHubId: 'hub-mys-vij',
    category: 'documents',
    size: 'S',
    weightKg: 0.4,
    declaredValue: 500,
    fragile: false,
    status: 'at_origin_hub',
    bookedAt: hoursFromNow(-6),
    etaAt: hoursFromNow(14),
    price: 99,
    timeline: chain(1, {
      originHub: 'Jayanagar Hub',
      destHub: 'Vijayanagar Hub',
    }),
  },
  {
    id: 'DKC-4703',
    mode: 'hub',
    senderName: 'Aditi Sharma',
    receiverName: 'Nikhil Verma',
    receiverPhone: '9812345678',
    fromCityId: 'blr',
    toCityId: 'mys',
    originHubId: 'hub-blr-kor',
    destinationHubId: 'hub-mys-sar',
    category: 'gifts',
    size: 'M',
    weightKg: 3.1,
    declaredValue: 1800,
    fragile: false,
    status: 'delivered',
    bookedAt: hoursFromNow(-98),
    etaAt: hoursFromNow(-71),
    price: 169,
    travelerId: 'trv-2',
    timeline: chain(5, {
      traveler: 'Divya Nair',
      originHub: 'Koramangala Hub',
      destHub: 'Saraswathipuram Hub',
    }),
  },
  {
    id: 'DKC-4655',
    mode: 'hub',
    senderName: 'Aditi Sharma',
    receiverName: 'Sanjay Pillai',
    receiverPhone: '9845009988',
    fromCityId: 'blr',
    toCityId: 'che',
    originHubId: 'hub-blr-elc',
    destinationHubId: 'hub-che-tnr',
    category: 'clothing',
    size: 'L',
    weightKg: 8.2,
    declaredValue: 4500,
    fragile: false,
    status: 'delivered',
    bookedAt: hoursFromNow(-170),
    etaAt: hoursFromNow(-140),
    price: 349,
    travelerId: 'trv-3',
    timeline: chain(5, {
      traveler: 'Karthik Reddy',
      originHub: 'Electronic City Hub',
      destHub: 'T. Nagar Hub',
    }),
  },
  {
    id: 'DKC-4610',
    mode: 'hub',
    senderName: 'Aditi Sharma',
    receiverName: 'Priya Das',
    receiverPhone: '9611223344',
    fromCityId: 'mys',
    toCityId: 'blr',
    originHubId: 'hub-mys-vij',
    destinationHubId: 'hub-blr-kor',
    category: 'medicine',
    size: 'S',
    weightKg: 0.8,
    declaredValue: 900,
    fragile: false,
    status: 'cancelled',
    bookedAt: hoursFromNow(-240),
    etaAt: hoursFromNow(-220),
    price: 89,
    timeline: chain(0, {
      originHub: 'Vijayanagar Hub',
      destHub: 'Koramangala Hub',
    }),
  },
]

/* ── Trips ────────────────────────────────────────────────────────────────── */

export const TRIPS: Trip[] = [
  {
    id: 'TRP-9012',
    travelerId: 'trv-1',
    fromCityId: 'blr',
    toCityId: 'mys',
    departAt: hoursFromNow(2),
    arriveAt: hoursFromNow(5.5),
    seatsTotal: 4,
    seatsLeft: 2,
    bootSlots: ['M', 'M', 'S'],
    farePerSeat: 449,
    parcelIds: ['DKC-4821'],
    status: 'published',
    viaStops: ['Ramanagara', 'Channapatna', 'Mandya'],
  },
  {
    id: 'TRP-9008',
    travelerId: 'trv-2',
    fromCityId: 'blr',
    toCityId: 'mys',
    departAt: hoursFromNow(4),
    arriveAt: hoursFromNow(7.5),
    seatsTotal: 3,
    seatsLeft: 3,
    bootSlots: ['S', 'S'],
    farePerSeat: 399,
    parcelIds: [],
    status: 'published',
    viaStops: ['Bidadi', 'Maddur'],
  },
  {
    id: 'TRP-9003',
    travelerId: 'trv-4',
    fromCityId: 'blr',
    toCityId: 'mys',
    departAt: hoursFromNow(7),
    arriveAt: hoursFromNow(10.25),
    seatsTotal: 4,
    seatsLeft: 1,
    bootSlots: ['L', 'M'],
    farePerSeat: 529,
    parcelIds: [],
    status: 'published',
    viaStops: ['Ramanagara', 'Mandya'],
  },
  {
    id: 'TRP-8994',
    travelerId: 'trv-3',
    fromCityId: 'mys',
    toCityId: 'blr',
    departAt: hoursFromNow(9),
    arriveAt: hoursFromNow(12.5),
    seatsTotal: 4,
    seatsLeft: 4,
    bootSlots: ['M', 'S', 'S'],
    farePerSeat: 419,
    parcelIds: [],
    status: 'published',
    viaStops: ['Srirangapatna', 'Maddur', 'Channapatna'],
  },
]

/* ── Parcel jobs offered to travelers ─────────────────────────────────────── */

export const PARCEL_JOBS: ParcelJob[] = [
  {
    id: 'JOB-311',
    parcelId: 'DKC-4796',
    mode: 'hub',
    fromHubId: 'hub-blr-jay',
    toHubId: 'hub-mys-vij',
    fromLabel: 'Jayanagar',
    toLabel: 'Vijayanagar',
    size: 'S',
    weightKg: 0.4,
    payout: 62,
    detourKm: 1.8,
    expiresAt: minutesFromNow(42),
    category: 'documents',
    fragile: false,
  },
  {
    id: 'JOB-312',
    parcelId: 'DKC-4844',
    mode: 'hub',
    fromHubId: 'hub-blr-kor',
    toHubId: 'hub-mys-sar',
    fromLabel: 'Koramangala',
    toLabel: 'Saraswathipuram',
    size: 'M',
    weightKg: 4.6,
    payout: 118,
    detourKm: 0.4,
    expiresAt: minutesFromNow(18),
    category: 'clothing',
    fragile: false,
  },
  {
    id: 'JOB-313',
    parcelId: 'DKC-4851',
    mode: 'hub',
    fromHubId: 'hub-blr-kor',
    toHubId: 'hub-mys-sar',
    fromLabel: 'Koramangala',
    toLabel: 'Saraswathipuram',
    size: 'L',
    weightKg: 11.2,
    payout: 214,
    detourKm: 0.4,
    expiresAt: minutesFromNow(64),
    category: 'spares',
    fragile: true,
  },
  {
    id: 'JOB-314',
    parcelId: 'DKC-4858',
    mode: 'hub',
    fromHubId: 'hub-blr-elc',
    toHubId: 'hub-mys-vij',
    fromLabel: 'Electronic City',
    toLabel: 'Vijayanagar',
    size: 'S',
    weightKg: 1.1,
    payout: 74,
    detourKm: 6.2,
    expiresAt: minutesFromNow(120),
    category: 'medicine',
    fragile: false,
  },
]

/* ── Hub inventory ────────────────────────────────────────────────────────── */

export const HUB_INVENTORY: HubInventoryItem[] = [
  { parcelId: 'DKC-4796', shelf: 'A-04', intakeAt: hoursFromNow(-6), state: 'waiting' },
  { parcelId: 'DKC-4844', shelf: 'A-05', intakeAt: hoursFromNow(-3), state: 'assigned', assignedTravelerId: 'trv-1' },
  { parcelId: 'DKC-4851', shelf: 'B-01', intakeAt: hoursFromNow(-11), state: 'waiting' },
  { parcelId: 'DKC-4802', shelf: 'B-02', intakeAt: hoursFromNow(-31), state: 'delayed' },
  { parcelId: 'DKC-4779', shelf: 'C-07', intakeAt: hoursFromNow(-52), state: 'delayed' },
  { parcelId: 'DKC-4858', shelf: 'A-09', intakeAt: hoursFromNow(-1), state: 'waiting' },
  { parcelId: 'DKC-4712', shelf: 'D-03', intakeAt: hoursFromNow(-74), state: 'lost' },
  { parcelId: 'DKC-4869', shelf: 'A-11', intakeAt: hoursFromNow(-0.5), state: 'assigned', assignedTravelerId: 'trv-4' },
]

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

/* ── Wallet ───────────────────────────────────────────────────────────────── */

export const SENDER_TXNS: WalletTxn[] = [
  { id: 'w1', label: 'Parcel DKC-4821', sub: 'Bangalore → Mysore', amount: -189, at: hoursFromNow(-26), kind: 'debit', method: 'upi' },
  { id: 'w2', label: 'Cashback · FIRSTDROP', sub: 'Promo credit', amount: 40, at: hoursFromNow(-26), kind: 'credit', method: 'wallet' },
  { id: 'w3', label: 'Parcel DKC-4796', sub: 'Bangalore → Mysore', amount: -99, at: hoursFromNow(-6), kind: 'debit', method: 'wallet' },
  { id: 'w4', label: 'Refund · DKC-4610', sub: 'Cancelled before pickup', amount: 89, at: hoursFromNow(-238), kind: 'credit', method: 'refund' },
  { id: 'w5', label: 'Added money', sub: 'HDFC •••• 4412', amount: 500, at: hoursFromNow(-250), kind: 'credit', method: 'card' },
  { id: 'w6', label: 'Parcel DKC-4655', sub: 'Bangalore → Chennai', amount: -349, at: hoursFromNow(-170), kind: 'debit', method: 'upi' },
]

export const TRAVELER_TXNS: WalletTxn[] = [
  { id: 't1', label: 'Parcel payout · DKC-4821', sub: 'Koramangala → Saraswathipuram', amount: 132, at: hoursFromNow(-3), kind: 'credit', method: 'payout' },
  { id: 't2', label: 'Seat fare · Rhea M.', sub: 'TRP-9012 · 1 seat', amount: 449, at: hoursFromNow(-3), kind: 'credit', method: 'upi' },
  { id: 't3', label: 'Weekly settlement', sub: 'To ICICI •••• 8890', amount: -4820, at: hoursFromNow(-52), kind: 'debit', method: 'payout' },
  { id: 't4', label: 'Parcel payout · DKC-4703', sub: 'Koramangala → Saraswathipuram', amount: 118, at: hoursFromNow(-74), kind: 'credit', method: 'payout' },
  { id: 't5', label: 'Referral bonus', sub: 'Sneha B. completed 5 trips', amount: 250, at: hoursFromNow(-96), kind: 'credit', method: 'wallet' },
]

/* ── Notifications ────────────────────────────────────────────────────────── */

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Your parcel is on the highway',
    body: 'DKC-4821 left Koramangala Hub with Arjun M. ETA 2:40 PM.',
    at: hoursFromNow(-0.4),
    read: false,
    kind: 'parcel',
    href: '/sender/track/DKC-4821',
  },
  {
    id: 'n2',
    title: 'Drop-off OTP ready',
    body: 'Show 4-8-2-9-1-7 to the hub manager for DKC-4796.',
    at: hoursFromNow(-6),
    read: false,
    kind: 'parcel',
    href: '/sender/track/DKC-4796',
  },
  {
    id: 'n3',
    title: '₹40 cashback credited',
    body: 'FIRSTDROP promo applied to your DikkiConnect wallet.',
    at: hoursFromNow(-26),
    read: true,
    kind: 'payment',
    href: '/wallet',
  },
  {
    id: 'n4',
    title: 'Rate your last delivery',
    body: 'How did Divya N. do on DKC-4703?',
    at: hoursFromNow(-70),
    read: true,
    kind: 'ride',
  },
  {
    id: 'n5',
    title: '20% off Mysore drops this week',
    body: 'Use code MYSORE20 at checkout. Ends Sunday.',
    at: hoursFromNow(-96),
    read: true,
    kind: 'promo',
  },
]

/* ── Support chat ─────────────────────────────────────────────────────────── */

export const SUPPORT_THREAD: ChatMessage[] = [
  { id: 'c0', from: 'system', text: 'Connected to DikkiConnect Support · avg reply 2 min', at: hoursFromNow(-0.5) },
  { id: 'c1', from: 'them', text: 'Hi Aditi 👋 I can see DKC-4821 is in transit with Arjun. How can I help?', at: hoursFromNow(-0.48) },
  { id: 'c2', from: 'me', text: 'The receiver wants to collect from a different Mysore hub. Is that possible?', at: hoursFromNow(-0.4) },
  { id: 'c3', from: 'them', text: 'Yes — while the parcel is still in transit we can re-route it to Vijayanagar Hub at no extra cost. Want me to do that?', at: hoursFromNow(-0.36) },
  { id: 'c4', from: 'me', text: 'Please do. Thanks!', at: hoursFromNow(-0.3) },
  { id: 'c5', from: 'them', text: 'Done ✅ Destination updated to DikkiConnect Hub · Vijayanagar. A fresh receiver OTP will be sent once it lands.', at: hoursFromNow(-0.26) },
]

export const RIDE_CHAT: ChatMessage[] = [
  { id: 'r1', from: 'them', text: 'Hi! I\'m starting from Silk Board in about 20 minutes.', at: hoursFromNow(-1.2) },
  { id: 'r2', from: 'me', text: 'Perfect. I\'ll be at the Central Silk Board bus stop.', at: hoursFromNow(-1.1) },
  { id: 'r3', from: 'them', text: 'Great — white Swift, KA 03 NB 8821. See you shortly 🚗', at: hoursFromNow(-1.05) },
]

/* ── Lookups ──────────────────────────────────────────────────────────────── */

export const cityById = (id: string) => CITIES.find((c) => c.id === id)
export const cityName = (id: string) => cityById(id)?.name ?? id
export const hubById = (id: string) => HUBS.find((h) => h.id === id)
export const hubName = (id: string) => hubById(id)?.name ?? id
/** "Koramangala" from "DikkiConnect Hub · Koramangala" */
export const hubShort = (id: string) => hubById(id)?.name.split('·').pop()?.trim() ?? id
export const hubsInCity = (cityId: string) => HUBS.filter((h) => h.cityId === cityId)
/**
 * Resolves a chosen hub, falling back to the nearest one in the city. Lets any
 * booking step be opened directly (deep link, refresh) without a blank hub.
 */
export const resolveHub = (hubId: string | null | undefined, cityId: string) =>
  (hubId ? hubById(hubId) : undefined) ?? hubsInCity(cityId)[0] ?? HUBS[0]
export const travelerById = (id?: string) => TRAVELERS.find((t) => t.id === id)
export const parcelById = (id: string) => PARCELS.find((p) => p.id === id)
export const tripById = (id: string) => TRIPS.find((t) => t.id === id)
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

/** Deterministic 6-digit OTP so demo flows are reproducible. */
export function otpFor(seed: string) {
  let h = 7
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1_000_000
  return String(h).padStart(6, '0')
}

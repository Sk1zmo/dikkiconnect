/* ═══════════════════════════════════════════════════════════════════════════
   Geography.

   Everything here talks to a real service, and none of it needs an API key:

     · tiles     OpenFreeMap — OpenStreetMap vector tiles, free, no key
     · geocoding Nominatim — the OSM geocoder, free, 1 req/sec fair-use
     · routing   OSRM — real road routing on the OSM network

   Nominatim and OSRM both ask that you identify yourself and not hammer them,
   so every call here is debounced, cached for the session, and sends a
   Referer-identifiable request. For production volume you would swap the two
   base URLs for a paid plan (or your own OSRM instance) — the shape of the
   calls does not change.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface LngLat {
  lng: number
  lat: number
}

/** Real coordinates for every city on the network. */
export const CITY_COORDS: Record<string, LngLat> = {
  blr: { lng: 77.5946, lat: 12.9716 },
  mys: { lng: 76.6394, lat: 12.2958 },
  mng: { lng: 74.856, lat: 12.9141 },
  hbl: { lng: 75.124, lat: 15.3647 },
  cbe: { lng: 76.9558, lat: 11.0168 },
  che: { lng: 80.2707, lat: 13.0827 },
  hyd: { lng: 78.4867, lat: 17.385 },
  goa: { lng: 73.8278, lat: 15.2993 },
}

/** Real coordinates for each hub, placed at its actual locality. */
export const HUB_COORDS: Record<string, LngLat> = {
  'hub-blr-kor': { lng: 77.6245, lat: 12.9352 }, // Koramangala
  'hub-blr-ind': { lng: 77.7172, lat: 12.9698 }, // Indiranagar
  'hub-blr-whf': { lng: 77.7499, lat: 12.9698 }, // Whitefield
  'hub-blr-jay': { lng: 77.5833, lat: 12.9299 }, // Jayanagar
  'hub-blr-hbr': { lng: 77.6408, lat: 13.0358 }, // Hebbal
  'hub-blr-ele': { lng: 77.6975, lat: 12.8452 }, // Electronic City
  'hub-mys-sar': { lng: 76.6553, lat: 12.3072 }, // Saraswathipuram
  'hub-mys-vij': { lng: 76.6221, lat: 12.3218 }, // Vijayanagar
  'hub-mys-nan': { lng: 76.6394, lat: 12.2818 }, // Nanjangud road
  'hub-mng-hmp': { lng: 74.8399, lat: 12.8703 }, // Hampankatta
  'hub-mng-kad': { lng: 74.8615, lat: 12.8845 }, // Kadri
  'hub-che-tnr': { lng: 80.2437, lat: 13.0418 }, // T. Nagar
  'hub-che-vel': { lng: 80.2206, lat: 12.9756 }, // Velachery
  'hub-che-anv': { lng: 80.2101, lat: 13.0843 }, // Anna Nagar
  'hub-che-omr': { lng: 80.2279, lat: 12.8996 }, // OMR
  'hub-cbe-gan': { lng: 76.9629, lat: 11.0018 }, // Gandhipuram
  'hub-cbe-pee': { lng: 77.0026, lat: 11.0269 }, // Peelamedu
  'hub-hyd-gac': { lng: 78.3908, lat: 17.4399 }, // Gachibowli
  'hub-hyd-sec': { lng: 78.4983, lat: 17.4399 }, // Secunderabad
  'hub-hyd-ban': { lng: 78.4483, lat: 17.3616 }, // Banjara Hills
  'hub-hbl-vid': { lng: 75.1339, lat: 15.3495 }, // Vidyanagar
  'hub-goa-pan': { lng: 73.8278, lat: 15.4909 }, // Panjim
}

export const cityCoord = (cityId: string): LngLat => CITY_COORDS[cityId] ?? CITY_COORDS.blr
export const hubCoord = (hubId: string, fallbackCity = 'blr'): LngLat =>
  HUB_COORDS[hubId] ?? cityCoord(fallbackCity)

/* ── Basemap ─────────────────────────────────────────────────────────────── */

/**
 * OpenFreeMap serves OpenStreetMap vector tiles with no key and no rate limit.
 * `positron` reads as a quiet neutral canvas so route lines and pins stay the
 * loudest thing on screen; `dark` matches the navigation and tracking screens.
 */
export const MAP_STYLE = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
  bright: 'https://tiles.openfreemap.org/styles/bright',
} as const

/* ── Routing ─────────────────────────────────────────────────────────────── */

export interface Route {
  /** [lng, lat] pairs along the real road network. */
  coordinates: Array<[number, number]>
  distanceKm: number
  durationMin: number
}

const routeCache = new Map<string, Route | null>()

/**
 * A real driving route between two points, following actual roads.
 * Returns null if the router is unreachable — callers fall back to a straight
 * line, so a flaky network degrades the map rather than breaking it.
 */
export async function fetchRoute(from: LngLat, to: LngLat): Promise<Route | null> {
  const key = `${from.lng},${from.lat};${to.lng},${to.lat}`
  if (routeCache.has(key)) return routeCache.get(key) ?? null

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const json = await res.json()
    const r = json.routes?.[0]
    if (!r) throw new Error('no route')

    const route: Route = {
      coordinates: r.geometry.coordinates,
      distanceKm: Math.round(r.distance / 100) / 10,
      durationMin: Math.round(r.duration / 60),
    }
    routeCache.set(key, route)
    return route
  } catch {
    routeCache.set(key, null)
    return null
  }
}

/* ── Geocoding ───────────────────────────────────────────────────────────── */

export interface Place {
  label: string
  /** The short name — "Koramangala" rather than the full postal string. */
  name: string
  lng: number
  lat: number
}

const geocodeCache = new Map<string, Place[]>()

/**
 * Address lookup against OpenStreetMap, biased to India. Used by the P2P
 * booking flow so a typed door address becomes a real point on the map.
 */
export async function geocode(query: string, limit = 5): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const key = `${q}|${limit}`
  const hit = geocodeCache.get(key)
  if (hit) return hit

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(q)}&format=jsonv2&limit=${limit}&countrycodes=in&addressdetails=1`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as Array<{
      display_name: string
      name?: string
      lat: string
      lon: string
    }>

    const places = json.map((r) => ({
      label: r.display_name,
      name: r.name || r.display_name.split(',')[0],
      lat: Number(r.lat),
      lng: Number(r.lon),
    }))
    geocodeCache.set(key, places)
    return places
  } catch {
    return []
  }
}

/** Reverse lookup — what address is at this point? */
export async function reverseGeocode(at: LngLat): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${at.lat}&lon=${at.lng}&format=jsonv2&addressdetails=1`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const json = await res.json()
    return json.display_name ?? null
  } catch {
    return null
  }
}

/* ── Device location ─────────────────────────────────────────────────────── */

/**
 * The device's real position. Resolves null rather than throwing when the user
 * declines or the fix times out — "where are you" is never worth an error
 * boundary.
 */
export function currentPosition(timeout = 8000): Promise<LngLat | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lng: p.coords.longitude, lat: p.coords.latitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 60_000 },
    )
  })
}

/** Great-circle distance in km — for "how far is this hub" without a round trip. */
export function haversineKm(a: LngLat, b: LngLat) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10
}

/** Point at `t` (0–1) along a route's coordinate list. */
export function pointAlong(coords: Array<[number, number]>, t: number): LngLat {
  if (!coords.length) return { lng: 0, lat: 0 }
  const i = Math.min(coords.length - 1, Math.max(0, Math.round(t * (coords.length - 1))))
  return { lng: coords[i][0], lat: coords[i][1] }
}

/* ── Serviceability ──────────────────────────────────────────────────────── */

/**
 * How far from a city centre we still call a point "in" that city.
 *
 * Generous on purpose. Bangalore's built-up area runs past 30 km from the
 * centre, and telling somebody in Electronic City that we do not serve
 * Bangalore would be both wrong and insulting. Beyond this we do not refuse
 * the booking — we say which city we are measuring against and how far out
 * they are, and let them decide.
 */
export const SERVICE_RADIUS_KM = 45

export interface NearestCity {
  cityId: string
  km: number
  /** Within `SERVICE_RADIUS_KM` of a city we actually operate in. */
  serviced: boolean
}

/**
 * Which city on the network is this point in, or nearest to?
 *
 * Used to skip the "pick your city" step entirely when the device knows where
 * it is — the same move Swiggy makes when it opens straight onto your area
 * instead of asking.
 */
export function nearestCity(at: LngLat): NearestCity {
  let best = { cityId: 'blr', km: Number.POSITIVE_INFINITY }
  for (const [cityId, coord] of Object.entries(CITY_COORDS)) {
    const km = haversineKm(at, coord)
    if (km < best.km) best = { cityId, km }
  }
  return { ...best, serviced: best.km <= SERVICE_RADIUS_KM }
}

/* ── Road distance matrix ────────────────────────────────────────────────── */

export interface Leg {
  /** Distance along real roads, km. */
  km: number
  /** Driving time, minutes. */
  minutes: number
}

/**
 * Real road distance and drive time from one origin to many destinations, in a
 * single request.
 *
 * This is what makes "nearest hub" mean nearest rather than closest-as-the-
 * crow-flies. The two disagree constantly in Indian cities: a hub 2 km away
 * across a railway line with no crossing is a 9 km drive, and a straight-line
 * ranking would recommend it over one that is genuinely closer to reach.
 *
 * One `/table` call covers every hub in a city, so ranking six hubs costs one
 * request rather than six. Returns null when the router is unreachable, and
 * every caller falls back to the straight-line order rather than showing
 * nothing.
 */
export async function roadMatrix(from: LngLat, tos: LngLat[]): Promise<Leg[] | null> {
  if (!tos.length) return []

  try {
    const points = [from, ...tos].map((p) => `${p.lng},${p.lat}`).join(';')
    const url =
      `https://router.project-osrm.org/table/v1/driving/${points}` +
      `?sources=0&annotations=distance,duration`

    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as {
      code?: string
      distances?: number[][]
      durations?: number[][]
    }
    if (json.code !== 'Ok' || !json.distances?.[0] || !json.durations?.[0]) return null

    // Row 0 is the origin against every point, including itself at index 0.
    const distances = json.distances[0].slice(1)
    const durations = json.durations[0].slice(1)
    if (distances.length !== tos.length) return null

    return tos.map((_, i) => ({
      km: Math.round((distances[i] ?? 0) / 100) / 10,
      minutes: Math.round((durations[i] ?? 0) / 60),
    }))
  } catch {
    return null
  }
}

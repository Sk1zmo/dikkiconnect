import type { LngLat } from './geo'

/* ═══════════════════════════════════════════════════════════════════════════
   The address book.

   A geocoder can find a building. It cannot know which flat, which floor, or
   that the gate is behind the pharmacy — and those are exactly the parts a
   driver standing outside at 9pm needs. So a saved place is two things kept
   apart on purpose:

     · `line`  — the geocoded street address, with a real coordinate behind it
     · `flat` + `landmark` — what the user typed, which no lookup can supply

   Keeping them separate means re-pinning a location on the map never wipes the
   flat number, and correcting a flat number never invalidates the pin.

   Everything here is pure. Persistence and sharing live in the app store, so a
   pickup field and a drop field on the same screen see the same book.
   ═══════════════════════════════════════════════════════════════════════════ */

export type PlaceLabel = 'home' | 'work' | 'other'

export interface SavedPlace {
  id: string
  label: PlaceLabel
  /** Only meaningful for `other` — "Mum's place", "The warehouse". */
  nickname?: string
  /** The geocoded street address. */
  line: string
  /** Flat / house / floor. Never guessed, only typed. */
  flat?: string
  landmark?: string
  coord: LngLat
  cityId: string
  /** Who to call at this address — the receiver, if it is a drop. */
  contactName?: string
  contactPhone?: string
  createdAt: string
  lastUsedAt?: string
}

/** An address that was used but never saved. Offered back, not kept forever. */
export interface RecentPlace {
  line: string
  coord: LngLat
  cityId: string
  at: string
}

export const RECENTS_KEPT = 6

export const LABEL_META: Record<PlaceLabel, { title: string; icon: 'home' | 'work' | 'pin' }> = {
  home: { title: 'Home', icon: 'home' },
  work: { title: 'Work', icon: 'work' },
  other: { title: 'Other', icon: 'pin' },
}

export const newPlaceId = () =>
  `pl-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** What to show as the heading of a saved place. */
export function placeTitle(p: SavedPlace): string {
  if (p.label === 'other') return p.nickname?.trim() || p.line.split(',')[0]
  return LABEL_META[p.label].title
}

/** The full address as a driver would want to read it, top to bottom. */
export function placeFull(p: SavedPlace): string {
  return [p.flat?.trim(), p.line.trim(), p.landmark?.trim() && `Near ${p.landmark.trim()}`]
    .filter(Boolean)
    .join(', ')
}

/**
 * Home first, then Work, then everything else most-recently-used first.
 *
 * Fixed positions for the two labelled ones matter more than recency: they are
 * the two people reach for without reading, and a list that reorders itself
 * under a thumb already moving is worse than a stale one.
 */
export function sortPlaces(places: SavedPlace[]): SavedPlace[] {
  const rank: Record<PlaceLabel, number> = { home: 0, work: 1, other: 2 }
  return [...places].sort((a, b) => {
    if (rank[a.label] !== rank[b.label]) return rank[a.label] - rank[b.label]
    return (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt)
  })
}

/**
 * Is this essentially the same address we already have?
 *
 * Compared by position rather than text, because the same door reached by
 * search, by pin-drag and by GPS produces three different strings and one
 * location. ~40 m, which separates neighbouring buildings without splitting a
 * single one across two entries.
 */
export function samePlace(a: LngLat, b: LngLat): boolean {
  return Math.abs(a.lat - b.lat) < 0.00035 && Math.abs(a.lng - b.lng) < 0.00035
}

export const findSaved = (places: SavedPlace[], at: LngLat) =>
  places.find((p) => samePlace(p.coord, at))

/** Newest first, de-duplicated by position, capped. */
export function pushRecent(recents: RecentPlace[], next: RecentPlace): RecentPlace[] {
  return [next, ...recents.filter((r) => !samePlace(r.coord, next.coord))].slice(0, RECENTS_KEPT)
}

/**
 * A saved place, ready to drop into a booking draft.
 * `flat` leads because that is how the address is read out at the door.
 */
export function draftFromPlace(p: SavedPlace) {
  return {
    address: placeFull(p),
    coord: p.coord,
    cityId: p.cityId,
    contactName: p.contactName ?? '',
    contactPhone: p.contactPhone ?? '',
  }
}

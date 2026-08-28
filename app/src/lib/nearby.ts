import { useEffect, useMemo, useRef, useState } from 'react'
import { HUBS } from './data'
import {
  type LngLat,
  type NearestCity,
  currentPosition,
  haversineKm,
  hubCoord,
  nearestCity,
  roadMatrix,
} from './geo'
import type { Hub } from './types'

/* ═══════════════════════════════════════════════════════════════════════════
   "Nearest" — measured, not assumed.

   Before this, the nearest hub was `hubsInCity(cityId)[0]`: whichever one
   happened to be written first in the dataset. Every screen that said "nearest"
   was telling the user something nobody had checked.

   Ranking happens in two passes, because a correct answer that arrives in two
   seconds is worse than a good answer now and a correct one shortly after:

     1. Straight-line, instantly, with no network. The list renders and is
        usable on the frame it mounts.
     2. Real road distance from OSRM, one request for the whole city, swapped
        in when it lands. Only this pass can know that the hub 2 km away is
        across a railway line with no crossing and is really a 9 km drive.

   If the second pass never arrives the first one stands, and the UI says which
   of the two it is showing rather than passing a guess off as a measurement.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface RankedHub {
  hub: Hub
  /** Best distance known right now, km. */
  km: number
  /** Drive time in minutes — only ever set once the router has answered. */
  minutes: number | null
  /** True when `km` is a real road distance rather than a straight line. */
  road: boolean
}

/**
 * Straight-line ranking. Synchronous, allocation-cheap, and always available.
 *
 * With no origin the list keeps its dataset order and reports each hub's
 * distance from its own city centre, which is the only honest thing to say
 * when we do not know where the user is.
 */
export function rankHubs(from: LngLat | null, hubs: Hub[]): RankedHub[] {
  if (!from) {
    return hubs.map((hub) => ({ hub, km: hub.distanceKm, minutes: null, road: false }))
  }
  return hubs
    .map((hub) => ({
      hub,
      km: haversineKm(from, hubCoord(hub.id, hub.cityId)),
      minutes: null,
      road: false,
    }))
    .sort((a, b) => a.km - b.km)
}

/** Stable cache key for a road-matrix lookup. */
const matrixKey = (from: LngLat, hubs: Hub[]) =>
  `${from.lng.toFixed(4)},${from.lat.toFixed(4)}|${hubs.map((h) => h.id).join(',')}`

const matrixCache = new Map<string, RankedHub[]>()

/**
 * Hubs in a city, nearest first, refined to real driving distance when the
 * router answers.
 *
 * `refining` is true only while a road lookup is genuinely outstanding, so a
 * caller can show "checking traffic routes…" without it flickering on for the
 * straight-line pass that already rendered.
 */
export function useNearbyHubs(from: LngLat | null, cityId: string) {
  const hubs = useMemo(() => HUBS.filter((h) => h.cityId === cityId), [cityId])
  const base = useMemo(() => rankHubs(from, hubs), [from, hubs])

  const [refined, setRefined] = useState<RankedHub[] | null>(null)
  const [refining, setRefining] = useState(false)
  // Guards against a slow response for a previous city overwriting a newer one.
  const latest = useRef(0)

  useEffect(() => {
    if (!from || !hubs.length) {
      setRefined(null)
      setRefining(false)
      return
    }

    const key = matrixKey(from, hubs)
    const cached = matrixCache.get(key)
    if (cached) {
      setRefined(cached)
      setRefining(false)
      return
    }

    const ticket = ++latest.current
    setRefining(true)
    let alive = true

    roadMatrix(
      from,
      hubs.map((h) => hubCoord(h.id, h.cityId)),
    )
      .then((legs) => {
        if (!alive || ticket !== latest.current) return
        if (!legs) {
          setRefined(null)
          return
        }
        const ranked = hubs
          .map((hub, i) => ({
            hub,
            km: legs[i].km,
            minutes: legs[i].minutes,
            road: true,
          }))
          .sort((a, b) => a.km - b.km)
        matrixCache.set(key, ranked)
        setRefined(ranked)
      })
      .finally(() => {
        if (alive && ticket === latest.current) setRefining(false)
      })

    return () => {
      alive = false
    }
  }, [from, hubs])

  return { hubs: refined ?? base, refining, precise: refined !== null }
}

/* ── Where am I ──────────────────────────────────────────────────────────── */

export interface Located {
  coord: LngLat | null
  city: NearestCity | null
  loading: boolean
  /** The user declined, or the fix timed out. */
  denied: boolean
  locate: () => void
}

/**
 * The device's position plus which serviced city it falls in.
 *
 * Deliberately not automatic on mount: an unprompted permission dialog on the
 * first screen is the fastest way to get it denied permanently, and a denial
 * costs us the feature for good. Screens call `locate()` from a visible
 * control the user pressed.
 */
export function useMyLocation(): Located {
  const [coord, setCoord] = useState<LngLat | null>(null)
  const [loading, setLoading] = useState(false)
  const [denied, setDenied] = useState(false)

  const locate = () => {
    setLoading(true)
    setDenied(false)
    void currentPosition().then((p) => {
      setCoord(p)
      setDenied(p === null)
      setLoading(false)
    })
  }

  const city = useMemo(() => (coord ? nearestCity(coord) : null), [coord])

  return { coord, city, loading, denied, locate }
}

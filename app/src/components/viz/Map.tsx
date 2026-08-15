import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Map as MapLibreMap, LngLatBoundsLike } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, Minus, Navigation, Plus } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  MAP_STYLE,
  cityCoord,
  currentPosition,
  fetchRoute,
  hubCoord,
  pointAlong,
  type LngLat,
  type Route,
} from '@/lib/geo'

/* ═══════════════════════════════════════════════════════════════════════════
   Maps.

   Real OpenStreetMap vector tiles through MapLibre, real driving routes from
   OSRM. Nothing here is drawn by hand: the roads are the roads, and a route
   between two hubs follows the highway it would actually be driven on.

   The exported components keep the signatures the rest of the app already
   calls, so every screen picked this up without changing a line.

   Tiles need a network. Every component below renders its frame, pins and
   route immediately and lets the basemap paint in behind them, so a slow or
   absent connection costs you the streets, never the information.
   ═══════════════════════════════════════════════════════════════════════════ */

const ATTRIB = '© OpenStreetMap contributors'

/* Point MapLibre at the self-contained worker our Vite plugin emits at the
   site root. Left to itself it looks for a sibling of its own bundled chunk,
   finds nothing, and renders a map that never loads a single tile. Guarded so
   a single-file build — which has no sibling assets — keeps MapLibre's own
   resolution rather than pointing at a path that cannot exist. */
if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
  maplibregl.setWorkerUrl(new URL('/maplibre-gl-worker.js', window.location.origin).href)
}

/** Shared bootstrap: creates the map, cleans it up, exposes the instance. */
function useMapLibre(
  container: React.RefObject<HTMLDivElement | null>,
  opts: {
    dark?: boolean
    center: LngLat
    zoom: number
    interactive?: boolean
  },
) {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)
  const { dark, center, zoom, interactive = false } = opts

  useEffect(() => {
    if (!container.current) return
    const m = new maplibregl.Map({
      container: container.current,
      style: dark ? MAP_STYLE.dark : MAP_STYLE.light,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
      interactive,
      // The phone shell is small; a tilted camera wastes half of it.
      pitch: 0,
      dragRotate: false,
    })
    /* Readiness here means "the style spec is parsed and addLayer will work",
       which is what `styledata` signals. Deliberately NOT `load` or
       `isStyleLoaded()`: both additionally wait for every source tile to
       arrive, and on a slow connection or a software-rendered canvas that can
       take many seconds or never happen at all — leaving a map with roads but
       no route drawn on it. */
    const markReady = () => setReady(true)
    m.on('load', markReady)
    m.once('styledata', markReady)
    // Parent overlays (zoom, recentre) reach the instance through the DOM
    // rather than a prop chain, so every existing call site kept its props.
    ;(m.getContainer() as HTMLElement & { _dikkiMap?: MapLibreMap })._dikkiMap = m
    /* MapLibre measures its container once at construction and then only
       tracks *window* resizes. Several of these maps mount inside a parent
       that has no height yet (a lazy route, a collapsed card, a sheet that is
       still animating open), and a map that believes it is 0×0 requests no
       tiles at all — you get the style, the sprites, the TileJSON, and then a
       flat empty canvas forever. Watching the element itself is the fix. */
    const ro = new ResizeObserver(() => m.resize())
    ro.observe(container.current)

    setMap(m)
    return () => {
      ro.disconnect()
      m.remove()
      setMap(null)
      setReady(false)
    }
    // Style swaps are rare (light ↔ dark on a fixed screen), and rebuilding is
    // cheaper and more reliable than diffing layers across a style change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark])

  return { map, ready }
}

/** Circular pin with a ring — used for origin, destination and hubs. */
function pinEl(colour: string, size = 14, pulse = false) {
  const el = document.createElement('div')
  el.style.cssText = `
    width:${size}px;height:${size}px;border-radius:999px;background:${colour};
    box-shadow:0 0 0 4px ${colour}33, 0 1px 6px rgba(10,20,50,.35);
    border:2.5px solid #fff;
  `
  if (pulse) el.style.animation = 'dikkiconnect-ping 2s var(--ease-smooth) infinite'
  return el
}

/** Vehicle puck — a filled arrow that sits on the travelled portion. */
function puckEl() {
  const el = document.createElement('div')
  el.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#0b0e15" stroke="#fff" stroke-width="2"/>
    <path d="M12 6.5 16 16l-4-2.2L8 16z" fill="#7ba5ff"/>
  </svg>`
  el.style.cssText = 'width:30px;height:30px;filter:drop-shadow(0 2px 6px rgba(10,20,50,.4))'
  return el
}

/** Fits the camera to a set of points with sensible mobile padding. */
function fitTo(map: MapLibreMap, points: LngLat[], pad = 46) {
  if (points.length === 0) return
  if (points.length === 1) {
    map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 12.5 })
    return
  }
  const lngs = points.map((p) => p.lng)
  const lats = points.map((p) => p.lat)
  const bounds: LngLatBoundsLike = [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
  map.fitBounds(bounds, { padding: pad, duration: 0, maxZoom: 14 })
}

/** Draws (or redraws) the route line as a cased, two-tone path. */
function drawRoute(
  map: MapLibreMap,
  coords: Array<[number, number]>,
  progress: number | undefined,
  dark: boolean | undefined,
): boolean {
  const done = progress == null ? coords.length : Math.round(coords.length * progress)
  const layers: Array<[string, Array<[number, number]>, string, number]> = [
    ['dikki-route-case', coords, dark ? '#0b1020' : '#ffffff', 11],
    ['dikki-route-full', coords, dark ? '#3a4a72' : '#c3d2f3', 5.5],
    ['dikki-route-done', coords.slice(0, Math.max(2, done)), '#1650e0', 5.5],
  ]

  try {
    for (const [id, line, colour, width] of layers) {
      const data: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: line },
      }
      const existing = map.getSource(id) as maplibregl.GeoJSONSource | undefined
      if (existing) {
        existing.setData(data)
        continue
      }
      map.addSource(id, { type: 'geojson', data })
      map.addLayer({
        id,
        type: 'line',
        source: id,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': colour, 'line-width': width },
      })
    }
    // The untravelled portion must never paint over the travelled one.
    if (progress != null && map.getLayer('dikki-route-done')) {
      map.moveLayer('dikki-route-done')
    }
    return true
  } catch {
    // Style not parsed yet — the caller retries on the next styledata.
    return false
  }
}

/** Small attribution chip — OSM's licence requires visible credit. */
function Attribution({ dark }: { dark?: boolean }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute bottom-1 left-1.5 z-10 rounded px-1.5 py-0.5 text-[8.5px] font-medium',
        dark ? 'bg-black/35 text-white/60' : 'bg-white/70 text-ink-400',
      )}
    >
      {ATTRIB}
    </span>
  )
}

/* ── RouteMap ────────────────────────────────────────────────────────────── */

/**
 * A real driving route between two points. Give it hub ids or city ids and it
 * fetches the road geometry; `progress` splits the line at the vehicle.
 */
export function RouteMap({
  height = 190,
  dark,
  className,
  fromLabel,
  toLabel,
  progress,
  portrait,
  from,
  to,
  fromHubId,
  toHubId,
  fromCityId = 'blr',
  toCityId = 'mys',
}: {
  height?: number | string
  dark?: boolean
  className?: string
  fromLabel?: string
  toLabel?: string
  /** 0–1 along the route; renders a vehicle puck when provided. */
  progress?: number
  /** Kept for call-site compatibility; MapLibre handles aspect itself. */
  portrait?: boolean
  /** Explicit endpoints win over the hub/city ids. */
  from?: LngLat
  to?: LngLat
  fromHubId?: string
  toHubId?: string
  fromCityId?: string
  toCityId?: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const puck = useRef<maplibregl.Marker | null>(null)

  const a = useMemo<LngLat>(
    () => from ?? (fromHubId ? hubCoord(fromHubId, fromCityId) : cityCoord(fromCityId)),
    [from, fromHubId, fromCityId],
  )
  const b = useMemo<LngLat>(
    () => to ?? (toHubId ? hubCoord(toHubId, toCityId) : cityCoord(toCityId)),
    [to, toHubId, toCityId],
  )

  const mid = { lng: (a.lng + b.lng) / 2, lat: (a.lat + b.lat) / 2 }
  const { map, ready } = useMapLibre(container, { dark, center: mid, zoom: 7 })

  // Real road geometry. Falls back to the straight line if OSRM is unreachable.
  useEffect(() => {
    let live = true
    fetchRoute(a, b).then((r) => {
      if (!live) return
      setRoute(
        r ?? {
          coordinates: [
            [a.lng, a.lat],
            [b.lng, b.lat],
          ],
          distanceKm: 0,
          durationMin: 0,
        },
      )
    })
    return () => {
      live = false
    }
  }, [a, b])

  useEffect(() => {
    if (!map || !ready || !route) return

    if (!drawRoute(map, route.coordinates, progress, dark)) {
      // Too early. One retry on the next style event covers the race.
      map.once('styledata', () => drawRoute(map, route.coordinates, progress, dark))
    }

    markers.current.forEach((m) => m.remove())
    markers.current = [
      new maplibregl.Marker({ element: pinEl('#1650e0') }).setLngLat([a.lng, a.lat]).addTo(map),
      new maplibregl.Marker({ element: pinEl('#12a150') }).setLngLat([b.lng, b.lat]).addTo(map),
    ]

    fitTo(
      map,
      route.coordinates.map(([lng, lat]) => ({ lng, lat })),
      portrait ? 60 : 44,
    )
  }, [map, ready, route, dark, a, b, portrait, progress])

  // Vehicle puck rides the real geometry.
  useEffect(() => {
    if (!map || !ready || !route || progress == null) return
    const at = pointAlong(route.coordinates, progress)
    if (!puck.current) {
      puck.current = new maplibregl.Marker({ element: puckEl() }).setLngLat([at.lng, at.lat]).addTo(map)
    } else {
      puck.current.setLngLat([at.lng, at.lat])
    }
  }, [map, ready, route, progress])

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <div ref={container} className="size-full" />

      {(fromLabel || toLabel) && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2.5">
          {fromLabel && <MapChip label={fromLabel} tone="brand" />}
          {toLabel && <MapChip label={toLabel} tone="success" />}
        </div>
      )}
      <Attribution dark={dark} />
    </div>
  )
}

function MapChip({ label, tone }: { label: string; tone: 'brand' | 'success' }) {
  return (
    <span className="inline-flex max-w-[46%] items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1 text-[10.5px] font-bold text-ink-700 shadow-(--shadow-e1) backdrop-blur-sm">
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          tone === 'brand' ? 'bg-brand-600' : 'bg-success-500',
        )}
      />
      <span className="truncate">{label}</span>
    </span>
  )
}

/* ── LiveMap ─────────────────────────────────────────────────────────────── */

/** Tracking view — a moving vehicle on a real route, with working controls. */
export function LiveMap({
  height = 320,
  dark,
  className,
  children,
  portrait,
  fromHubId,
  toHubId,
  fromCityId = 'blr',
  toCityId = 'mys',
  progress,
}: {
  height?: number | string
  dark?: boolean
  className?: string
  children?: React.ReactNode
  portrait?: boolean
  fromHubId?: string
  toHubId?: string
  fromCityId?: string
  toCityId?: string
  /** Fixed position along the route; omit to animate. */
  progress?: number
}) {
  const [t, setT] = useState(progress ?? 0.34)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (progress != null) {
      setT(progress)
      return
    }
    const id = setInterval(() => setT((v) => (v >= 0.94 ? 0.06 : v + 0.004)), 220)
    return () => clearInterval(id)
  }, [progress])

  /* The controls drive the real camera. Reaching into the canvas for the map
     instance keeps LiveMap's props identical to what every screen already
     passes, which is worth more here than a tidier handle. */
  const withMap = (fn: (m: MapLibreMap) => void) => () => {
    const canvas = wrap.current?.querySelector('.maplibregl-map') as
      | (HTMLElement & { _dikkiMap?: MapLibreMap })
      | null
    const m = canvas?._dikkiMap
    if (m) fn(m)
  }

  return (
    <div ref={wrap} className={cn('relative overflow-hidden', className)} style={{ height }}>
      <RouteMap
        height="100%"
        dark={dark}
        progress={t}
        portrait={portrait}
        fromHubId={fromHubId}
        toHubId={toHubId}
        fromCityId={fromCityId}
        toCityId={toCityId}
      />

      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <IconButton
          icon={<Plus size={16} />}
          label="Zoom in"
          tone="glass"
          size={36}
          onClick={withMap((m) => m.zoomIn({ duration: 260 }))}
        />
        <IconButton
          icon={<Minus size={16} />}
          label="Zoom out"
          tone="glass"
          size={36}
          onClick={withMap((m) => m.zoomOut({ duration: 260 }))}
        />
        <IconButton icon={<Layers size={16} />} label="Map layers" tone="glass" size={36} />
      </div>
      <div className="absolute right-3 bottom-3 z-20">
        <IconButton
          icon={<Navigation size={16} className="fill-current" />}
          label="Recentre on me"
          tone="solid"
          size={40}
          onClick={async () => {
            const here = await currentPosition()
            const m = (
              wrap.current?.querySelector('.maplibregl-map') as
                | (HTMLElement & { _dikkiMap?: MapLibreMap })
                | null
            )?._dikkiMap
            if (here && m) m.flyTo({ center: [here.lng, here.lat], zoom: 14, duration: 900 })
          }}
        />
      </div>

      {children}
    </div>
  )
}

/* ── HubMap ──────────────────────────────────────────────────────────────── */

/** Hub locator — every hub in a city, the selected one highlighted. */
export function HubMap({
  height = 160,
  count = 4,
  activeIndex = 0,
  className,
  hubIds,
  cityId = 'blr',
}: {
  height?: number
  /** Kept for call-site compatibility when no ids are passed. */
  count?: number
  activeIndex?: number
  className?: string
  hubIds?: string[]
  cityId?: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const markers = useRef<maplibregl.Marker[]>([])

  const points = useMemo<LngLat[]>(() => {
    if (hubIds?.length) return hubIds.map((id) => hubCoord(id, cityId))
    // No ids given: show the city itself rather than inventing pins.
    return [cityCoord(cityId)]
  }, [hubIds, cityId])

  const { map, ready } = useMapLibre(container, {
    dark: false,
    center: points[0],
    zoom: 11,
  })

  useEffect(() => {
    if (!map || !ready) return
    markers.current.forEach((m) => m.remove())
    markers.current = points.map((p, i) =>
      new maplibregl.Marker({
        element: pinEl(i === activeIndex ? '#1650e0' : '#8fa3c8', i === activeIndex ? 16 : 11),
      })
        .setLngLat([p.lng, p.lat])
        .addTo(map),
    )
    fitTo(map, points, 52)
  }, [map, ready, points, activeIndex, count])

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <div ref={container} className="size-full" />
      <Attribution />
    </div>
  )
}

/* ── PickMap ─────────────────────────────────────────────────────────────── */

/**
 * A single draggable pin. Used by the P2P booking flow to confirm exactly
 * where a traveler should knock — a typed address gets you to the street, the
 * pin gets you to the door.
 */
export function PickMap({
  at,
  onMove,
  height = 200,
  className,
}: {
  at: LngLat
  onMove?: (p: LngLat) => void
  height?: number | string
  className?: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  const { map, ready } = useMapLibre(container, {
    dark: false,
    center: at,
    zoom: 15,
    interactive: true,
  })

  useEffect(() => {
    if (!map || !ready) return
    if (!marker.current) {
      marker.current = new maplibregl.Marker({ element: pinEl('#1650e0', 16), draggable: true })
        .setLngLat([at.lng, at.lat])
        .addTo(map)
      marker.current.on('dragend', () => {
        const p = marker.current!.getLngLat()
        onMove?.({ lng: p.lng, lat: p.lat })
      })
    } else {
      marker.current.setLngLat([at.lng, at.lat])
    }
    map.easeTo({ center: [at.lng, at.lat], duration: 420 })
  }, [map, ready, at, onMove])

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <div ref={container} className="size-full" />
      <span className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center text-[10.5px] font-bold text-ink-500">
        Drag the pin to the exact door
      </span>
      <Attribution />
    </div>
  )
}

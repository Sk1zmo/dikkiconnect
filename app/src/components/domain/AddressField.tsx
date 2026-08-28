import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Briefcase,
  Check,
  Clock,
  Crosshair,
  Home,
  Loader2,
  Map as MapIcon,
  MapPin,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'
import { CentrePinMap, PickMap } from '@/components/viz/Map'
import { Button, Field, Sheet } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useApp } from '@/lib/store'
import {
  type PlaceLabel,
  type SavedPlace,
  LABEL_META,
  findSaved,
  placeFull,
  placeTitle,
  sortPlaces,
} from '@/lib/places'
import {
  type LngLat,
  type Place,
  cityCoord,
  currentPosition,
  geocode,
  nearestCity,
  reverseGeocode,
} from '@/lib/geo'

/**
 * Address entry, door-level.
 *
 * Three ways in, in the order people actually reach for them:
 *
 *   1. An address they have used before — saved or recent. This is the common
 *      case by a wide margin and costs one tap, so it sits above the search
 *      results rather than below them, and it shows before a single character
 *      is typed.
 *   2. Their current position, reverse-geocoded.
 *   3. Typing, which searches OpenStreetMap.
 *
 * Whichever route, the result is a coordinate plus a street line. The flat
 * number and the landmark are collected separately underneath, because no
 * geocoder can supply them and they are the two things a driver standing
 * outside at 9pm actually needs.
 *
 * Search is debounced to 450ms — Nominatim's fair-use policy is one request a
 * second, and a request per keystroke would breach it inside a word.
 */
export function AddressField({
  label,
  placeholder,
  value,
  onChange,
  coord,
  onCoord,
  flat,
  onFlat,
  landmark,
  onLandmark,
  hint,
  showMap = true,
  cityId = 'blr',
  onCityChange,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  coord?: LngLat
  onCoord?: (p: LngLat) => void
  /** Flat / house / floor. Omit both to hide the door-detail fields. */
  flat?: string
  onFlat?: (v: string) => void
  landmark?: string
  onLandmark?: (v: string) => void
  hint?: string
  showMap?: boolean
  /** Where the map opens when there is nothing to centre on yet. */
  cityId?: string
  /** Fired when the chosen point lands in a different serviced city. */
  onCityChange?: (cityId: string) => void
}) {
  const { places, savePlace, removePlace, touchPlace, recents, rememberRecent } = useApp()

  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Map picker state. `draft` is where the crosshair currently sits; nothing
     is committed until Confirm, so panning around never clobbers a good
     address the user already had. */
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draft, setDraft] = useState<LngLat | null>(null)
  const [draftLabel, setDraftLabel] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  // Suppresses the search that a programmatic value change would otherwise
  // trigger — picking a suggestion must not reopen the suggestion list.
  const skipNext = useRef(false)

  const [saveOpen, setSaveOpen] = useState(false)

  const saved = useMemo(() => sortPlaces(places), [places])
  /** The saved entry for the address currently in the field, if any. */
  const current = coord ? findSaved(places, coord) : undefined

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false
      return
    }
    if (timer.current) clearTimeout(timer.current)
    if (value.trim().length < 4) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    timer.current = setTimeout(async () => {
      const places = await geocode(value, 5)
      setResults(places)
      setSearching(false)
    }, 450)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [value])

  const q = value.trim().toLowerCase()
  const matches = (text: string) => q.length < 2 || text.toLowerCase().includes(q)

  const savedMatches = saved.filter((p) => matches(`${placeTitle(p)} ${placeFull(p)}`)).slice(0, 4)
  const recentMatches = recents
    .filter((r) => matches(r.line) && !findSaved(places, r.coord))
    .slice(0, 3)

  const hasSuggestions = savedMatches.length > 0 || recentMatches.length > 0 || results.length > 0

  /** Commit a chosen point, and tell the caller if it changed city. */
  const commit = (line: string, at: LngLat, detail?: { flat?: string; landmark?: string }) => {
    skipNext.current = true
    onChange(line)
    onCoord?.(at)
    onFlat?.(detail?.flat ?? '')
    onLandmark?.(detail?.landmark ?? '')

    const city = nearestCity(at)
    if (city.serviced && city.cityId !== cityId) onCityChange?.(city.cityId)

    setOpen(false)
    setResults([])
  }

  const pickSearchResult = (p: Place) => {
    commit(p.label, { lng: p.lng, lat: p.lat })
    rememberRecent({ line: p.label, coord: { lng: p.lng, lat: p.lat }, cityId })
  }

  const pickSaved = (p: SavedPlace) => {
    touchPlace(p.id)
    commit(p.line, p.coord, { flat: p.flat, landmark: p.landmark })
  }

  const openPicker = async () => {
    setPickerOpen(true)
    setOpen(false)
    const start = coord ?? cityCoord(cityId)
    setDraft(start)
    setDraftLabel(null)
    setResolving(true)
    const address = await reverseGeocode(start)
    setDraftLabel(address)
    setResolving(false)
  }

  /** Called when the map stops moving — one lookup per gesture. */
  const onSettle = async (p: LngLat) => {
    setDraft(p)
    setResolving(true)
    setDraftLabel(null)
    const address = await reverseGeocode(p)
    setDraftLabel(address)
    setResolving(false)
  }

  const confirmPicked = () => {
    if (!draft) return
    // Keep any flat/landmark already typed — re-pinning the map corrects the
    // position, and should not throw away the door detail with it.
    commit(draftLabel ?? value, draft, { flat, landmark })
    if (draftLabel) rememberRecent({ line: draftLabel, coord: draft, cityId })
    setPickerOpen(false)
  }

  const useMyLocation = async () => {
    setLocating(true)
    const here = await currentPosition()
    if (here) {
      const address = await reverseGeocode(here)
      commit(address ?? 'Current location', here, { flat, landmark })
      if (address) rememberRecent({ line: address, coord: here, cityId })
    }
    setLocating(false)
  }

  const showDetail = Boolean(coord) && (onFlat || onLandmark)

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label className="text-[12.5px] font-semibold text-ink-700">{label}</label>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={openPicker}
            className="pressable-sm inline-flex items-center gap-1.5 text-[11.5px] font-bold text-brand-600"
          >
            <MapIcon size={12} />
            Select on map
          </button>
          <span className="h-3 w-px bg-ink-200" />
          <button
            type="button"
            onClick={useMyLocation}
            className="pressable-sm inline-flex items-center gap-1.5 text-[11.5px] font-bold text-brand-600"
          >
            {locating ? <Loader2 size={12} className="anim-spin" /> : <Crosshair size={12} />}
            {locating ? 'Locating…' : 'Use my location'}
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={2}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Late enough for a tap on the list to register as a click first.
            setTimeout(() => setOpen(false), 140)
          }}
          className={cn(
            'focus-ring w-full resize-none rounded-(--radius-md) border-2 border-ink-200 bg-white',
            'px-3.5 py-3 text-[14px] leading-snug text-ink-900 outline-none',
            'placeholder:text-ink-400 focus:border-brand-500',
          )}
        />
        {searching && (
          <Loader2 size={14} className="anim-spin absolute top-3.5 right-3 text-ink-400" />
        )}

        {open && (hasSuggestions || locating) && (
          <div
            data-address-suggestions
            role="listbox"
            /* Keeps the textarea focused so the list is still mounted when the
               click lands on it. */
            onMouseDown={(e) => e.preventDefault()}
            className="anim-fade-in absolute inset-x-0 top-full z-30 mt-1.5 max-h-[340px] overflow-y-auto rounded-(--radius-md) border border-ink-200 bg-white shadow-(--shadow-e3)"
          >
            <button
              type="button"
              onClick={useMyLocation}
              className="flex w-full items-center gap-2.5 border-b border-ink-100 px-3.5 py-3 text-left transition-colors hover:bg-ink-50"
            >
              {locating ? (
                <Loader2 size={14} className="anim-spin shrink-0 text-brand-600" />
              ) : (
                <Crosshair size={14} className="shrink-0 text-brand-600" />
              )}
              <span className="text-[13px] font-bold text-brand-700">
                {locating ? 'Finding you…' : 'Use my current location'}
              </span>
            </button>

            {savedMatches.length > 0 && (
              <>
                <SuggestionHeading>Saved addresses</SuggestionHeading>
                {savedMatches.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={current?.id === p.id}
                    onClick={() => pickSaved(p)}
                    className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-ink-50"
                  >
                    <LabelIcon label={p.label} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink-900">
                        {placeTitle(p)}
                      </span>
                      <span className="truncate-2 block text-[11.5px] text-ink-500">
                        {placeFull(p)}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}

            {recentMatches.length > 0 && (
              <>
                <SuggestionHeading>Recent</SuggestionHeading>
                {recentMatches.map((r, i) => (
                  <button
                    key={`${r.coord.lat}-${r.coord.lng}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => commit(r.line, r.coord)}
                    className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-ink-50"
                  >
                    <Clock size={14} className="mt-0.5 shrink-0 text-ink-400" />
                    <span className="truncate-2 min-w-0 text-[12.5px] text-ink-700">{r.line}</span>
                  </button>
                ))}
              </>
            )}

            {results.length > 0 && (
              <>
                <SuggestionHeading>Search results</SuggestionHeading>
                {results.map((p, i) => (
                  <button
                    key={`${p.lat}-${p.lng}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => pickSearchResult(p)}
                    className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-ink-50"
                  >
                    <MapPin size={14} className="mt-0.5 shrink-0 text-brand-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink-900">
                        {p.name}
                      </span>
                      <span className="truncate-2 block text-[11.5px] text-ink-500">{p.label}</span>
                    </span>
                  </button>
                ))}
                <p className="border-t border-ink-100 bg-ink-50 px-3.5 py-1.5 text-[9.5px] text-ink-400">
                  Results from OpenStreetMap
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {hint && <p className="mt-1.5 text-[11.5px] text-ink-500">{hint}</p>}

      {/* ── Door detail — the part no geocoder can supply ─────────────────── */}
      {showDetail && (
        <div className="anim-fade-in mt-3 grid grid-cols-2 gap-2.5">
          {onFlat && (
            <Field
              label="Flat / house / floor"
              value={flat ?? ''}
              onChange={(e) => onFlat(e.target.value)}
              placeholder="3B, 2nd floor"
            />
          )}
          {onLandmark && (
            <Field
              label="Landmark"
              value={landmark ?? ''}
              onChange={(e) => onLandmark(e.target.value)}
              placeholder="Behind the pharmacy"
            />
          )}
        </div>
      )}

      {showMap && coord && (
        <div className="anim-fade-in mt-2.5 overflow-hidden rounded-(--radius-md) border border-ink-200">
          <PickMap at={coord} onMove={onCoord} height={168} />
          <div className="flex items-stretch border-t border-ink-200 bg-white">
            <button
              type="button"
              onClick={openPicker}
              className="pressable flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold text-ink-700"
            >
              <Pencil size={12} />
              Adjust on the map
            </button>
            <span className="w-px bg-ink-200" />
            <button
              type="button"
              onClick={() => setSaveOpen(true)}
              className={cn(
                'pressable flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold',
                current ? 'text-success-600' : 'text-brand-600',
              )}
            >
              {current ? <Check size={12} /> : <Star size={12} />}
              {current ? `Saved as ${placeTitle(current)}` : 'Save this address'}
            </button>
          </div>
        </div>
      )}

      {/* ── Map picker ───────────────────────────────────────────────────── */}
      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Pin the exact spot"
        subtitle="Move the map — the pin stays put"
        fullHeight
      >
        <div className="flex h-full flex-col">
          <div className="-mx-5 flex-1 overflow-hidden">
            {draft && <CentrePinMap at={draft} onSettle={onSettle} className="size-full" />}
          </div>

          <div className="shrink-0 pt-4">
            <div className="flex items-start gap-3 rounded-(--radius-md) border border-ink-200 bg-white p-3.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                  Selected location
                </p>
                {resolving ? (
                  <p className="mt-1 flex items-center gap-2 text-[13px] text-ink-400">
                    <Loader2 size={13} className="anim-spin" />
                    Finding the address…
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] leading-snug font-semibold text-ink-800">
                    {draftLabel ?? 'Drop the pin anywhere to name it'}
                  </p>
                )}
              </div>
            </div>

            <Button
              block
              size="lg"
              className="mt-3"
              disabled={!draft || resolving}
              onClick={confirmPicked}
            >
              Confirm this location
            </Button>
          </div>
        </div>
      </Sheet>

      {/* ── Save to the address book ─────────────────────────────────────── */}
      <SavePlaceSheet
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        existing={current}
        line={value}
        flat={flat}
        landmark={landmark}
        coord={coord}
        cityId={cityId}
        onSave={savePlace}
        onRemove={removePlace}
      />
    </div>
  )
}

/* ── Bits ────────────────────────────────────────────────────────────────── */

function SuggestionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-y border-ink-100 bg-ink-50/70 px-3.5 py-1.5 text-[10px] font-bold tracking-wide text-ink-400 uppercase">
      {children}
    </p>
  )
}

export function LabelIcon({ label, size = 14 }: { label: PlaceLabel; size?: number }) {
  const Icon = label === 'home' ? Home : label === 'work' ? Briefcase : MapPin
  return <Icon size={size} className="mt-0.5 shrink-0 text-brand-600" />
}

function SavePlaceSheet({
  open,
  onClose,
  existing,
  line,
  flat,
  landmark,
  coord,
  cityId,
  onSave,
  onRemove,
}: {
  open: boolean
  onClose: () => void
  existing?: SavedPlace
  line: string
  flat?: string
  landmark?: string
  coord?: LngLat
  cityId: string
  onSave: ReturnType<typeof useApp>['savePlace']
  onRemove: (id: string) => void
}) {
  const [label, setLabel] = useState<PlaceLabel>('home')
  const [nickname, setNickname] = useState('')

  // Re-seed each time it opens, so editing an existing place starts from what
  // that place actually is rather than from the last thing that was saved.
  useEffect(() => {
    if (!open) return
    setLabel(existing?.label ?? 'home')
    setNickname(existing?.nickname ?? '')
  }, [open, existing])

  const save = () => {
    if (!coord) return
    onSave({
      id: existing?.id,
      label,
      nickname: label === 'other' ? nickname.trim() || undefined : undefined,
      line,
      flat: flat?.trim() || undefined,
      landmark: landmark?.trim() || undefined,
      coord,
      cityId,
    })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Edit saved address' : 'Save this address'}
      subtitle="It will be one tap away next time"
    >
      <div className="grid grid-cols-3 gap-2.5">
        {(['home', 'work', 'other'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLabel(l)}
            className={cn(
              'springy focus-ring flex flex-col items-center gap-1.5 rounded-(--radius-md) border-2 px-3 py-3.5',
              label === l
                ? 'border-brand-600 bg-brand-50/60 shadow-(--shadow-brand-sm)'
                : 'border-ink-200 bg-white hover:border-ink-300',
            )}
          >
            <LabelIcon label={l} size={18} />
            <span className="text-[12.5px] font-bold text-ink-900">{LABEL_META[l].title}</span>
          </button>
        ))}
      </div>

      {label === 'other' && (
        <div className="anim-fade-in mt-4">
          <Field
            label="Name this address"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Mum's place, the warehouse…"
          />
        </div>
      )}

      <div className="mt-4 rounded-(--radius-md) border border-ink-200 bg-ink-50/60 p-3.5">
        <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">Address</p>
        <p className="mt-1 text-[13px] leading-snug text-ink-700">
          {[flat?.trim(), line, landmark?.trim() && `Near ${landmark.trim()}`]
            .filter(Boolean)
            .join(', ')}
        </p>
      </div>

      <Button block size="lg" className="mt-4" disabled={!coord} onClick={save}>
        {existing ? 'Update' : 'Save address'}
      </Button>

      {existing && (
        <button
          type="button"
          onClick={() => {
            onRemove(existing.id)
            onClose()
          }}
          className="pressable mt-2.5 flex w-full items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-bold text-danger-600"
        >
          <Trash2 size={13} />
          Remove from saved
        </button>
      )}
    </Sheet>
  )
}

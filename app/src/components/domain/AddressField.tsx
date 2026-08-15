import { useEffect, useRef, useState } from 'react'
import { Crosshair, Loader2, Map as MapIcon, MapPin, Pencil } from 'lucide-react'
import { CentrePinMap, PickMap } from '@/components/viz/Map'
import { Button, Sheet } from '@/components/ui'
import { cn } from '@/lib/cn'
import { cityCoord, currentPosition, geocode, reverseGeocode, type LngLat, type Place } from '@/lib/geo'

/**
 * Address entry backed by real geocoding.
 *
 * Typing searches OpenStreetMap and offers real places; picking one drops a
 * pin on a real map that can be dragged to the exact door. "Use my location"
 * reverse-geocodes the device's actual GPS fix.
 *
 * Search is debounced to 450ms because Nominatim's fair-use policy is one
 * request per second and a keystroke-per-request would breach it within a
 * word.
 */
export function AddressField({
  label,
  placeholder,
  value,
  onChange,
  coord,
  onCoord,
  hint,
  showMap = true,
  cityId = 'blr',
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  coord?: LngLat
  onCoord?: (p: LngLat) => void
  hint?: string
  showMap?: boolean
  /** Where the map opens when there is nothing to centre on yet. */
  cityId?: string
}) {
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

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false
      return
    }
    if (timer.current) clearTimeout(timer.current)
    if (value.trim().length < 4) {
      setResults([])
      return
    }
    setSearching(true)
    timer.current = setTimeout(async () => {
      const places = await geocode(value, 5)
      setResults(places)
      setSearching(false)
      setOpen(places.length > 0)
    }, 450)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [value])

  const pick = (p: Place) => {
    skipNext.current = true
    onChange(p.label)
    onCoord?.({ lng: p.lng, lat: p.lat })
    setOpen(false)
    setResults([])
  }

  const openPicker = async () => {
    setPickerOpen(true)
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
    onCoord?.(draft)
    if (draftLabel) {
      skipNext.current = true
      onChange(draftLabel)
    }
    setPickerOpen(false)
  }

  const useMyLocation = async () => {
    setLocating(true)
    const here = await currentPosition()
    if (here) {
      onCoord?.(here)
      const address = await reverseGeocode(here)
      if (address) {
        skipNext.current = true
        onChange(address)
      }
    }
    setLocating(false)
  }

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
          onFocus={() => results.length > 0 && setOpen(true)}
          className={cn(
            'focus-ring w-full resize-none rounded-(--radius-md) border-2 border-ink-200 bg-white',
            'px-3.5 py-3 text-[14px] leading-snug text-ink-900 outline-none',
            'placeholder:text-ink-400 focus:border-brand-500',
          )}
        />
        {searching && (
          <Loader2 size={14} className="anim-spin absolute top-3.5 right-3 text-ink-400" />
        )}

        {open && results.length > 0 && (
          <div
            data-address-suggestions
            role="listbox"
            className="anim-fade-in absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-(--radius-md) border border-ink-200 bg-white shadow-(--shadow-e3)"
          >
            {results.map((p, i) => (
              <button
                key={`${p.lat}-${p.lng}-${i}`}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => pick(p)}
                className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-ink-50"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-brand-600" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-ink-900">{p.name}</span>
                  <span className="truncate-2 block text-[11.5px] text-ink-500">{p.label}</span>
                </span>
              </button>
            ))}
            <p className="border-t border-ink-100 bg-ink-50 px-3.5 py-1.5 text-[9.5px] text-ink-400">
              Results from OpenStreetMap
            </p>
          </div>
        )}
      </div>

      {hint && <p className="mt-1.5 text-[11.5px] text-ink-500">{hint}</p>}

      {showMap && coord && (
        <div className="anim-fade-in mt-2.5 overflow-hidden rounded-(--radius-md) border border-ink-200">
          <PickMap at={coord} onMove={onCoord} height={168} />
          <button
            type="button"
            onClick={openPicker}
            className="pressable flex w-full items-center justify-center gap-1.5 border-t border-ink-200 bg-white py-2.5 text-[12px] font-bold text-ink-700"
          >
            <Pencil size={12} />
            Adjust on the map
          </button>
        </div>
      )}

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
    </div>
  )
}

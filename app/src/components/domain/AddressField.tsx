import { useEffect, useRef, useState } from 'react'
import { Crosshair, MapPin, Loader2 } from 'lucide-react'
import { PickMap } from '@/components/viz/Map'
import { cn } from '@/lib/cn'
import { currentPosition, geocode, reverseGeocode, type LngLat, type Place } from '@/lib/geo'

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
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  coord?: LngLat
  onCoord?: (p: LngLat) => void
  hint?: string
  showMap?: boolean
}) {
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
        <button
          type="button"
          onClick={useMyLocation}
          className="pressable-sm inline-flex items-center gap-1.5 text-[11.5px] font-bold text-brand-600"
        >
          {locating ? (
            <Loader2 size={12} className="anim-spin" />
          ) : (
            <Crosshair size={12} />
          )}
          {locating ? 'Locating…' : 'Use my location'}
        </button>
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
        </div>
      )}
    </div>
  )
}

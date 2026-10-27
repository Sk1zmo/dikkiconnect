import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Camera } from '@phosphor-icons/react'
import { cn } from '@/lib/cn'
import { Spinner } from '@/components/ui'
import { capturePhoto } from '@/lib/photo'
import { explain, photos, type Checkpoint } from '@/lib/api'

/* ═══════════════════════════════════════════════════════════════════════════
   Camera-adjacent surfaces: QR ticket, QR scanner, photo capture.
   The scanner and the capture both use the device's real camera. See the
   notes above each one for what that costs and where it is not available.
   ═══════════════════════════════════════════════════════════════════════════ */

/** The scannable ticket a sender shows at the hub counter. */
export function QrTicket({
  value,
  caption,
  size = 190,
  className,
}: {
  value: string
  caption?: string
  size?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative rounded-(--radius-lg) bg-white p-4 shadow-(--shadow-e2) ring-1 ring-ink-100">
        {/* corner brackets */}
        {(
          [
            'top-2 left-2 border-t-2 border-l-2 rounded-tl-md',
            'top-2 right-2 border-t-2 border-r-2 rounded-tr-md',
            'bottom-2 left-2 border-b-2 border-l-2 rounded-bl-md',
            'bottom-2 right-2 border-b-2 border-r-2 rounded-br-md',
          ] as const
        ).map((pos) => (
          <span key={pos} className={cn('absolute size-5 border-brand-500', pos)} />
        ))}
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          fgColor="#131b2e"
          bgColor="#ffffff"
          marginSize={0}
        />
      </div>
      {caption && (
        <p className="tabular mt-3 text-[13px] font-bold tracking-[0.08em] text-ink-700">{caption}</p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   The scanner, now pointed at the world.

   What was here before drew a cardboard box in SVG and fired `onDetect` on a
   2.8-second timer, whatever the phone was pointed at. It read nothing. In a
   hub doorway that is worse than no scanner at all: it reports a match for
   the parcel the app already had in mind, which is precisely the mistake the
   scan exists to catch.

   This opens the real camera and reads real QR codes:

   • `BarcodeDetector` does the decoding. It ships in Android's WebView and
     Chrome, which is where the hub and traveller portals are actually used,
     and it needs no library — a bundled decoder would add more weight than
     the rest of the screen.
   • Where it is missing (iOS Safari to this day), the camera still shows, and
     the screen says plainly that this device cannot scan and the ID has to be
     typed. Every caller already has a manual-entry sheet behind the keyboard
     button, so that path is complete rather than a dead end.
   • A refused camera permission is reported as what it is, with the same way
     out. It is not treated as a failure to recover from silently.
   ═══════════════════════════════════════════════════════════════════════════ */

/** The slice of the BarcodeDetector API this uses. Not in lib.dom yet. */
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike

const detectorCtor = (): BarcodeDetectorCtor | null =>
  (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null

/** How often to look at the frame. 180ms reads instantly and stays cool. */
const SCAN_INTERVAL_MS = 180

type CameraState = 'starting' | 'live' | 'denied' | 'unavailable' | 'no-decoder'

/** Live scanner viewfinder — real camera, real QR decoding. */
export function ScannerViewfinder({
  onDetect,
  hint = 'Point at the parcel QR code',
  children,
}: {
  /** Receives the decoded text. Called once; the loop stops on the first read. */
  onDetect?: (value: string) => void
  hint?: string
  children?: React.ReactNode
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<CameraState>('starting')
  const [locked, setLocked] = useState(false)

  /* Held in a ref so the effect does not restart the camera every time a
     parent re-renders with a fresh closure. A restarting camera flashes black
     and loses a second, which reads as the app struggling. */
  const detectRef = useRef(onDetect)
  detectRef.current = onDetect

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | undefined
    let done = false

    const stop = () => {
      done = true
      window.clearInterval(timer)
      stream?.getTracks().forEach((t) => t.stop())
      stream = null
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('unavailable')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
      } catch (e) {
        /* NotAllowedError is a refusal; anything else is a device that cannot
           give us a camera. They need different words on screen. */
        setState((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'unavailable')
        return
      }
      if (done) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      /* `muted` and `playsInline` are what stop iOS opening the system
         full-screen player over the top of the whole screen. */
      video.muted = true
      video.playsInline = true
      await video.play().catch(() => {})

      const Ctor = detectorCtor()
      if (!Ctor) {
        setState('no-decoder')
        return
      }
      setState('live')

      const detector = new Ctor({ formats: ['qr_code'] })
      timer = window.setInterval(() => {
        if (done || video.readyState < 2) return
        void detector
          .detect(video)
          .then((found) => {
            const value = found[0]?.rawValue
            if (!value || done) return

            /* One read, then stop looking. Letting the loop run would fire
               the callback a dozen times for one code sitting in frame. */
            done = true
            window.clearInterval(timer)
            setLocked(true)
            window.setTimeout(() => detectRef.current?.(value), 420)
          })
          .catch(() => {
            /* A frame that cannot be decoded is the normal case between
               reads, not something to report. */
          })
      }, SCAN_INTERVAL_MS)
    }

    void start()
    return stop
  }, [])

  const problem =
    state === 'denied'
      ? {
          title: 'Camera access is off',
          body: 'Allow the camera in your device settings, or enter the parcel ID by hand using the keyboard button above.',
        }
      : state === 'unavailable'
        ? {
            title: 'No camera on this device',
            body: 'Enter the parcel ID by hand using the keyboard button above.',
          }
        : state === 'no-decoder'
          ? {
              title: 'This device cannot read QR codes',
              body: 'Its browser has no barcode support. Enter the parcel ID by hand using the keyboard button above.',
            }
          : null

  return (
    <div className="relative flex-1 overflow-hidden bg-ink-950">
      <video
        ref={videoRef}
        className={cn(
          'absolute inset-0 size-full object-cover transition-opacity duration-500',
          state === 'starting' ? 'opacity-0' : 'opacity-100',
        )}
        playsInline
        muted
      />

      {/* reticle */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative size-[248px]">
          <div
            className={cn(
              'absolute inset-0 rounded-(--radius-xl) transition-all duration-400',
              locked
                ? 'bg-success-500/15 shadow-[0_0_0_9999px_rgba(5,7,15,0.72)]'
                : 'shadow-[0_0_0_9999px_rgba(5,7,15,0.62)]',
            )}
          />
          {(
            [
              'top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
              'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
              'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
              'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl',
            ] as const
          ).map((pos) => (
            <span
              key={pos}
              className={cn(
                'absolute size-11 transition-colors duration-300',
                pos,
                locked ? 'border-success-400' : 'border-white',
              )}
            />
          ))}
          {state === 'live' && !locked && (
            <span className="anim-scanline absolute inset-x-3 h-0.5 rounded-full bg-gradient-to-r from-transparent via-brand-300 to-transparent shadow-[0_0_14px_2px_rgba(150,184,255,0.7)]" />
          )}
          {locked && (
            <span className="anim-pop absolute inset-0 grid place-items-center">
              <span className="rounded-full bg-success-500 px-4 py-2 text-[13px] font-bold text-white shadow-lg">
                Code detected
              </span>
            </span>
          )}
        </div>
      </div>

      {state === 'starting' && (
        <div className="absolute inset-0 grid place-items-center">
          <Spinner size={26} />
        </div>
      )}

      {/* hint, or the reason there is nothing to point at */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-8">
        {problem ? (
          <div className="anim-fade-up glass-dark mb-5 rounded-(--radius-lg) p-4 text-center ring-1 ring-white/15">
            <p className="text-[14px] font-bold text-white">{problem.title}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75">{problem.body}</p>
          </div>
        ) : (
          <p className="mb-5 text-center text-[13.5px] font-medium text-white/80">{hint}</p>
        )}
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Photo evidence — required at every hand-off, and now actually taken.

   The server rejects a custody step with no photo id (`photo-required`), so
   this component is load-bearing rather than decorative: a shot is captured
   through the OS camera, downscaled, uploaded, and the id it returns is what
   the hand-off is recorded against.

   An upload that fails says so and leaves the slot empty. There is no local
   queue and no optimistic tick, because a photograph that exists only on the
   phone of the person who took it is not evidence either party can produce
   later.
   ═══════════════════════════════════════════════════════════════════════════ */
export function PhotoCapture({
  photoIds,
  required = 3,
  onStored,
  parcelId,
  checkpoint,
  className,
}: {
  /** Ids already stored, which is also the count. */
  photoIds: string[]
  required?: number
  onStored: (photoId: string) => void
  parcelId?: string
  checkpoint?: Checkpoint
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  /* Thumbnails come from the shot in hand, never re-fetched — the bytes are
     already here and a round trip to look at your own photograph is waste. */
  const [thumbs, setThumbs] = useState<string[]>([])

  const shots = photoIds.length

  const fire = async () => {
    if (shots >= required || busy) return
    setError(undefined)
    setBusy(true)
    try {
      const shot = await capturePhoto()
      if (!shot) return // backed out of the camera, which is not a failure
      const { photoId } = await photos.store(shot.dataUrl, parcelId, checkpoint)
      setThumbs((t) => [...t, shot.dataUrl])
      onStored(photoId)
    } catch (e) {
      setError(explain(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="relative flex-1 overflow-hidden rounded-(--radius-lg) bg-ink-950">
        {/* The most recent shot stands in for a viewfinder: the OS camera owns
            the live preview, and what matters here is whether what you just
            took is usable. */}
        {thumbs.length > 0 ? (
          <img
            src={thumbs[thumbs.length - 1]}
            alt={`Hand-over photo ${thumbs.length}`}
            className="anim-fade-in absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <div>
              <Camera size={34} className="mx-auto text-white/45" />
              <p className="mt-3 text-[13.5px] font-semibold text-white/80">
                Tap the shutter to open the camera
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/50">
                {required} photo{required === 1 ? '' : 's'} required. They upload as you take them.
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-6 rounded-(--radius-md) border-2 border-dashed border-white/35" />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink-950/85 to-transparent px-5 pt-8 pb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: required }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'size-9 overflow-hidden rounded-md ring-2 transition-all duration-300',
                  i < shots ? 'bg-success-500/25 ring-success-400' : 'bg-white/10 ring-white/25',
                )}
              >
                {thumbs[i] && (
                  <img src={thumbs[i]} alt="" className="size-full object-cover opacity-90" />
                )}
              </span>
            ))}
          </div>

          <button
            onClick={() => void fire()}
            disabled={shots >= required || busy}
            aria-label={busy ? 'Uploading photo' : 'Capture photo'}
            className="pressable-sm grid size-16 place-items-center rounded-full bg-white ring-4 ring-white/35 disabled:opacity-40"
          >
            {busy ? <Spinner size={22} tone="ink" /> : <Camera size={24} className="text-ink-900" />}
          </button>

          <span className="tabular w-9 text-right text-[12px] font-bold text-white/80">
            {shots}/{required}
          </span>
        </div>
      </div>

      {error && (
        <p className="anim-fade-in mt-2.5 text-center text-[12.5px] font-semibold text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}

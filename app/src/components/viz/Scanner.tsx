import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Camera, ImageIcon, Keyboard, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Spinner } from '@/components/ui'

/* ═══════════════════════════════════════════════════════════════════════════
   Camera-adjacent surfaces: QR ticket, QR scanner, photo capture.
   The "camera" is a simulated viewfinder — no getUserMedia prompt in a demo.
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

/** Live scanner viewfinder with reticle + sweeping scan line. */
export function ScannerViewfinder({
  onDetect,
  hint = 'Point at the parcel QR code',
  autoDetectMs = 2800,
  children,
}: {
  onDetect?: () => void
  hint?: string
  autoDetectMs?: number | null
  children?: React.ReactNode
}) {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (!autoDetectMs || !onDetect) return
    const t = setTimeout(() => {
      setLocked(true)
      setTimeout(onDetect, 620)
    }, autoDetectMs)
    return () => clearTimeout(t)
  }, [autoDetectMs, onDetect])

  return (
    <div className="relative flex-1 overflow-hidden bg-ink-950">
      {/* simulated camera feed */}
      <div className="absolute inset-0 opacity-70">
        <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" className="size-full">
          <defs>
            <radialGradient id="vignette" cx="50%" cy="45%" r="72%">
              <stop offset="55%" stopColor="#1c2440" />
              <stop offset="100%" stopColor="#05070f" />
            </radialGradient>
          </defs>
          <rect width="400" height="700" fill="url(#vignette)" />
          {/* a cardboard box sitting on a counter */}
          <g transform="translate(112, 250)">
            <rect x="0" y="24" width="176" height="132" rx="6" fill="#7c5a35" />
            <rect x="0" y="24" width="176" height="34" rx="5" fill="#63482a" />
            <rect x="76" y="24" width="24" height="132" fill="#5a4126" opacity="0.8" />
            <rect x="26" y="82" width="52" height="34" rx="3" fill="#e8e2d5" opacity="0.92" />
            <rect x="118" y="86" width="34" height="10" rx="2" fill="#e8e2d5" opacity="0.5" />
            <rect x="118" y="102" width="26" height="8" rx="2" fill="#e8e2d5" opacity="0.35" />
          </g>
          <rect y="440" width="400" height="260" fill="#0b1020" opacity="0.55" />
        </svg>
      </div>

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
          {!locked && (
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

      {/* hint + torch */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-8">
        <p className="mb-5 text-center text-[13.5px] font-medium text-white/80">{hint}</p>
        <div className="flex items-center justify-center gap-3">
          <button className="pressable-sm glass-dark grid size-12 place-items-center rounded-full text-white ring-1 ring-white/20">
            <Zap size={19} />
          </button>
          <button className="pressable-sm glass-dark grid size-12 place-items-center rounded-full text-white ring-1 ring-white/20">
            <ImageIcon size={19} />
          </button>
          <button className="pressable-sm glass-dark grid size-12 place-items-center rounded-full text-white ring-1 ring-white/20">
            <Keyboard size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Photo evidence capture — required at every handoff per PRD §9. */
export function PhotoCapture({
  shots,
  required = 3,
  onCapture,
  className,
}: {
  shots: number
  required?: number
  onCapture: () => void
  className?: string
}) {
  const [busy, setBusy] = useState(false)

  const fire = () => {
    if (shots >= required || busy) return
    setBusy(true)
    setTimeout(() => {
      onCapture()
      setBusy(false)
    }, 520)
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="relative flex-1 overflow-hidden rounded-(--radius-lg) bg-ink-950">
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="size-full opacity-80">
          <rect width="400" height="300" fill="#141b30" />
          <rect y="196" width="400" height="104" fill="#0d1424" />
          <g transform="translate(126, 92)">
            <rect x="0" y="18" width="150" height="112" rx="6" fill="#7c5a35" />
            <rect x="0" y="18" width="150" height="30" rx="5" fill="#63482a" />
            <rect x="64" y="18" width="22" height="112" fill="#5a4126" opacity="0.8" />
            <rect x="20" y="68" width="44" height="30" rx="3" fill="#e8e2d5" opacity="0.92" />
          </g>
        </svg>

        {/* framing guides */}
        <div className="pointer-events-none absolute inset-6 rounded-(--radius-md) border-2 border-dashed border-white/35" />
        {busy && (
          <div className="anim-fade-in absolute inset-0 bg-white/85" />
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 pb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: required }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'size-9 rounded-md ring-2 transition-all duration-300',
                  i < shots
                    ? 'bg-success-500/25 ring-success-400'
                    : 'bg-white/10 ring-white/25',
                )}
              >
                {i < shots && (
                  <svg viewBox="0 0 24 24" className="size-full p-1.5 text-white" fill="none">
                    <path
                      d="m5 13 4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            ))}
          </div>

          <button
            onClick={fire}
            disabled={shots >= required}
            aria-label="Capture photo"
            className="pressable-sm grid size-16 place-items-center rounded-full bg-white ring-4 ring-white/35 disabled:opacity-40"
          >
            {busy ? <Spinner size={22} tone="ink" /> : <Camera size={24} className="text-ink-900" />}
          </button>

          <span className="tabular w-9 text-right text-[12px] font-bold text-white/80">
            {shots}/{required}
          </span>
        </div>
      </div>
    </div>
  )
}

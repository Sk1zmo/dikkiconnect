import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { AnimationItem } from 'lottie-web'
import { cn } from '@/lib/cn'

/* ═══════════════════════════════════════════════════════════════════════════
   Status marks, played through Lottie.

   Every moment where the app tells you something finished — paid, booked,
   handed over, collected — now runs the same way: one JSON, one player, one
   call site. Before this there were two hand-drawn SVG components duplicated
   across six screens, which meant six places to change when the tick changed
   and no way to tell a payment apart from a pickup.

   Three decisions worth keeping:

     · Both the player and the animation are dynamically imported. Neither is
       in the first chunk, so the sign-in screen does not pay for a tick it
       will not draw for another four taps. The light build of lottie-web is
       used deliberately — it drops the expressions engine, which none of
       these need, for about a third off the player.

     · The JSON is imported, not fetched. `public/` would have been simpler
       until the single-file build, which runs from file:// where a fetch of
       /lottie/… resolves to nothing. An import gets inlined by the bundler in
       every build, so the marks work in the APK and offline, exactly like the
       fonts.

     · Reduced motion still gets the mark, held on its last frame. The tick is
       information, not decoration — suppressing it entirely would remove the
       confirmation along with the movement.
   ═══════════════════════════════════════════════════════════════════════════ */

const MARKS = {
  'payment-success': () => import('@/lottie/payment-success.json'),
  'payment-failed': () => import('@/lottie/payment-failed.json'),
  'order-confirmed': () => import('@/lottie/order-confirmed.json'),
  'parcel-received': () => import('@/lottie/parcel-received.json'),
  'parcel-delivered': () => import('@/lottie/parcel-delivered.json'),
  'ride-complete': () => import('@/lottie/ride-complete.json'),
  'otp-verified': () => import('@/lottie/otp-verified.json'),
  searching: () => import('@/lottie/searching.json'),
} as const

export type MarkName = keyof typeof MARKS

/** What a screen reader gets. A mark that only exists visually is a mark that
    silently drops the confirmation for anyone not looking at it. */
const LABEL: Record<MarkName, string> = {
  'payment-success': 'Payment successful',
  'payment-failed': 'Payment failed',
  'order-confirmed': 'Booking confirmed',
  'parcel-received': 'Parcel received',
  'parcel-delivered': 'Parcel handed over',
  'ride-complete': 'Ride complete',
  'otp-verified': 'Code verified',
  searching: 'Searching',
}

export function LottieMark({
  name,
  size = 132,
  loop = false,
  className,
  onComplete,
}: {
  name: MarkName
  size?: number
  loop?: boolean
  className?: string
  onComplete?: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  /* Held in a ref so an inline arrow from the caller does not tear the
     animation down and restart it on every render. */
  const done = useRef(onComplete)
  done.current = onComplete

  useEffect(() => {
    let anim: AnimationItem | undefined
    let cancelled = false
    let settle: ReturnType<typeof setTimeout> | undefined

    void (async () => {
      const [player, data] = await Promise.all([
        import('lottie-web/build/player/lottie_light'),
        MARKS[name](),
      ])
      if (cancelled || !host.current) return

      anim = player.default.loadAnimation({
        container: host.current,
        renderer: 'svg',
        loop,
        autoplay: !reduced,
        animationData: data.default,
      })

      if (reduced) {
        anim.goToAndStop(anim.totalFrames - 1, true)
        /* A held frame never fires `complete`. Callers advance the flow on that
           callback, so without this a reduced-motion user reaches the payment
           screen and simply stops there. The contract is "fires when the mark
           is done"; held still counts as done. */
        settle = setTimeout(() => done.current?.(), 600)
      } else {
        anim.addEventListener('complete', () => done.current?.())
      }
    })()

    return () => {
      cancelled = true
      clearTimeout(settle)
      anim?.destroy()
    }
  }, [name, loop, reduced])

  return (
    <div
      ref={host}
      role="img"
      aria-label={LABEL[name]}
      className={cn('shrink-0', className)}
      style={{ width: size, height: size }}
    />
  )
}

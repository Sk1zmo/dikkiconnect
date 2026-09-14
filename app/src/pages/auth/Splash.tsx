import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { Logo } from '@/components/brand/Logo'
import { HeroImage } from '@/components/viz/HeroImage'
import { HeroHeadline } from '@/components/ui'
import { Screen } from '@/components/layout/Screen'
import { useApp } from '@/lib/store'
import { BRAND } from '@/lib/brand'
import { SUCCESS } from '@/lib/copy'
import { DEMO } from '@/lib/demo'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Landing screen. The picture is the whole screen: a hatchback on the highway
 * at dusk, boot open, a suitcase and two parcels riding in it — which is the
 * proposition, drawn once, and the same evening the opening just played in.
 * The name sits in the sky, and the two things you can do sit on a dark scrim
 * at the foot of the road. Nothing is boxed, listed or promised in between;
 * the car is doing that.
 *
 * On a cold start this mounts beneath the launch screen (App.tsx) and is
 * already in place by the time that lifts — so the opening dissolves into a
 * finished screen rather than one still assembling itself.
 */
export default function Splash() {
  const navigate = useNavigate()
  const { onboarded } = useApp()
  const reduced = useReducedMotion()
  /* Arriving here from Sign out: say so, once, and mean it kindly. */
  const signedOut = Boolean((useLocation().state as { signedOut?: boolean } | null)?.signedOut)

  /* A demo build has nothing to sign in to, so Get Started goes straight to
     the portal picker rather than to a login that would immediately pass. */
  const start = () =>
    navigate(DEMO ? '/auth/role' : onboarded ? '/auth/login' : '/auth/onboarding')

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.2 : 0.6, delay, ease: EASE },
  })

  return (
    <Screen tone="dark" className="relative overflow-hidden">
      {/* The world. Anchored low so the car stays in frame on a short phone —
          it is the sky that gives, never the boot. */}
      <div className="absolute inset-0">
        <HeroImage focus="bottom" />
        {/* Two scrims: one for the name at the top, one for the actions at the
            foot. The middle — the car — is left alone. */}
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-dusk-950/75 via-dusk-950/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-dusk-950/90 via-dusk-950/55 to-transparent" />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* ── Brand + headline ─────────────────────────────────────────── */}
        <div className="px-6 pt-safe">
          <motion.div {...rise(0)} className="pt-5">
            <Logo size="lg" tone="white" markTone="white" tagline={BRAND.tagline} />
          </motion.div>

          <motion.div {...rise(0.1)} className="mt-8">
            <HeroHeadline lines={['Anything', 'Anywhere']} className="text-[38px]" />
            <p className="mt-3 max-w-[290px] text-[15px] leading-[1.5] text-white/80">
              Your parcel rides in the empty boot of a car already making the trip.
            </p>
          </motion.div>
        </div>

        <div className="min-h-4 flex-1" />

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <motion.div {...rise(0.2)} className="pb-safe-6 px-6">
          {signedOut && (
            <p
              role="status"
              className="anim-fade-up mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur-sm"
            >
              <CheckCircle size={15} weight="fill" className="text-success-500" />
              {SUCCESS.signedOut.title}. {SUCCESS.signedOut.body}
            </p>
          )}
          <button
            onClick={start}
            className="pressable focus-ring flex h-[58px] w-full items-center justify-center rounded-(--radius-lg) bg-white px-6 text-[16.5px] font-bold text-ink-900 shadow-(--shadow-sheet) transition-colors hover:bg-ink-50"
          >
            <span className="flex-1 text-center">Get started</span>
            <ArrowRight size={20} className="shrink-0" />
          </button>

          <p className="mt-4 text-center text-[13.5px] text-white/70">
            Already have an account?{' '}
            <button
              onClick={() => navigate(DEMO ? '/auth/role' : '/auth/login')}
              className="pressable-sm font-bold text-white hover:text-brand-200"
            >
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </Screen>
  )
}

import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { LogoMark } from '@/components/brand/Logo'
import { HeroHeadline } from '@/components/ui'
import { Screen } from '@/components/layout/Screen'
import { useApp } from '@/lib/store'
import { BRAND, LAUNCH_BG } from '@/lib/brand'
import { SUCCESS } from '@/lib/copy'
import { DEMO } from '@/lib/demo'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Landing screen — a title card.
 *
 * This was a full-bleed photograph: a hatchback at dusk, boot open, parcels
 * inside. It was a good picture and it was doing the wrong job. The first
 * thing a new person sees should say what the thing is CALLED, and the car
 * said what it does while the name sat small in a corner of the sky.
 *
 * It also fought the opening. The launch animation ends on a navy field with
 * the mark drawn in the middle of it; the landing then cut to an orange sunset
 * photograph. Two brand moments in a row, disagreeing.
 *
 * So the card continues the opening instead: the same navy, the same glow
 * behind the same mark, which means the hand-over from the animation is a
 * settle rather than a cut. The headline and the two things you can do sit
 * under it. Nothing else.
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
      {/* The exact navy the opening ends on, plus the same wash, so the two
          are one continuous field rather than two brand moments in a row. */}
      <div className="absolute inset-0" style={{ background: LAUNCH_BG }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 48% at 50% 34%, rgba(47,107,255,0.30), rgba(7,18,49,0) 72%)',
        }}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* ── The card ──────────────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <motion.div {...rise(0)}>
            <LogoMark size={104} tone="white" />
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className="text-display mt-6 text-[44px] leading-none font-extrabold tracking-[-0.045em] text-white"
          >
            {BRAND.name}
          </motion.h1>

          <motion.p
            {...rise(0.14)}
            className="mt-3.5 text-[10.5px] font-bold tracking-[0.34em] text-brand-300 uppercase"
          >
            {BRAND.tagline}
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-11">
            <HeroHeadline lines={['Anything', 'Anywhere']} className="text-[38px]" />
            <p className="mx-auto mt-3.5 max-w-[300px] text-[15px] leading-[1.55] text-white/75">
              Your parcel rides in the empty boot of a car already making the trip.
            </p>
          </motion.div>
        </div>

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

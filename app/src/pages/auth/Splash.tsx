import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Box, ShieldCheck, Zap } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { LaunchAnimation } from '@/components/brand/LaunchAnimation'
import { HeroImage } from '@/components/viz/HeroImage'
import { FeatureRow, HeroHeadline, HeroSheet } from '@/components/ui'
import { Screen } from '@/components/layout/Screen'
import { useApp } from '@/lib/store'
import { DEMO } from '@/lib/demo'

const FEATURES = [
  { icon: ShieldCheck, label: 'Safe & Secure', detail: 'Your trust, our priority' },
  { icon: Zap, label: 'Real-time Tracking', detail: 'Know where it is, always' },
  { icon: Box, label: 'Best Price', detail: 'More options, better rates' },
]

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Launch screen. The hero fills the frame and the sheet floats over its lower
 * third, so the scene is never letterboxed — on a short phone the sky crops,
 * not the content.
 */
export default function Splash() {
  const navigate = useNavigate()
  const { onboarded } = useApp()
  const [booted, setBooted] = useState(false)

  /* The launch sequence plays once per app session, not once per visit to this
     route — coming back here from Login should not replay it. */
  const [launching, setLaunching] = useState(
    () => sessionStorage.getItem('dikkiconnect.launched') !== '1',
  )
  const endLaunch = useCallback(() => {
    sessionStorage.setItem('dikkiconnect.launched', '1')
    setLaunching(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 900)
    return () => clearTimeout(t)
  }, [])

  /* A demo build has nothing to sign in to, so Get Started goes straight to
     the portal picker rather than to a login that would immediately pass. */
  const start = () =>
    navigate(DEMO ? '/auth/role' : onboarded ? '/auth/login' : '/auth/onboarding')

  return (
    <Screen tone="dark" className="relative overflow-hidden">
      <AnimatePresence>
        {launching && <LaunchAnimation key="launch" onDone={endLaunch} />}
      </AnimatePresence>

      {/* Hero fills the whole shell; the sheet sits on top of it */}
      <div className="absolute inset-0">
        <HeroImage />
        {/* Scrim so the wordmark and headline stay legible over any photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-dusk-950/85 via-dusk-950/35 to-transparent" />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* ── Brand + headline ─────────────────────────────────────────── */}
        <div className="px-6 pt-safe">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="pt-5"
          >
            <Logo size="xl" tone="white" markTone="gradient" tagline="Move more. Together." />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
            className="mt-9"
          >
            <HeroHeadline lines={['Anything', 'Anywhere']} />
            <p className="mt-4 max-w-[290px] text-[15.5px] leading-[1.5] text-white/75">
              Bikes, autos, cars, buses &amp; beyond — all in one app.
            </p>
          </motion.div>
        </div>

        <div className="min-h-4 flex-1" />

        {/* ── Sheet ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 44 }}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 44 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
          <HeroSheet>
            <FeatureRow items={FEATURES} className="pb-5" />

            <button
              onClick={start}
              className="pressable focus-ring flex h-[58px] w-full items-center justify-center rounded-(--radius-lg) bg-action px-6 text-[16.5px] font-bold text-white shadow-(--shadow-action) transition-colors hover:bg-action-hover"
            >
              <span className="flex-1 text-center">Get Started</span>
              <ArrowRight size={20} className="shrink-0" />
            </button>

            <p className="mt-4 text-center text-[13.5px] text-ink-500">
              Already have an account?{' '}
              <button
                onClick={() => navigate(DEMO ? '/auth/role' : '/auth/login')}
                className="pressable-sm font-bold text-brand-600 hover:text-brand-700"
              >
                Sign In
              </button>
            </p>
          </HeroSheet>
        </motion.div>

        {/* Boot shimmer, replaced by the sheet */}
        {!booted && (
          <div className="pointer-events-none absolute inset-x-6 bottom-8">
            <div className="h-0.5 overflow-hidden rounded-full bg-white/15">
              <div className="anim-progress h-full w-full bg-white/70" />
            </div>
          </div>
        )}
      </div>
    </Screen>
  )
}

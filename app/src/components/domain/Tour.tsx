import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Camera,
  Package,
  ShieldCheck,
  Storefront,
  Users,
  Wallet,
  type Icon,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { LogoMark } from '@/components/brand/Logo'
import { useApp } from '@/lib/store'
import type { Role } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════════════════
   The tour — four cards, once per portal, then never again.

   A beta tester opens WayPool to an empty screen. That emptiness is correct
   and deliberate (nothing is seeded any more), but on its own it reads as a
   broken app rather than a new account. This is what fills the gap: it says
   what this portal is for, what the one thing to do first is, and what the
   OTP-and-photo promise actually means — because that promise is the product,
   and it is the part a tester is most likely to miss.

   ── Why cards and not coach-marks ────────────────────────────────────────
   Spotlights anchored to real elements are the obvious choice and the wrong
   one here. They need every target to exist and be laid out before they can
   measure it, they break whenever a screen is reordered, and they are a
   special kind of broken on a phone where the target is below the fold. Four
   full cards say the same thing, survive any layout, and can be read in the
   eight seconds a tester is willing to give them.

   It is skippable from the first card, it never returns once dismissed, and
   it never blocks: nothing behind it is unreachable while it is open.
   ═══════════════════════════════════════════════════════════════════════════ */

interface Card {
  icon: Icon
  title: string
  body: string
}

const TOURS: Record<Role, Card[]> = {
  sender: [
    {
      icon: Package,
      title: 'Send a parcel in someone’s boot',
      body: 'Cars already making your trip have empty space. Book a parcel into one and it travels with a verified traveller instead of a van.',
    },
    {
      icon: Storefront,
      title: 'Drop it at a hub, or at your door',
      body: 'Hub to hub is cheapest: you drop it at a counter, your receiver collects from one. Door to door costs more and skips both.',
    },
    {
      icon: ShieldCheck,
      title: 'A code at every hand-over',
      body: 'Your parcel only moves when someone enters a 6-digit code issued to the person holding it. You will see yours on the drop-off pass.',
    },
    {
      icon: Camera,
      title: 'Photographed, every time',
      body: 'Each hand-over is photographed before it counts. If anything is ever disputed, that is the evidence — and it is not optional.',
    },
  ],
  traveler: [
    {
      icon: Package,
      title: 'Your boot is the opportunity',
      body: 'You are driving anyway. Carry a parcel along the same route and get paid for space you were not using.',
    },
    {
      icon: Users,
      title: 'Claim a job before someone else does',
      body: 'The job board is shared. Accepting is first come, first served, and the app will tell you straight away if another traveller got there first.',
    },
    {
      icon: ShieldCheck,
      title: 'You take custody with a code',
      body: 'At pickup you enter the code the hub or sender shows you. From that moment the parcel is your responsibility — and the timestamp proves when that started.',
    },
    {
      icon: Wallet,
      title: 'Paid on hand-over',
      body: 'Your payout is released when the parcel is accepted at the other end, not when you say it was.',
    },
  ],
  hub: [
    {
      icon: Storefront,
      title: 'You are a checkpoint',
      body: 'Parcels pass through your counter twice: in from senders, out to travellers — and arriving from travellers, out to receivers.',
    },
    {
      icon: Camera,
      title: 'Weigh, photograph, then the code',
      body: 'Photograph the parcel while it is in front of you. The code comes last, because entering it is what actually moves the parcel.',
    },
    {
      icon: ShieldCheck,
      title: 'Never release without a match',
      body: 'Five wrong entries locks the checkpoint. If someone cannot produce the code, do not hand the parcel over — that is the whole point of it.',
    },
    {
      icon: Wallet,
      title: 'A handling fee per parcel',
      body: 'Every intake and every release earns you a fee, credited the moment the hand-over is recorded.',
    },
  ],
  passenger: [
    {
      icon: Users,
      title: 'Share the ride, split the cost',
      body: 'Travellers publish seats on routes they are already driving. You pay a share of the fuel, not a taxi fare.',
    },
    {
      icon: ShieldCheck,
      title: 'A boarding code at the kerb',
      body: 'Show your code to the driver when you get in. It confirms you are the passenger who booked the seat.',
    },
    {
      icon: Package,
      title: 'Parcels ride too',
      body: 'The same cars carry parcels. That is what keeps your seat cheap.',
    },
    {
      icon: Wallet,
      title: 'Pilot build',
      body: 'Carpooling is the newest part of WayPool and the least finished. Tell us what breaks.',
    },
  ],
}

const seenKey = (role: Role) => `waypool.tour.${role}`

function alreadySeen(role: Role): boolean {
  try {
    return localStorage.getItem(seenKey(role)) === 'done'
  } catch {
    /* Private windows and blocked site data both throw here. Showing the tour
       again is a far smaller problem than crashing the shell, so a failed
       read is treated as "not seen". */
    return false
  }
}

function markSeen(role: Role) {
  try {
    localStorage.setItem(seenKey(role), 'done')
  } catch {
    /* Nothing to do. It will show once more next time, which is survivable. */
  }
}

export function Tour() {
  const { role, authed } = useApp()
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    /* Only for a signed-in person, and only once per portal. The delay lets
       the screen behind it settle first, so the tour arrives on top of a
       finished layout rather than racing it. */
    if (!authed || alreadySeen(role)) {
      setOpen(false)
      return
    }
    const t = setTimeout(() => {
      setStep(0)
      setOpen(true)
    }, 700)
    return () => clearTimeout(t)
  }, [role, authed])

  const cards = TOURS[role]
  const card = cards[step]
  const last = step === cards.length - 1

  const close = () => {
    markSeen(role)
    setOpen(false)
  }

  if (!card) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.25 }}
        >
          <div
            className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to WayPool"
            className="pb-safe-5 relative mx-auto w-full max-w-[460px] rounded-t-(--radius-sheet) bg-white px-6 pt-7"
            initial={{ y: reduced ? 0 : 60 }}
            animate={{ y: 0 }}
            exit={{ y: reduced ? 0 : 60 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="flex items-center justify-between">
              <LogoMark size={26} />
              <button
                onClick={close}
                className="pressable-sm -mr-2 rounded-full px-3 py-1.5 text-[13px] font-bold text-ink-500 hover:bg-ink-50"
              >
                {last ? 'Close' : 'Skip'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: reduced ? 0 : 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduced ? 0 : -18 }}
                transition={{ duration: reduced ? 0 : 0.22 }}
              >
                <span className="mt-6 grid size-14 place-items-center rounded-(--radius-lg) bg-brand-50 text-brand-600">
                  <card.icon size={26} weight="duotone" />
                </span>
                <h2 className="text-display mt-5 text-[23px] leading-tight font-extrabold text-ink-900">
                  {card.title}
                </h2>
                <p className="mt-2.5 min-h-[72px] text-[14.5px] leading-relaxed text-ink-600">
                  {card.body}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-5 flex items-center gap-1.5">
              {cards.map((_, i) => (
                <span
                  key={i}
                  className={
                    i === step
                      ? 'h-1.5 w-6 rounded-full bg-brand-600 transition-all'
                      : 'h-1.5 w-1.5 rounded-full bg-ink-200 transition-all'
                  }
                />
              ))}
            </div>

            <div className="mt-5 pb-5">
              <Button
                block
                size="lg"
                onClick={() => (last ? close() : setStep((n) => n + 1))}
              >
                {last ? 'Start using WayPool' : 'Next'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

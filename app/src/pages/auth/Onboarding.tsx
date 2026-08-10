import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, IndianRupee, ShieldCheck, Zap } from 'lucide-react'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useApp } from '@/lib/store'

const SLIDES = [
  {
    icon: Zap,
    eyebrow: 'Same-day, not five-day',
    title: 'Your parcel rides with someone already going there',
    body: 'Crores of cars drive between cities every day with an empty boot. DikkiConnect matches your parcel to one of them — so Bangalore to Mysore takes hours, not days.',
    art: <ArtRoute />,
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Custody you can audit',
    title: 'An OTP and a photo at every single handoff',
    body: 'Four checkpoints, four OTPs: you to the hub, hub to traveler, traveler to hub, hub to receiver. Every transfer is timestamped and photographed.',
    art: <ArtCustody />,
  },
  {
    icon: IndianRupee,
    eyebrow: 'Half the courier price',
    title: 'Cheaper for you, extra income for the driver',
    body: 'The boot space was going to travel empty anyway. That is why it costs less than a courier — and why travelers earn on a drive they were making regardless.',
    art: <ArtSavings />,
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { completeOnboarding } = useApp()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)

  const slide = SLIDES[index]
  const Icon = slide.icon
  const last = index === SLIDES.length - 1

  const go = (next: number) => {
    setDir(next > index ? 1 : -1)
    setIndex(next)
  }

  const finish = () => {
    completeOnboarding()
    navigate('/auth/login')
  }

  return (
    <Screen tone="white">
      <div className="flex items-center justify-between px-5 pt-safe pb-2">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-400 ease-(--ease-out-expo)',
                i === index ? 'w-7 bg-brand-600' : 'w-1.5 bg-ink-200',
              )}
            />
          ))}
        </div>
        <button
          onClick={finish}
          className="pressable-sm text-[13.5px] font-bold text-ink-400 hover:text-ink-600"
        >
          Skip
        </button>
      </div>

      <div className="device-scroll flex flex-1 flex-col">
        <div className="relative flex min-h-[42%] items-center justify-center overflow-hidden px-6">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              initial={{ opacity: 0, x: dir * 44, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: dir * -44, scale: 0.96 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {slide.art}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-7 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[11.5px] font-bold text-brand-700">
                <Icon size={13} />
                {slide.eyebrow}
              </span>
              <h2 className="text-display mt-4 text-[27px] leading-[1.16] font-extrabold text-ink-900">
                {slide.title}
              </h2>
              <p className="mt-3.5 text-[14.5px] leading-[1.6] text-ink-500">{slide.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="pb-safe-6 shrink-0 px-6 pt-4">
        <Button
          block
          size="lg"
          onClick={() => (last ? finish() : go(index + 1))}
          iconRight={<ArrowRight size={18} />}
        >
          {last ? 'Create your account' : 'Next'}
        </Button>
      </div>
    </Screen>
  )
}

/* ── Slide art ────────────────────────────────────────────────────────────── */

function ArtRoute() {
  return (
    <svg viewBox="0 0 320 220" className="w-full" fill="none" aria-hidden>
      <rect x="12" y="24" width="296" height="172" rx="22" fill="#f0f5ff" />
      <path
        d="M52 168C86 168 96 128 138 120c46-9 60-46 122-54"
        stroke="#1650e0"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="10 8"
        className="anim-route-flow"
      />
      <g transform="translate(40,150)">
        <circle cx="12" cy="12" r="15" fill="#1650e0" opacity="0.15" />
        <circle cx="12" cy="12" r="9" fill="#fff" />
        <circle cx="12" cy="12" r="6" fill="#1650e0" />
      </g>
      <g transform="translate(248,42)">
        <path
          d="M14 0C6.3 0 0 6.2 0 13.8 0 24 14 38 14 38s14-14 14-24.2C28 6.2 21.7 0 14 0Z"
          fill="#1650e0"
        />
        <circle cx="14" cy="13.6" r="5.6" fill="#fff" />
      </g>
      {/* car with parcel in boot — position outside, motion inside */}
      <g transform="translate(116,84)">
        <g className="anim-bob">
          <rect x="4" y="26" width="86" height="26" rx="9" fill="#131b2e" />
          <path d="M18 26 L30 8h34l14 18Z" fill="#384463" />
          <rect x="60" y="12" width="26" height="18" rx="4" fill="#e0a86a" />
          <rect x="60" y="12" width="26" height="6" rx="3" fill="#c98b4b" />
          <circle cx="26" cy="54" r="8" fill="#232e49" />
          <circle cx="72" cy="54" r="8" fill="#232e49" />
          <circle cx="26" cy="54" r="3.4" fill="#97a3bd" />
          <circle cx="72" cy="54" r="3.4" fill="#97a3bd" />
        </g>
      </g>
      <text x="42" y="196" fill="#6b7896" fontSize="11" fontWeight="700">
        Bangalore
      </text>
      <text x="228" y="196" fill="#6b7896" fontSize="11" fontWeight="700">
        Mysore
      </text>
    </svg>
  )
}

function ArtCustody() {
  const nodes = ['You', 'Hub', 'Driver', 'Hub', 'Them']
  return (
    <svg viewBox="0 0 320 220" className="w-full" fill="none" aria-hidden>
      <rect x="12" y="24" width="296" height="172" rx="22" fill="#f0f5ff" />
      <line x1="46" y1="112" x2="274" y2="112" stroke="#c2d7ff" strokeWidth="3" />
      {nodes.map((label, i) => {
        const x = 46 + i * 57
        return (
          <g key={label}>
            <circle cx={x} cy={112} r="17" fill="#fff" />
            <circle cx={x} cy={112} r="13" fill={i % 2 === 0 ? '#1650e0' : '#628fff'} />
            <path
              d="m-5 0 3.6 3.8L5-4"
              transform={`translate(${x},${112})`}
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <text x={x} y={146} fill="#4d5a78" fontSize="10.5" fontWeight="700" textAnchor="middle">
              {label}
            </text>
            {i < 4 && (
              <g transform={`translate(${x + 20},${76})`}>
                <rect width="18" height="13" rx="3" fill="#10b981" opacity="0.18" />
                <text x="9" y="9.5" fill="#059669" fontSize="7.5" fontWeight="800" textAnchor="middle">
                  OTP
                </text>
              </g>
            )}
          </g>
        )
      })}
      <text x="160" y="60" fill="#1650e0" fontSize="12" fontWeight="800" textAnchor="middle">
        4 verified custody handoffs
      </text>
    </svg>
  )
}

function ArtSavings() {
  return (
    <svg viewBox="0 0 320 220" className="w-full" fill="none" aria-hidden>
      <rect x="12" y="24" width="296" height="172" rx="22" fill="#f0f5ff" />
      {/* courier bar */}
      <rect x="52" y="60" width="150" height="34" rx="10" fill="#cbd3e4" />
      <text x="64" y="82" fill="#4d5a78" fontSize="12" fontWeight="700">
        Courier · ₹380
      </text>
      <text x="212" y="82" fill="#97a3bd" fontSize="11" fontWeight="700">
        2–5 days
      </text>
      {/* dikkiconnect bar */}
      <rect x="52" y="112" width="86" height="34" rx="10" fill="#1650e0" />
      <text x="64" y="134" fill="#fff" fontSize="12" fontWeight="800">
        DikkiConnect · ₹189
      </text>
      <text x="148" y="134" fill="#1650e0" fontSize="11" fontWeight="800">
        Same day
      </text>
      <g transform="translate(52,160)">
        <rect width="106" height="24" rx="12" fill="#ecfdf5" />
        <text x="53" y="16" fill="#059669" fontSize="11.5" fontWeight="800" textAnchor="middle">
          You save 50%
        </text>
      </g>
      <g transform="translate(170,160)">
        <rect width="98" height="24" rx="12" fill="#fffbeb" />
        <text x="49" y="16" fill="#b45309" fontSize="11.5" fontWeight="800" textAnchor="middle">
          Driver earns ₹132
        </text>
      </g>
    </svg>
  )
}

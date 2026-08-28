import { useNavigate } from 'react-router-dom'
import { Home, LifeBuoy } from 'lucide-react'
import { Screen, ScreenBody } from '@/components/layout/Screen'
import { Button } from '@/components/ui'
import { LogoMark } from '@/components/brand/Logo'
import { useApp } from '@/lib/store'

const HOME: Record<string, string> = {
  sender: '/sender',
  traveler: '/traveler',
  passenger: '/passenger',
  hub: '/hub',
}

export default function NotFound() {
  const navigate = useNavigate()
  const { role } = useApp()

  return (
    <Screen tone="white">
      <ScreenBody className="flex flex-col items-center justify-center text-center">
        <svg viewBox="0 0 200 140" className="w-[190px]" fill="none" aria-hidden>
          <ellipse cx="100" cy="124" rx="58" ry="8" fill="#eef1f8" />
          {/* dead-end road */}
          <path d="M46 122 L82 34h36l36 88Z" fill="#dfeaff" />
          <path d="M96 34h8l20 88h-20L96 34Z" fill="#f0f5ff" />
          <rect x="70" y="26" width="60" height="18" rx="4" fill="#c2d7ff" />
          <rect x="98" y="12" width="4" height="16" fill="#96b8ff" />
          <text
            x="100"
            y="39"
            fill="#0e339a"
            fontSize="11"
            fontWeight="800"
            textAnchor="middle"
            fontFamily="var(--font-sans)"
          >
            404
          </text>
          <circle cx="42" cy="30" r="10" fill="#c2d7ff" opacity="0.55" />
          <circle cx="164" cy="46" r="7" fill="#c2d7ff" opacity="0.5" />
        </svg>

        <LogoMark size={28} className="mt-8 opacity-40" />

        <h1 className="text-display mt-4 text-[24px] font-extrabold text-ink-900">
          This route doesn&apos;t exist
        </h1>
        <p className="mt-2.5 max-w-[300px] text-[14px] leading-[1.6] text-ink-500">
          The page you were looking for isn&apos;t here. It may have moved, or the link might be
          out of date.
        </p>

        <div className="mt-8 flex w-full max-w-[280px] flex-col gap-2.5">
          <Button block size="lg" onClick={() => navigate(HOME[role] ?? '/')} icon={<Home size={18} />}>
            Take me home
          </Button>
          <Button variant="ghost" block to="/support" icon={<LifeBuoy size={17} />}>
            Report a broken link
          </Button>
        </div>
      </ScreenBody>
    </Screen>
  )
}

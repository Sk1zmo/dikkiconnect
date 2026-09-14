import { useLocation, useNavigate } from 'react-router-dom'
import { Screen, ScreenBody } from '@/components/layout/Screen'
import { ErrorState } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useApp } from '@/lib/store'

const HOME: Record<string, string> = {
  sender: '/sender',
  traveler: '/traveler',
  passenger: '/passenger',
  hub: '/hub',
}

/**
 * 404. The road ends at a barrier and the signpost points home — home being
 * whichever portal you were in, or the landing if you are not signed in. The
 * path that failed is shown small, because "which link was wrong" is the one
 * thing support will ask.
 */
export default function NotFound() {
  const navigate = useNavigate()
  const { role } = useApp()
  const { authed } = useAuth()
  const { pathname } = useLocation()

  return (
    <Screen tone="white">
      <ScreenBody className="flex flex-col justify-center">
        <ErrorState
          kind="notfound"
          onAction={() => navigate(authed ? (HOME[role] ?? '/') : '/')}
          secondaryTo="/support"
          detail={pathname !== '/404' ? `No screen at ${pathname}` : undefined}
        />
      </ScreenBody>
    </Screen>
  )
}

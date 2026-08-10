import { useState } from 'react'
import { cn } from '@/lib/cn'
import { HeroScene } from './HeroScene'

/**
 * The launch/login hero artwork.
 *
 * Drop a file into `app/public/` named `hero.jpg` (or .png / .webp) and it is
 * used everywhere automatically — splash and login both render this component.
 * Candidates are tried in order and the first that loads wins; if none exist
 * the drawn scene stands in, so the screen is never broken or blank.
 *
 * Sizing note: the art is cropped with `object-cover`, so anything roughly
 * portrait works. `focus` shifts which part survives the crop — the splash
 * keeps the horizon high so the headline sits over sky, the login banner keeps
 * the top.
 */
const CANDIDATES = ['/hero.jpg', '/hero.jpeg', '/hero.png', '/hero.webp', '/login-hero.jpg']

export function HeroImage({
  className,
  focus = 'center',
  /** Crop anchor for the drawn fallback only. */
  sceneAlign = 'xMidYMid',
}: {
  className?: string
  focus?: 'top' | 'center' | 'bottom'
  sceneAlign?: 'xMidYMin' | 'xMidYMid' | 'xMidYMax'
}) {
  const [index, setIndex] = useState(0)
  const exhausted = index >= CANDIDATES.length

  if (exhausted) return <HeroScene align={sceneAlign} className={className} />

  return (
    <img
      src={CANDIDATES[index]}
      alt=""
      aria-hidden
      // Step to the next candidate on failure; when the list runs out the
      // drawn scene renders instead.
      onError={() => setIndex((i) => i + 1)}
      className={cn('size-full object-cover', className)}
      style={{
        objectPosition:
          focus === 'top' ? 'center 18%' : focus === 'bottom' ? 'center 82%' : 'center 50%',
      }}
    />
  )
}

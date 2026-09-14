import { useEffect, useState } from 'react'
import { BellRinging, Clock } from '@phosphor-icons/react'
import { Button, Note } from '@/components/ui'
import { requestNotificationPermission, useNotificationPermission } from '@/lib/push'

/* ═══════════════════════════════════════════════════════════════════════════
   Pieces of a confirmation screen that carry the user forward.

   DropOffCountdown — the 24-hour window as a live clock, because a deadline
   in prose ("within 24 hours") is a deadline nobody sets an alarm for.

   NotifyAsk — the one place the app asks to send notifications: right after
   the first booking, with the reason in front of it. Never on launch, never
   twice; once answered, in either direction, it does not come back.
   ═══════════════════════════════════════════════════════════════════════════ */

const WINDOW_MS = 24 * 3_600_000

export function DropOffCountdown({ bookedAt }: { bookedAt?: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const start = bookedAt ? Date.parse(bookedAt) : now
  const left = Math.max(0, start + WINDOW_MS - now)
  const h = Math.floor(left / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  const urgent = left < 4 * 3_600_000

  return (
    <p
      className={`tabular mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold ${
        urgent ? 'bg-warn-50 text-warn-600' : 'bg-brand-50 text-brand-700'
      }`}
      role="timer"
    >
      <Clock size={14} weight="bold" />
      {left === 0 ? 'Drop-off window closed' : `${h}h ${String(m).padStart(2, '0')}m to drop it off`}
    </p>
  )
}

const ASKED_KEY = 'dikkiconnect.notify.asked'

export function NotifyAsk() {
  const permission = useNotificationPermission()
  const [asked, setAsked] = useState(() => {
    try {
      return localStorage.getItem(ASKED_KEY) === '1'
    } catch {
      return false
    }
  })
  if (asked || permission !== 'prompt') return null

  const answer = async (yes: boolean) => {
    try {
      localStorage.setItem(ASKED_KEY, '1')
    } catch {
      /* in-memory only */
    }
    setAsked(true)
    if (yes) await requestNotificationPermission()
  }

  return (
    <Note tone="brand" icon={<BellRinging size={15} weight="fill" />} title="Know the moment it moves" className="mb-5">
      <span className="block">
        Custody updates — at the hub, with a traveler, ready for the receiver — and a reminder before the
        drop-off window closes. Nothing else unless you say so.
      </span>
      <span className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => void answer(true)}>
          Turn on updates
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void answer(false)}>
          Not now
        </Button>
      </span>
    </Note>
  )
}

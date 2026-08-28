import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Headphones, Paperclip, Phone, Send, ShieldCheck } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Avatar, DotLoader, IconButton, Note, Skeleton } from '@/components/ui'
import { RIDE_CHAT, SUPPORT_THREAD, travelerById } from '@/lib/data'
import { useTrip } from '@/lib/store'
import { time } from '@/lib/format'
import type { ChatMessage } from '@/lib/types'
import { cn } from '@/lib/cn'

const QUICK_REPLIES = [
  "I'm at the pickup point",
  'Running 5 minutes late',
  'Can we move the pickup?',
  'Thanks!',
]

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()

  const isSupport = id === 'support'
  const trip = useTrip(id)
  const driver = travelerById(trip?.travelerId)
  const name = isSupport ? 'DikkiConnect Support' : (driver?.name ?? 'Driver')

  const [messages, setMessages] = useState<ChatMessage[]>(isSupport ? SUPPORT_THREAD : RIDE_CHAT)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, loading])

  const send = (text: string) => {
    const body = text.trim()
    if (!body) return
    setMessages((m) => [
      ...m,
      { id: `m-${m.length}`, from: 'me', text: body, at: new Date().toISOString() },
    ])
    setDraft('')

    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((m) => [
        ...m,
        {
          id: `m-${m.length}`,
          from: 'them',
          text: isSupport
            ? "Got it — I'm checking that for you now. One moment."
            : 'Noted. See you there.',
          at: new Date().toISOString(),
        },
      ])
    }, 1600)
  }

  return (
    <Screen tone="white">
      <TopBar
        back
        backTo="/passenger/messages"
        bordered
        title={name}
        subtitle={
          isSupport
            ? 'Average reply 2 min'
            : driver
              ? `${driver.vehicle.model} · ${driver.vehicle.plate}`
              : 'Ride details unavailable'
        }
        action={
          !isSupport ? (
            <IconButton icon={<Phone size={17} />} label="Call driver" tone="solid" size={38} />
          ) : undefined
        }
      />

      <div className="device-scroll flex-1 bg-ink-50 px-4 py-4">
        {isSupport && (
          <Note tone="neutral" icon={<ShieldCheck size={14} />} className="mb-4">
            Never share OTPs, card numbers or your Aadhaar in chat. DikkiConnect agents will never ask for
            them.
          </Note>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                <Skeleton w={i % 2 ? 170 : 220} h={i % 2 ? 40 : 56} radius={16} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {messages.map((m) => {
              if (m.from === 'system') {
                return (
                  <div key={m.id} className="my-2 flex justify-center">
                    <span className="rounded-full bg-ink-200/70 px-3 py-1 text-[11px] font-semibold text-ink-500">
                      {m.text}
                    </span>
                  </div>
                )
              }
              const mine = m.from === 'me'
              return (
                <div
                  key={m.id}
                  className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}
                >
                  {!mine &&
                    (isSupport ? (
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                        <Headphones size={13} />
                      </span>
                    ) : (
                      <Avatar name={name} size={28} tone={driver?.avatarTone} />
                    ))}
                  <div
                    className={cn(
                      'max-w-[76%] rounded-2xl px-3.5 py-2.5 shadow-(--shadow-e1)',
                      mine
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-white text-ink-800',
                    )}
                  >
                    <p className="text-[13.5px] leading-[1.5]">{m.text}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        mine ? 'text-white/60' : 'text-ink-400',
                      )}
                    >
                      {time(m.at)}
                    </p>
                  </div>
                </div>
              )
            })}

            {typing && (
              <div className="flex items-end gap-2">
                {isSupport ? (
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                    <Headphones size={13} />
                  </span>
                ) : (
                  <Avatar name={name} size={28} tone={driver?.avatarTone} />
                )}
                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-(--shadow-e1)">
                  <DotLoader />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="pb-safe shrink-0 border-t border-ink-200 bg-white">
        {!loading && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="pressable-sm shrink-0 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-ink-600"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2.5 px-4 py-3">
          <IconButton icon={<Paperclip size={17} />} label="Attach" size={40} />
          <div className="flex h-11 flex-1 items-center rounded-full border border-ink-200 bg-ink-50 px-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(draft)}
              placeholder="Message…"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink-900 placeholder:text-ink-400"
            />
          </div>
          <button
            onClick={() => send(draft)}
            disabled={!draft.trim()}
            aria-label="Send message"
            className="pressable-sm grid size-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-(--shadow-brand-sm) disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        </div>
        {!isSupport && (
          <button
            onClick={() => navigate('/passenger/messages/support')}
            className="pressable-sm w-full pb-3 text-center text-[12px] font-semibold text-ink-400"
          >
            Need help? Chat with DikkiConnect Support
          </button>
        )}
      </div>
    </Screen>
  )
}

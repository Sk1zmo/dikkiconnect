import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Headphones, Paperclip, Phone, Send, ShieldCheck } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Card, DotLoader, IconButton, LiveDot, Note, Skeleton } from '@/components/ui'
import { SUPPORT_THREAD } from '@/lib/data'
import { time } from '@/lib/format'
import type { ChatMessage } from '@/lib/types'
import { cn } from '@/lib/cn'

const TOPICS = [
  'My parcel is delayed',
  'Wrong OTP at the hub',
  'Refund not received',
  'Report a driver',
  'Change destination hub',
]

export default function Support() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>(SUPPORT_THREAD)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
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
      { id: `s-${m.length}`, from: 'me', text: body, at: new Date().toISOString() },
    ])
    setDraft('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((m) => [
        ...m,
        {
          id: `s-${m.length}`,
          from: 'them',
          text: "Thanks — I've pulled up your booking. Give me one moment while I check with the hub.",
          at: new Date().toISOString(),
        },
      ])
    }, 1700)
  }

  return (
    <Screen tone="white">
      <TopBar
        back
        bordered
        title="DikkiConnect Support"
        subtitle="Typically replies in 2 minutes"
        action={<IconButton icon={<Phone size={17} />} label="Call support" tone="solid" size={38} />}
      />

      <div className="device-scroll flex-1 bg-ink-50 px-4 py-4">
        <div className="mb-4 flex justify-center">
          <span className="glass rounded-full px-3 py-1.5 shadow-(--shadow-e1)">
            <LiveDot label="Agent online" />
          </span>
        </div>

        <Note tone="neutral" icon={<ShieldCheck size={14} />} className="mb-4">
          Never share OTPs, card numbers or your Aadhaar in chat. DikkiConnect agents will never ask.
        </Note>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                <Skeleton w={i % 2 ? 180 : 240} h={i % 2 ? 42 : 60} radius={16} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {messages.map((m) => {
              if (m.from === 'system') {
                return (
                  <div key={m.id} className="my-1 flex justify-center">
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
                  {!mine && (
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                      <Headphones size={13} />
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-(--shadow-e1)',
                      mine
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-white text-ink-800',
                    )}
                  >
                    <p className="text-[13.5px] leading-[1.5]">{m.text}</p>
                    <p className={cn('mt-1 text-[10px]', mine ? 'text-white/60' : 'text-ink-400')}>
                      {time(m.at)}
                    </p>
                  </div>
                </div>
              )
            })}

            {typing && (
              <div className="flex items-end gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                  <Headphones size={13} />
                </span>
                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-(--shadow-e1)">
                  <DotLoader />
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && messages.length <= SUPPORT_THREAD.length && (
          <Card className="mt-5">
            <p className="mb-2.5 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
              Common topics
            </p>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => send(t)}
                  className="pressable-sm rounded-full border border-ink-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-ink-600"
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>
        )}

        <div ref={endRef} />
      </div>

      <div className="pb-safe shrink-0 border-t border-ink-200 bg-white">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <IconButton icon={<Paperclip size={17} />} label="Attach a file" size={40} />
          <div className="flex h-11 flex-1 items-center rounded-full border border-ink-200 bg-ink-50 px-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(draft)}
              placeholder="Describe your issue…"
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
        <button
          onClick={() => navigate('/help')}
          className="pressable-sm w-full pb-3 text-center text-[12px] font-semibold text-ink-400"
        >
          Browse the help centre instead
        </button>
      </div>
    </Screen>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Headphones, Paperclip, Phone, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Avatar, IconButton, Note, Skeleton } from '@/components/ui'
import { SUPPORT_THREAD } from '@/lib/data'
import { useTrip } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { rides, type RideChatMessage } from '@/lib/api'
import { time } from '@/lib/format'
import type { ChatMessage } from '@/lib/types'
import { cn } from '@/lib/cn'

const QUICK_REPLIES = [
  "I'm at the pickup point",
  'Running 5 minutes late',
  'Can we move the pickup?',
  'Thanks!',
]

/** The server's message, as this screen draws it — "me"/"them" is a fact
 *  about the viewer, not about the message, so it is resolved here rather
 *  than carried on the wire. */
function toChatMessage(m: RideChatMessage, myAccountId: string): ChatMessage {
  return { id: m.id, from: m.fromAccountId === myAccountId ? 'me' : 'them', text: m.text, at: m.at }
}

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { account } = useAuth()

  const isSupport = id === 'support'
  const trip = useTrip(isSupport ? undefined : id)
  const name = isSupport ? 'WayPool Support' : (trip?.travelerName ?? 'Driver')

  const [messages, setMessages] = useState<ChatMessage[]>(isSupport ? SUPPORT_THREAD : [])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(!isSupport)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isSupport || !id) return
    let cancelled = false
    setLoading(true)
    rides.chat
      .list(id)
      .then(({ messages: m }) => {
        if (cancelled) return
        setMessages(m.map((x) => toChatMessage(x, account?.id ?? '')))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isSupport, account?.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = (text: string) => {
    const body = text.trim()
    if (!body || sending) return
    setDraft('')

    if (isSupport) {
      // No support inbox exists yet to answer this — see the launch report.
      setMessages((m) => [
        ...m,
        { id: `m-${m.length}`, from: 'me', text: body, at: new Date().toISOString() },
      ])
      return
    }
    if (!id) return

    setSending(true)
    void rides.chat
      .send(id, body)
      .then(({ message }) => {
        setMessages((m) => [...m, toChatMessage(message, account?.id ?? '')])
      })
      .catch(() => {})
      .finally(() => setSending(false))
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
            : trip?.vehicle
              ? `${trip.vehicle.model} · ${trip.vehicle.plate}`
              : trip
                ? 'Ride details unavailable'
                : 'Loading…'
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
            Never share OTPs, card numbers or your Aadhaar in chat. WayPool agents will never ask for
            them.
          </Note>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                <Skeleton w={i % 2 ? 170 : 220} h={i % 2 ? 40 : 56} radius={28} />
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
                      <Avatar name={name} size={28} />
                    ))}
                  {/* ═══════════════════════════════════════════════════════
                      The body follows the widened ramp to --radius-2xl, but
                      the tail corner goes the other way, down to --radius-xs.
                      It was on --radius-md, which after the ramp moved is
                      soft enough to read as "no tail at all" — and once both
                      corners look the same the bubble stops pointing at who
                      said it. A round body needs a sharp tail to keep that.
                      ═══════════════════════════════════════════════════ */}
                  <div
                    className={cn(
                      'max-w-[76%] rounded-(--radius-2xl) px-3.5 py-2.5 shadow-(--shadow-e1)',
                      mine
                        ? 'rounded-br-(--radius-xs) bg-brand-600 text-white'
                        : 'rounded-bl-(--radius-xs) bg-white text-ink-800',
                    )}
                  >
                    <p className="text-[13.5px] leading-[1.5]">{m.text}</p>
                    <p
                      className={cn(
                        'tabular mt-1 text-[10px]',
                        mine ? 'text-white/60' : 'text-ink-400',
                      )}
                    >
                      {time(m.at)}
                    </p>
                  </div>
                </div>
              )
            })}
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
                className="pressable-sm inline-flex min-h-9 shrink-0 items-center rounded-full border border-ink-200 bg-white px-4 text-[12px] font-semibold text-ink-600"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2.5 px-4 py-3">
          <IconButton icon={<Paperclip size={18} />} label="Attach" size={44} />
          <div className="flex h-12 flex-1 items-center rounded-full border border-ink-200 bg-ink-50 px-4">
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
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="pressable-sm grid size-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-(--shadow-brand-sm) disabled:opacity-40"
          >
            <PaperPlaneTilt size={17} />
          </button>
        </div>
        {!isSupport && (
          <button
            onClick={() => navigate('/passenger/messages/support')}
            className="pressable-sm w-full pb-3 text-center text-[12px] font-semibold text-ink-400"
          >
            Need help? Chat with WayPool Support
          </button>
        )}
      </div>
    </Screen>
  )
}

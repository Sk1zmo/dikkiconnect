import { useMemo, useState } from 'react'
import {
  Building2,
  Car,
  ChevronDown,
  CreditCard,
  Headphones,
  Package,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { Button, Card, EmptyState, SearchField, SectionHeader } from '@/components/ui'
import { useDebounced } from '@/lib/hooks'
import { cn } from '@/lib/cn'

const CATEGORIES = [
  { id: 'parcels', icon: Package, label: 'Parcels', count: 12 },
  { id: 'rides', icon: Users, label: 'Rides', count: 8 },
  { id: 'payments', icon: CreditCard, label: 'Payments', count: 9 },
  { id: 'safety', icon: ShieldCheck, label: 'Safety & OTP', count: 7 },
  { id: 'driving', icon: Car, label: 'Driving', count: 10 },
  { id: 'hubs', icon: Building2, label: 'Hubs', count: 6 },
]

const FAQS = [
  {
    q: 'Why do I need an OTP at every handoff?',
    a: 'Each OTP marks a change in who is legally responsible for your parcel. Four checkpoints — you to the hub, hub to traveler, traveler to hub, hub to receiver — mean any dispute has an exact timestamp for when custody moved and who held it. We deliberately do not add more OTPs than that: extra codes create friction without adding a real accountability boundary.',
    cat: 'safety',
  },
  {
    q: 'What happens if nobody picks up my parcel?',
    a: 'If no traveler accepts within 24 hours we escalate to our ops team and prioritise it in the job feed. If it still has not moved after 48 hours we refund you in full and you can collect the parcel from the hub.',
    cat: 'parcels',
  },
  {
    q: 'How is DikkiConnect cheaper than a courier?',
    a: 'The boot space was travelling to your destination city anyway. We are not paying for a dedicated vehicle or a hub-and-spoke sorting network — just a handling fee to two hub partners and a share to the driver. That is why the same parcel costs roughly half of a standard courier and arrives the same or next day.',
    cat: 'payments',
  },
  {
    q: 'What can I not send?',
    a: 'Cash, jewellery, liquids, aerosols, perishables needing refrigeration, live animals, alcohol, tobacco, weapons, and anything illegal to transport in India. You accept this declaration before every booking, and the hub photographs each parcel at intake.',
    cat: 'parcels',
  },
  {
    q: 'Is my parcel insured?',
    a: 'DikkiConnect Protect covers up to ₹5,000 declared value against loss or damage in transit for ₹25 per parcel. That cap is a deliberate pilot limit while we build out insurance partnerships — do not send anything worth more than that yet.',
    cat: 'payments',
  },
  {
    q: 'Is carpooling on DikkiConnect legal?',
    a: 'DikkiConnect rides are structured as cost-sharing: riders contribute to fuel and tolls on a trip the driver is already making. Drivers are not commercial operators and fares are capped at cost, which is what keeps this inside the Motor Vehicles Act carpooling exemption in Karnataka.',
    cat: 'rides',
  },
  {
    q: 'Where does my Aadhaar data go?',
    a: 'Nowhere near our servers. Verification runs through a UIDAI-licensed KUA partner and we store only their verification token plus a masked reference. We are not licensed to hold raw Aadhaar numbers and do not want to be.',
    cat: 'safety',
  },
  {
    q: 'When do I get paid as a driver?',
    a: 'Parcel payouts credit to your DikkiConnect wallet the moment the destination hub confirms drop-off. Seat fares credit at trip completion. Wallet balance transfers to your bank every Monday, or instantly for a 1% fee.',
    cat: 'driving',
  },
  {
    q: 'How much does a hub partner earn?',
    a: 'A flat ₹15 per parcel handled, settled weekly. Flat rather than percentage-based, so your income does not depend on guessing what is inside the box.',
    cat: 'hubs',
  },
  {
    q: 'Can I change the destination hub after booking?',
    a: 'Yes, at no cost while the parcel is still in transit. Message support and we will re-route it. A fresh receiver OTP is issued when it lands at the new hub.',
    cat: 'parcels',
  },
]

export default function HelpCenter() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const debounced = useDebounced(query, 200)

  const visible = useMemo(() => {
    let list = FAQS
    if (category) list = list.filter((f) => f.cat === category)
    const q = debounced.trim().toLowerCase()
    if (q) list = list.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    return list
  }, [category, debounced])

  return (
    <Screen>
      <TopBar back title="Help centre" />

      <div className="shrink-0 px-5 pb-3">
        <SearchField value={query} onChange={setQuery} placeholder="Search help articles" />
      </div>

      <ScreenBody>
        {!debounced && (
          <>
            <SectionHeader title="Browse by topic" />
            <div className="mb-6 grid grid-cols-3 gap-2.5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                const active = category === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(active ? null : c.id)}
                    className={cn(
                      'pressable flex flex-col items-center gap-2 rounded-(--radius-lg) border-2 bg-white px-2 py-4 transition-all',
                      active
                        ? 'border-brand-600 bg-brand-50/60 shadow-(--shadow-brand-sm)'
                        : 'border-ink-200',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-10 place-items-center rounded-(--radius-sm)',
                        active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600',
                      )}
                    >
                      <Icon size={19} />
                    </span>
                    <span className="text-[11.5px] font-bold text-ink-800">{c.label}</span>
                    <span className="text-[10px] text-ink-400">{c.count} articles</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <SectionHeader
          title={
            debounced
              ? `${visible.length} result${visible.length === 1 ? '' : 's'}`
              : category
                ? CATEGORIES.find((c) => c.id === category)?.label ?? 'Articles'
                : 'Common questions'
          }
          action={category ? 'Clear' : undefined}
          onAction={() => setCategory(null)}
        />

        {visible.length === 0 ? (
          <EmptyState
            icon={<Search size={26} />}
            title="No articles found"
            body="Try different words, or chat with a human who can look at your specific booking."
            actionLabel="Chat with support"
            actionTo="/support"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {visible.map((f) => {
              const isOpen = open === f.q
              return (
                <Card key={f.q} padded={false} className="overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : f.q)}
                    className="pressable flex w-full items-start gap-3 p-4 text-left"
                  >
                    <span className="min-w-0 flex-1 text-[14px] font-bold text-ink-900">{f.q}</span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        'mt-0.5 shrink-0 text-ink-400 transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="anim-fade-up border-t border-ink-100 px-4 py-3.5">
                      <p className="text-[13px] leading-[1.65] text-ink-600">{f.a}</p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        <Card className="mt-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Headphones size={22} />
          </span>
          <p className="mt-3 text-[15px] font-bold text-ink-900">Still stuck?</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
            Our support team can see your bookings and hub records, so they can usually resolve
            things in one message.
          </p>
          <Button block className="mt-4" to="/support">
            Chat with support
          </Button>
        </Card>
      </ScreenBody>
    </Screen>
  )
}

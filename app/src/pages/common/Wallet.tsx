import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Gift,
  Plus,
  RotateCcw,
  Smartphone,
  Wallet as WalletIcon,
} from 'lucide-react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  KeyValue,
  Note,
  Segmented,
  SectionHeader,
  Sheet,
  SkeletonList,
  useToast,
} from '@/components/ui'
import { PromoBanner } from '@/components/domain/Cards'
import { EmptyWalletArt } from '@/components/viz/Illustrations'
import { SENDER_TXNS, TRAVELER_TXNS } from '@/lib/data'
import { inr, relative } from '@/lib/format'
import { useApp } from '@/lib/store'
import { useCountUp, useLoaded } from '@/lib/hooks'
import { cn } from '@/lib/cn'

type Tab = 'all' | 'in' | 'out'

const METHOD_ICON = {
  upi: Smartphone,
  card: CreditCard,
  wallet: WalletIcon,
  payout: Banknote,
  refund: RotateCcw,
} as const

const TOP_UPS = [200, 500, 1000, 2000]

export default function WalletPage() {
  const toast = useToast()
  const { balance, addMoney, role } = useApp()

  const [tab, setTab] = useState<Tab>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [amount, setAmount] = useState(500)
  const [adding, setAdding] = useState(false)

  const isEarner = role === 'traveler' || role === 'hub'
  const source = isEarner ? TRAVELER_TXNS : SENDER_TXNS
  const { loading } = useLoaded(source, 950)
  const animated = useCountUp(balance, 1000)

  const visible = useMemo(() => {
    if (tab === 'in') return source.filter((t) => t.kind === 'credit')
    if (tab === 'out') return source.filter((t) => t.kind === 'debit')
    return source
  }, [tab, source])

  const monthIn = source.filter((t) => t.kind === 'credit').reduce((s, t) => s + t.amount, 0)
  const monthOut = source
    .filter((t) => t.kind === 'debit')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const topUp = () => {
    setAdding(true)
    setTimeout(() => {
      addMoney(amount)
      setAdding(false)
      setAddOpen(false)
      toast.success('Money added', `${inr(amount)} credited to your DikkiConnect wallet`)
    }, 1300)
  }

  return (
    <Screen>
      <LargeTitle
        title={isEarner ? 'Earnings' : 'Wallet'}
        subtitle={isEarner ? 'Payouts and settlements' : 'Balance, offers and history'}
        className="pt-safe"
      />

      <ScreenBody>
        {/* Balance card */}
        <Card className="brand-gradient brand-mesh border-0 text-white" elevation={3}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-semibold text-white/70">
                {isEarner ? 'Available for payout' : 'Wallet balance'}
              </p>
              <p className="tabular text-display mt-1.5 text-[36px] leading-none font-extrabold">
                {inr(animated)}
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-md) bg-white/15 backdrop-blur-md">
              <WalletIcon size={21} />
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => (isEarner ? toast.info('Payout scheduled', 'Settles every Monday.') : setAddOpen(true))}
              className="pressable flex items-center justify-center gap-2 rounded-(--radius-md) bg-white py-3 text-[13.5px] font-bold text-brand-700 shadow-(--shadow-e3)"
            >
              {isEarner ? <Banknote size={16} /> : <Plus size={16} />}
              {isEarner ? 'Withdraw' : 'Add money'}
            </button>
            <button
              onClick={() => toast.info('Statement', 'A PDF statement has been emailed to you.')}
              className="pressable flex items-center justify-center gap-2 rounded-(--radius-md) bg-white/15 py-3 text-[13.5px] font-bold ring-1 ring-white/20 backdrop-blur-md"
            >
              Statement
            </button>
          </div>
        </Card>

        {/* Month summary */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Card className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-success-50 text-success-600">
              <ArrowDownLeft size={17} />
            </span>
            <div className="min-w-0">
              <p className="tabular text-[16px] font-extrabold text-ink-900">{inr(monthIn)}</p>
              <p className="text-[11px] font-medium text-ink-500">Money in</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-danger-50 text-danger-600">
              <ArrowUpRight size={17} />
            </span>
            <div className="min-w-0">
              <p className="tabular text-[16px] font-extrabold text-ink-900">{inr(monthOut)}</p>
              <p className="text-[11px] font-medium text-ink-500">Money out</p>
            </div>
          </Card>
        </div>

        {!isEarner && (
          <div className="mt-4">
            <PromoBanner
              title="₹100 for every friend"
              body="They get ₹50 off their first parcel"
              code="INVITE"
              icon={<Gift size={20} />}
              onClick={() => toast.success('Invite link copied', 'Share it anywhere.')}
            />
          </div>
        )}

        {/* Transactions */}
        <div className="mt-6">
          <SectionHeader title="Transactions" />
          <div className="mb-3">
            <Segmented
              value={tab}
              onChange={setTab}
              size="sm"
              options={[
                { value: 'all', label: 'All' },
                { value: 'in', label: 'Money in' },
                { value: 'out', label: 'Money out' },
              ]}
            />
          </div>

          {loading ? (
            <SkeletonList count={4} />
          ) : visible.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                art={<EmptyWalletArt />}
                title="Nothing here yet"
                body={
                  tab === 'in'
                    ? 'Credits, refunds and cashback will show up here.'
                    : 'Payments you make will show up here.'
                }
              />
            </Card>
          ) : (
            <Card padded={false}>
              {visible.map((t, i) => {
                const Icon = METHOD_ICON[t.method]
                const credit = t.kind === 'credit'
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5',
                      i > 0 && 'border-t border-ink-100',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-(--radius-sm)',
                        credit ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-500',
                      )}
                    >
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-ink-900">{t.label}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
                        {t.sub} · {relative(t.at)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        'tabular shrink-0 text-[14px] font-extrabold',
                        credit ? 'text-success-600' : 'text-ink-900',
                      )}
                    >
                      {credit ? '+' : '−'}
                      {inr(Math.abs(t.amount))}
                    </p>
                  </div>
                )
              })}
            </Card>
          )}
        </div>

        {isEarner && (
          <Note tone="brand" className="mt-5" title="Payout schedule">
            Earnings settle to your registered bank account every Monday. Instant withdrawal is
            available for a 1% fee once your bank verification is complete.
          </Note>
        )}
      </ScreenBody>

      {/* Add money */}
      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add money"
        subtitle="Top up your DikkiConnect wallet for faster checkout"
        footer={
          <Button block size="lg" loading={adding} onClick={topUp}>
            {adding ? 'Processing…' : `Add ${inr(amount)}`}
          </Button>
        }
      >
        <div className="grid grid-cols-4 gap-2.5">
          {TOP_UPS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={cn(
                'pressable rounded-(--radius-md) border-2 py-3 text-[14px] font-bold transition-colors',
                amount === v
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-ink-200 bg-white text-ink-600',
              )}
            >
              ₹{v}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-2.5 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            Pay from
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              { icon: Smartphone, label: 'UPI', sub: 'Google Pay, PhonePe, Paytm' },
              { icon: CreditCard, label: 'HDFC •••• 4412', sub: 'Visa · expires 08/28' },
            ].map((m, i) => {
              const Icon = m.icon
              return (
                <div
                  key={m.label}
                  className={cn(
                    'flex items-center gap-3 rounded-(--radius-md) border-2 p-3.5',
                    i === 0 ? 'border-brand-600 bg-brand-50/50' : 'border-ink-200',
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-white text-ink-700 shadow-(--shadow-e1)">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-ink-900">{m.label}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-500">{m.sub}</p>
                  </div>
                  {i === 0 && <Badge tone="brand" size="sm">Selected</Badge>}
                </div>
              )
            })}
          </div>
        </div>

        <Card className="mt-4">
          <KeyValue label="Amount" value={inr(amount)} />
          <KeyValue label="Fees" value="Free" tone="success" />
          <div className="my-2 h-px bg-ink-100" />
          <KeyValue label="New balance" value={inr(balance + amount)} strong />
        </Card>
      </Sheet>
    </Screen>
  )
}

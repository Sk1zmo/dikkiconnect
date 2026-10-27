import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Money,
  CreditCard,
  Gift,
  Plus,
  ArrowCounterClockwise,
  DeviceMobile,
  Wallet as WalletIcon,
} from '@phosphor-icons/react'
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
import { inr, relative } from '@/lib/format'
import { useApp } from '@/lib/store'
import { useCountUp, useLoaded } from '@/lib/hooks'
import { cn } from '@/lib/cn'
import { explain } from '@/lib/api'

type Tab = 'all' | 'in' | 'out'

const METHOD_ICON = {
  upi: DeviceMobile,
  card: CreditCard,
  wallet: WalletIcon,
  payout: Money,
  refund: ArrowCounterClockwise,
} as const

const TOP_UPS = [200, 500, 1000, 2000]

export default function WalletPage() {
  const toast = useToast()
  const { balance, walletTxns, addMoney, role } = useApp()

  const [tab, setTab] = useState<Tab>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [amount, setAmount] = useState(500)
  const [adding, setAdding] = useState(false)

  const isEarner = role === 'traveler' || role === 'hub'
  const { loading } = useLoaded(walletTxns, 650)
  const animated = useCountUp(balance, 1000)

  const visible = useMemo(() => {
    if (tab === 'in') return walletTxns.filter((t) => t.kind === 'credit')
    if (tab === 'out') return walletTxns.filter((t) => t.kind === 'debit')
    return walletTxns
  }, [tab, walletTxns])

  const monthIn = walletTxns.filter((t) => t.kind === 'credit').reduce((s, t) => s + t.amount, 0)
  const monthOut = walletTxns
    .filter((t) => t.kind === 'debit')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const topUp = () => {
    setAdding(true)
    void (async () => {
      try {
        await addMoney(amount)
        setAddOpen(false)
        toast.success('Money added', `${inr(amount)} credited to your WayPool wallet`)
      } catch (e) {
        toast.error('Could not add money', explain(e))
      } finally {
        setAdding(false)
      }
    })()
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
              {isEarner ? <Money size={16} /> : <Plus size={16} />}
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

        {/* Month summary. The figure is the whole point of each tile, so it is
            set at display size and the label sits under it as a caption. At
            16px against an 11px label the two were close enough in weight that
            the eye read "Money in" first, which is the one thing nobody needs
            to be told twice. */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Card className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-success-50 text-success-600">
              <ArrowDownLeft size={18} />
            </span>
            <div className="min-w-0">
              <p className="tabular text-display tracking-title text-[20px] leading-none font-extrabold text-ink-900">
                {inr(monthIn)}
              </p>
              <p className="mt-1.5 text-[11.5px] font-semibold text-ink-500">Money in</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-danger-50 text-danger-600">
              <ArrowUpRight size={18} />
            </span>
            <div className="min-w-0">
              <p className="tabular text-display tracking-title text-[20px] leading-none font-extrabold text-ink-900">
                {inr(monthOut)}
              </p>
              <p className="mt-1.5 text-[11.5px] font-semibold text-ink-500">Money out</p>
            </div>
          </Card>
        </div>

        {/* Referral. This used the shared PromoBanner — a solid brand-600 slab
            — and it was the loudest object on a screen whose loudest object
            should be the balance. It is a white row now, separated by the same
            hairline as everything else, with the reward carrying the line.

            The chip is brand blue, not signal yellow. It briefly wore the
            yellow, which was wrong twice over: the rule is that signal marks
            what expires, saves or runs out, and "INVITE" is none of those —
            it is a verb. It also sits inside a button and reads as that
            button's action, and an action is the one thing the rationed
            colour must never be, or it stops meaning urgency the first time
            somebody sees it on something they can simply press. The ₹100
            already carries the value of this row. */}
        {!isEarner && (
          <button
            onClick={() => toast.success('Invite link copied', 'Share it anywhere.')}
            className="pressable mt-4 flex w-full items-center gap-3.5 rounded-(--radius-lg) border border-ink-200 bg-white p-4 text-left hover:bg-ink-50"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
              <Gift size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-1.5">
                <span className="tabular text-display tracking-title text-[21px] leading-none font-extrabold text-ink-900">
                  ₹100
                </span>
                <span className="truncate text-[12.5px] font-semibold text-ink-500">
                  for every friend
                </span>
              </span>
              <span className="mt-1.5 block truncate text-[12px] text-ink-500">
                They get ₹50 off their first parcel
              </span>
            </span>
            <Badge tone="brand">INVITE</Badge>
          </button>
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
                kind="wallet"
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
        subtitle="Top up your WayPool wallet for faster checkout"
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
                'tabular pressable min-h-12 rounded-(--radius-md) border-2 py-3.5 text-[15px] font-extrabold transition-colors',
                amount === v
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-ink-200 bg-white text-ink-600',
              )}
            >
              ₹{v}
            </button>
          ))}
        </div>

        <Note tone="neutral" className="mt-5">
          This is a pilot balance, not a real payment — nothing is actually charged. It credits your
          WayPool wallet so checkout can be tested end to end.
        </Note>

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

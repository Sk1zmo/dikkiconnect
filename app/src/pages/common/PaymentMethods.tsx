import { useState } from 'react'
import {
  Check,
  CreditCard,
  Landmark,
  Lock,
  Plus,
  Smartphone,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Group,
  ListRow,
  Note,
  Sheet,
  useToast,
} from '@/components/ui'
import { useApp } from '@/lib/store'
import { inr } from '@/lib/format'

interface Method {
  id: string
  kind: 'upi' | 'card' | 'bank'
  label: string
  sub: string
  primary?: boolean
}

const INITIAL: Method[] = [
  { id: 'm1', kind: 'upi', label: 'aditi@okhdfcbank', sub: 'HDFC Bank · UPI', primary: true },
  { id: 'm2', kind: 'card', label: 'HDFC •••• 4412', sub: 'Visa · expires 08/28' },
  { id: 'm3', kind: 'bank', label: 'ICICI •••• 8890', sub: 'Savings · for refunds' },
]

const ICONS = { upi: Smartphone, card: CreditCard, bank: Landmark }

export default function PaymentMethods() {
  const toast = useToast()
  const { balance } = useApp()

  const [methods, setMethods] = useState(INITIAL)
  const [addOpen, setAddOpen] = useState(false)
  const [newUpi, setNewUpi] = useState('')
  const [removing, setRemoving] = useState<Method | null>(null)

  const addUpi = () => {
    const id = `m${methods.length + 1}`
    setMethods((m) => [...m, { id, kind: 'upi', label: newUpi, sub: 'UPI ID' }])
    setNewUpi('')
    setAddOpen(false)
    toast.success('UPI ID added', newUpi)
  }

  const makePrimary = (id: string) => {
    setMethods((m) => m.map((x) => ({ ...x, primary: x.id === id })))
    toast.success('Default updated')
  }

  return (
    <Screen>
      <TopBar back title="Payment methods" />

      <ScreenBody>
        {/* Wallet */}
        <Card className="flex items-center gap-3.5 border-brand-100 bg-brand-50">
          <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-600 text-white">
            <WalletIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink-900">DikkiConnect Wallet</p>
            <p className="mt-0.5 text-[12px] text-ink-500">Fastest checkout, instant refunds</p>
          </div>
          <p className="tabular shrink-0 text-[16px] font-extrabold text-brand-700">
            {inr(balance)}
          </p>
        </Card>

        {/* Saved methods */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Saved methods
        </p>
        <Group>
          {methods.map((m) => {
            const Icon = ICONS[m.kind]
            return (
              <ListRow
                key={m.id}
                icon={<Icon size={17} />}
                iconTone={m.primary ? 'brand' : 'neutral'}
                title={m.label}
                subtitle={m.sub}
                trailing={
                  <div className="flex shrink-0 items-center gap-1.5">
                    {m.primary ? (
                      <Badge tone="brand" size="sm" icon={<Check size={10} />}>
                        Default
                      </Badge>
                    ) : (
                      <>
                        <button
                          onClick={() => makePrimary(m.id)}
                          className="pressable-sm rounded-full px-2.5 py-1 text-[11.5px] font-bold text-brand-600 hover:bg-brand-50"
                        >
                          Set default
                        </button>
                        <button
                          onClick={() => setRemoving(m)}
                          aria-label={`Remove ${m.label}`}
                          className="pressable-sm grid size-8 place-items-center rounded-full text-ink-400 hover:bg-danger-50 hover:text-danger-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                }
              />
            )
          })}
        </Group>

        <Button variant="outline" block className="mt-3" icon={<Plus size={17} />} onClick={() => setAddOpen(true)}>
          Add a payment method
        </Button>

        <Note tone="neutral" icon={<Lock size={15} />} className="mt-6" title="How we store this">
          DikkiConnect never stores card numbers or UPI PINs. Cards are tokenised by our PCI-DSS compliant
          gateway as required by RBI, and we only keep the last four digits.
        </Note>

        <Note tone="brand" className="mt-3" title="Refunds">
          Cancellations refund to your DikkiConnect wallet instantly, or back to the original method in 3–5
          working days if you prefer.
        </Note>
      </ScreenBody>

      {/* Add */}
      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add payment method"
        footer={
          <Button block size="lg" disabled={!newUpi.includes('@')} onClick={addUpi}>
            Add UPI ID
          </Button>
        }
      >
        <div className="mb-5 flex flex-col gap-2.5">
          {[
            { icon: Smartphone, label: 'UPI ID', sub: 'name@bank', active: true },
            { icon: CreditCard, label: 'Debit / credit card', sub: 'Visa, Mastercard, RuPay' },
            { icon: Landmark, label: 'Bank account', sub: 'For payouts and refunds' },
          ].map((o, i) => {
            const Icon = o.icon
            return (
              <div
                key={o.label}
                className={`flex items-center gap-3 rounded-(--radius-md) border-2 p-3.5 ${
                  i === 0 ? 'border-brand-600 bg-brand-50/50' : 'border-ink-200 opacity-60'
                }`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-white text-ink-700 shadow-(--shadow-e1)">
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">{o.label}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-500">{o.sub}</p>
                </div>
                {i === 0 && <Check size={17} className="shrink-0 text-brand-600" />}
              </div>
            )
          })}
        </div>

        <Field
          label="Your UPI ID"
          placeholder="name@okhdfcbank"
          value={newUpi}
          onChange={(e) => setNewUpi(e.target.value)}
          prefix={<Smartphone size={15} />}
          hint="We'll send ₹1 to verify and refund it immediately."
        />
      </Sheet>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          setMethods((m) => m.filter((x) => x.id !== removing?.id))
          toast.success('Removed', removing?.label)
          setRemoving(null)
        }}
        tone="danger"
        icon={<Trash2 size={26} />}
        title="Remove this method?"
        body={removing?.label}
        confirmLabel="Remove"
      />
    </Screen>
  )
}

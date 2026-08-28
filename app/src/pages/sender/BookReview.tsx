import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Pencil, ShieldCheck, Tag, TrendingDown } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  Divider,
  Field,
  KeyValue,
  Note,
  Sheet,
  Skeleton,
  Stepper,
  useToast,
} from '@/components/ui'
import { RouteMap } from '@/components/viz/Map'
import { categoryById, cityName, resolveHub } from '@/lib/data'
import { inr, kg } from '@/lib/format'
import { useApp } from '@/lib/store'
import { useLoaded } from '@/lib/hooks'
import { bookSteps } from './BookRoute'
import { CategoryIcon } from '@/components/domain/CategoryIcon'

const PROMOS = ['MYSORE20', 'FIRSTDROP', 'DIKKI10']

/** Step 4 — the quote. This is where the "cheaper than courier" claim lands. */
export default function BookReview() {
  const navigate = useNavigate()
  const toast = useToast()
  const { draft, patchDraft, price } = useApp()
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string>()

  // The quote is "computed server-side" — show a skeleton while it lands.
  const { loading } = useLoaded(price, 900)

  const cat = categoryById(draft.category)
  const originHub = resolveHub(draft.originHubId, draft.fromCityId)
  const destHub = resolveHub(draft.destinationHubId, draft.toCityId)
  const isP2P = draft.mode === 'p2p'

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!PROMOS.includes(code)) {
      setPromoError('That code is not valid or has expired')
      return
    }
    patchDraft({ promo: code })
    setPromoOpen(false)
    setPromoInput('')
    setPromoError(undefined)
    toast.success('Promo applied', `${code} · 20% off this booking`)
  }

  return (
    <Screen>
      <TopBar back title="Review & confirm" subtitle="Step 4 of 5" />

      <div className="shrink-0 px-5 pb-4">
        <Stepper steps={bookSteps(draft.mode)} current={3} />
      </div>

      <ScreenBody>
        {/* Route summary */}
        <Card padded={false} className="overflow-hidden">
          <RouteMap
            height={140}
            fromLabel={cityName(draft.fromCityId)}
            toLabel={cityName(draft.toCityId)}
            fromCityId={draft.fromCityId}
            toCityId={draft.toCityId}
            fromHubId={isP2P ? undefined : (originHub?.id ?? undefined)}
            toHubId={isP2P ? undefined : (destHub?.id ?? undefined)}
          />
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex flex-col items-center gap-1">
                <span className="size-2.5 rounded-full bg-brand-600 ring-4 ring-brand-600/15" />
                <span className="h-8 w-px border-l-2 border-dashed border-ink-200" />
                <span className="size-2.5 rounded-full bg-success-500 ring-4 ring-success-500/15" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-4">
                  <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                    {isP2P ? 'Collected from you at' : 'Drop at'}
                  </p>
                  <p className="truncate text-[14px] font-bold text-ink-900">
                    {isP2P
                      ? cityName(draft.fromCityId)
                      : originHub?.name.split('·').pop()?.trim()}
                  </p>
                  <p className="truncate-2 text-[12px] text-ink-500">
                    {isP2P ? draft.pickupAddress : originHub?.address}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                    {isP2P ? 'Handed over at' : 'Collect from'}
                  </p>
                  <p className="truncate text-[14px] font-bold text-ink-900">
                    {isP2P ? cityName(draft.toCityId) : destHub?.name.split('·').pop()?.trim()}
                  </p>
                  <p className="truncate-2 text-[12px] text-ink-500">
                    {isP2P ? draft.dropAddress : destHub?.address}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/sender/book/hub')}
                className="pressable-sm grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-600"
                aria-label={isP2P ? 'Edit addresses' : 'Edit hubs'}
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>
        </Card>

        {/* Parcel summary */}
        <Card className="mt-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-ink-700">
              <CategoryIcon id={cat.id} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-bold text-ink-900">
                {cat.label} · {draft.size} · {kg(draft.weightKg)}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-ink-500">
                Declared {inr(draft.declaredValue)}
                {draft.fragile && ' · Fragile'}
                {draft.insured && ' · Protected'}
              </p>
            </div>
            <button
              onClick={() => navigate('/sender/book/parcel')}
              className="pressable-sm grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-600"
              aria-label="Edit parcel"
            >
              <Pencil size={14} />
            </button>
          </div>
          {draft.receiverName && (
            <div className="mt-3 border-t border-ink-100 pt-3">
              <KeyValue label="Receiver" value={draft.receiverName} />
              {draft.receiverPhone && (
                <KeyValue label="Their mobile" value={`+91 ${draft.receiverPhone}`} />
              )}
            </div>
          )}
        </Card>

        {/* Promo */}
        <button
          onClick={() => (draft.promo ? patchDraft({ promo: null }) : setPromoOpen(true))}
          className="pressable mt-3 flex w-full items-center gap-3 rounded-(--radius-lg) border border-dashed border-brand-300 bg-brand-50/50 p-4 text-left"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-600 text-white">
            <Tag size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-ink-900">
              {draft.promo ? `${draft.promo} applied` : 'Apply a promo code'}
            </span>
            <span className="block text-[12px] text-ink-500">
              {draft.promo ? `You save ${inr(price.discount)}` : 'MYSORE20 is live this week'}
            </span>
          </span>
          <span className="shrink-0 text-[12.5px] font-bold text-brand-600">
            {draft.promo ? 'Remove' : 'Add'}
          </span>
        </button>

        {/* Price breakdown */}
        <Card className="mt-3">
          <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            Price breakdown
          </p>

          {loading ? (
            <div className="flex flex-col gap-3 py-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton h={11} w="42%" radius={5} />
                  <Skeleton h={11} w="18%" radius={5} />
                </div>
              ))}
              <Divider className="my-1" />
              <div className="flex justify-between">
                <Skeleton h={15} w="30%" radius={6} />
                <Skeleton h={17} w="26%" radius={6} />
              </div>
            </div>
          ) : (
            <>
              <KeyValue label={`Base fare · ${draft.size}`} value={inr(price.base)} />
              <KeyValue label={`Distance · ${price.km} km`} value={inr(price.distance)} />
              {price.weight > 0 && <KeyValue label="Weight surcharge" value={inr(price.weight)} />}
              {price.fragile > 0 && <KeyValue label="Fragile handling" value={inr(price.fragile)} />}
              {price.insurance > 0 && (
                <KeyValue label="DikkiConnect Protect" value={inr(price.insurance)} />
              )}
              {price.discount > 0 && (
                <KeyValue
                  label={`Promo · ${draft.promo}`}
                  value={`− ${inr(price.discount)}`}
                  tone="success"
                />
              )}
              <KeyValue label="GST (18%)" value={inr(price.gst)} />
              <Divider className="my-2" />
              <KeyValue label="Total payable" value={inr(price.total)} strong />
            </>
          )}
        </Card>

        {/* Savings callout */}
        {!loading && (
          <Card className="mt-3 flex items-center gap-3.5 border-success-100 bg-success-50">
            <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-success-500/15 text-success-600">
              <TrendingDown size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-success-800">
                {price.savedPct}% cheaper than courier
              </p>
              <p className="mt-0.5 text-[12px] text-success-700/85">
                Standard courier on this route: {inr(price.courierComparison)} · 2–5 days
              </p>
            </div>
          </Card>
        )}

        <Note tone="neutral" icon={<ShieldCheck size={15} />} className="mt-3">
          Money is held until the receiver&apos;s OTP is verified. Cancel before drop-off for a full
          refund.
        </Note>
      </ScreenBody>

      <ActionBar
        helper={
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-semibold text-ink-500">Total payable</span>
            <span className="tabular text-display text-[22px] font-extrabold text-ink-900">
              {loading ? '—' : inr(price.total)}
            </span>
          </div>
        }
      >
        <Button
          block
          size="lg"
          disabled={loading}
          onClick={() => navigate('/sender/book/payment')}
          iconRight={<ArrowRight size={18} />}
        >
          Proceed to payment
        </Button>
      </ActionBar>

      <Sheet
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        title="Apply a promo code"
        subtitle="One code per booking"
      >
        <Field
          placeholder="Enter code"
          value={promoInput}
          error={promoError}
          onChange={(e) => {
            setPromoInput(e.target.value.toUpperCase())
            setPromoError(undefined)
          }}
          onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
          suffix={
            <button
              onClick={applyPromo}
              className="pressable-sm text-[13px] font-bold text-brand-600"
            >
              Apply
            </button>
          }
        />
        <p className="mt-1 mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Available for you
        </p>
        <div className="flex flex-col gap-2">
          {PROMOS.map((code) => (
            <button
              key={code}
              onClick={() => setPromoInput(code)}
              className="pressable flex items-center gap-3 rounded-(--radius-md) border border-ink-200 bg-white p-3.5 text-left"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
                <Tag size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-extrabold tracking-wide text-ink-900">
                  {code}
                </span>
                <span className="block text-[12px] text-ink-500">20% off, max ₹100</span>
              </span>
              {promoInput === code && <Check size={17} className="shrink-0 text-brand-600" />}
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  )
}

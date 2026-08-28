import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Clock, MapPin, Sun } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { Card, Note, OtpDisplay, Skeleton } from '@/components/ui'
import { QrTicket } from '@/components/viz/Scanner'
import { hubById, otpFor } from '@/lib/data'
import { kg } from '@/lib/format'
import { useApp } from '@/lib/store'
import { categoryById } from '@/lib/data'
import { CategoryIcon } from '@/components/domain/CategoryIcon'

/** The screen you hold up at the hub counter. Brightness hint included. */
export default function DropOffQr() {
  const { id } = useParams()
  const { parcels } = useApp()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 700)
    return () => clearTimeout(t)
  }, [])

  const parcel = parcels.find((p) => p.id === id)
  if (!parcel) return <Navigate to="/sender" replace />

  const isP2P = parcel.mode === 'p2p'
  const hub = hubById(parcel.originHubId)
  const cat = categoryById(parcel.category)
  // Hub mode: the hub manager types this at intake. P2P: the traveler types it
  // at your door. Different checkpoints, so different codes.
  const otp = isP2P ? otpFor(parcel.id + 'pick') : otpFor(parcel.id)

  return (
    <Screen tone="white">
      <TopBar back title={isP2P ? 'Pickup pass' : 'Drop-off pass'} subtitle={parcel.id} />

      <ScreenBody>
        <div className="flex flex-col items-center pt-4">
          {ready ? (
            <div className="anim-scale-in">
              <QrTicket
                value={`dikkiconnect://parcel/${parcel.id}/${isP2P ? 'pickup' : 'dropoff'}`}
                caption={parcel.id}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Skeleton w={222} h={222} radius={18} />
              <Skeleton w={110} h={14} radius={7} className="mt-3" />
            </div>
          )}

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-warn-50 px-3 py-1.5 text-[11.5px] font-bold text-warn-700">
            <Sun size={13} />
            Screen brightness raised for scanning
          </p>
        </div>

        <Card className="mt-6 border-brand-100 bg-brand-50/60">
          <OtpDisplay code={otp} label={isP2P ? 'Show this to the traveler' : 'Drop-off OTP'} />
        </Card>

        <Card className="mt-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-(--radius-sm) bg-ink-100 text-[20px]">
              <CategoryIcon id={cat.id} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-ink-900">
                {cat.label} · {parcel.size} · {kg(parcel.weightKg)}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-ink-500">
                To {parcel.receiverName} · {parcel.fragile ? 'Fragile' : 'Standard handling'}
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex flex-col gap-2 border-t border-ink-100 pt-3.5">
            <p className="flex items-start gap-2.5 text-[12.5px] text-ink-600">
              <MapPin size={14} className="mt-px shrink-0 text-ink-400" />
              <span>
                <span className="font-bold text-ink-800">
                  {hub?.name.split('·').pop()?.trim()}
                </span>{' '}
                — {hub?.address}
              </span>
            </p>
            <p className="flex items-center gap-2.5 text-[12.5px] text-ink-600">
              <Clock size={14} className="shrink-0 text-ink-400" />
              Open {hub?.openFrom} – {hub?.openTo}
            </p>
          </div>
        </Card>

        <Note tone="neutral" className="mt-3" title="At the counter">
          The hub manager scans this code, weighs and photographs your parcel, then types your OTP
          to take custody. You&apos;ll get a notification the moment that happens.
        </Note>
      </ScreenBody>
    </Screen>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ScanLine, Search } from 'lucide-react'
import { Screen, ScreenBody, LargeTitle } from '@/components/layout/Screen'
import {
  Button,
  Card,
  EmptyState,
  Field,
  Note,
  SectionHeader,
  SkeletonList,
  useToast,
} from '@/components/ui'
import { ParcelCard } from '@/components/domain/Cards'
import { LiveMap } from '@/components/viz/Map'
import { EmptyRoadArt } from '@/components/viz/Illustrations'
import { useApp } from '@/lib/store'
import { useLoaded } from '@/lib/hooks'

/** Track tab — an ID lookup plus everything currently moving. */
export default function TrackList() {
  const navigate = useNavigate()
  const toast = useToast()
  const { parcels } = useApp()
  const [id, setId] = useState('')
  const [error, setError] = useState<string>()

  const active = parcels.filter((p) => !['delivered', 'cancelled'].includes(p.status))
  const inTransit = active.filter((p) => p.status === 'in_transit')
  const { loading } = useLoaded(active, 900)

  const lookup = () => {
    const code = id.trim().toUpperCase()
    if (!code) return
    const found = parcels.find((p) => p.id.toUpperCase() === code)
    if (!found) {
      setError('No parcel found with that ID')
      toast.error('Not found', `We could not find ${code}`)
      return
    }
    setError(undefined)
    navigate(`/sender/track/${found.id}`)
  }

  return (
    <Screen>
      <LargeTitle
        title="Track"
        subtitle="Follow any parcel, even ones sent to you"
        className="pt-safe"
      />

      <ScreenBody>
        <Card>
          <Field
            label="Tracking ID"
            placeholder="e.g. DKC-4821"
            value={id}
            error={error}
            onChange={(e) => {
              setId(e.target.value.toUpperCase())
              setError(undefined)
            }}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            prefix={<Search size={16} />}
          />
          <div className="flex gap-2.5">
            <Button block onClick={lookup} disabled={!id.trim()} iconRight={<ArrowRight size={17} />}>
              Track parcel
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info('Scanner', 'Point at any DikkiConnect QR to auto-fill the ID.')}
              icon={<ScanLine size={17} />}
              aria-label="Scan a DikkiConnect QR code"
              className="w-12 shrink-0 px-0"
            />
          </div>
        </Card>

        {inTransit.length > 0 && (
          <div className="mt-6">
            <SectionHeader title="On the move right now" subtitle="Live position updates" />
            <Card padded={false} className="overflow-hidden">
              <LiveMap height={180} />
              <div className="p-4">
                {inTransit.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/sender/track/${p.id}`)}
                    className="pressable flex w-full items-center gap-3 text-left"
                  >
                    <span className="relative flex size-3 shrink-0">
                      <span className="anim-ping absolute inline-flex size-full rounded-full bg-success-500" />
                      <span className="relative inline-flex size-3 rounded-full bg-success-500" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="tabular block truncate text-[13.5px] font-bold text-ink-900">
                        {p.id}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-500">
                        Approaching {p.toCityId === 'mys' ? 'Mandya' : 'destination'} · on schedule
                      </span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-ink-300" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="mt-6">
          <SectionHeader title="All active parcels" subtitle={`${active.length} in the network`} />
          {loading ? (
            <SkeletonList count={3} />
          ) : active.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                art={<EmptyRoadArt />}
                title="No parcels in transit"
                body="Once you book a parcel it appears here with live custody updates."
                actionLabel="Book a parcel"
                actionTo="/sender/book"
              />
            </Card>
          ) : (
            <div className="stagger flex flex-col gap-3">
              {active.map((p) => (
                <ParcelCard key={p.id} parcel={p} to={`/sender/track/${p.id}`} />
              ))}
            </div>
          )}
        </div>

        <Note tone="brand" className="mt-6" title="Receiving a parcel?">
          Anyone can track with just the ID — no account needed. Share the ID with your receiver and
          they can follow it too.
        </Note>
      </ScreenBody>
    </Screen>
  )
}

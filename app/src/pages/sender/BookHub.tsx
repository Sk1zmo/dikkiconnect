import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Home, Navigation } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Button,
  Card,
  Note,
  Segmented,
  Skeleton,
  Stepper,
} from '@/components/ui'
import { HubCard } from '@/components/domain/Cards'
import { AddressField } from '@/components/domain/AddressField'
import { HubMap } from '@/components/viz/Map'
import { cityName, hubsInCity } from '@/lib/data'
import { useApp } from '@/lib/store'
import { useLoaded } from '@/lib/hooks'
import { useState } from 'react'
import { bookSteps } from './BookRoute'

/** Step 3 — pick the drop hub and the collection hub. */
export default function BookHub() {
  const navigate = useNavigate()
  const { draft, patchDraft } = useApp()
  const [side, setSide] = useState<'origin' | 'destination'>('origin')

  const originHubs = hubsInCity(draft.fromCityId)
  const destHubs = hubsInCity(draft.toCityId)
  const list = side === 'origin' ? originHubs : destHubs
  const { loading } = useLoaded(list, 850)

  // Default to the nearest hub on each side so the flow never dead-ends.
  useEffect(() => {
    if (!draft.originHubId && originHubs[0]) patchDraft({ originHubId: originHubs[0].id })
    if (!draft.destinationHubId && destHubs[0]) patchDraft({ destinationHubId: destHubs[0].id })
  }, [draft.originHubId, draft.destinationHubId, originHubs, destHubs, patchDraft])

  const selectedId = side === 'origin' ? draft.originHubId : draft.destinationHubId
  const activeIndex = Math.max(0, list.findIndex((h) => h.id === selectedId))
  const isP2P = draft.mode === 'p2p'
  const ready = isP2P
    ? draft.pickupAddress.trim().length > 8 && draft.dropAddress.trim().length > 8
    : Boolean(draft.originHubId && draft.destinationHubId)

  /* ── P2P: no hubs involved, so collect the two door addresses instead ── */
  if (isP2P) {
    return (
      <Screen>
        <TopBar back title="Pickup & drop" subtitle="Step 3 of 5" />

        <div className="shrink-0 px-5 pb-4">
          <Stepper steps={bookSteps(draft.mode)} current={2} />
        </div>

        <ScreenBody>
          <Note tone="brand" icon={<Home size={15} />} title="Door to door">
            A verified traveler collects from your address and hands it to the receiver at theirs.
            No hub in between — two OTP checkpoints instead of four.
          </Note>

          <div className="mt-5">
            <AddressField
              label={`Pickup address in ${cityName(draft.fromCityId)}`}
              placeholder="Flat / house, street, area, landmark"
              value={draft.pickupAddress}
              onChange={(v) => patchDraft({ pickupAddress: v })}
              coord={draft.pickupCoord ?? undefined}
              onCoord={(p) => patchDraft({ pickupCoord: p })}
              hint="Shared with the traveler only after they accept the job."
            />
          </div>

          <div className="mt-5">
            <AddressField
              label={`Delivery address in ${cityName(draft.toCityId)}`}
              placeholder="Flat / house, street, area, landmark"
              value={draft.dropAddress}
              onChange={(v) => patchDraft({ dropAddress: v })}
              coord={draft.dropCoord ?? undefined}
              onCoord={(p) => patchDraft({ dropCoord: p })}
              hint="The receiver gets an OTP to hand over at their door."
            />
          </div>

          <Note tone="neutral" icon={<Clock size={15} />} className="mt-5" title="Timing">
            Door pickups are matched to travelers already driving your route, so collection is
            usually within a few hours rather than immediate.
          </Note>
        </ScreenBody>

        <ActionBar
          helper={
            !ready ? (
              <p className="text-[11.5px] font-semibold text-ink-500">
                Enter both addresses to continue
              </p>
            ) : undefined
          }
        >
          <Button
            block
            size="lg"
            disabled={!ready}
            onClick={() => navigate('/sender/book/review')}
            iconRight={<ArrowRight size={18} />}
          >
            Review booking
          </Button>
        </ActionBar>
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar back title="Choose hubs" subtitle="Step 3 of 5" />

      <div className="shrink-0 px-5 pb-4">
        <Stepper steps={bookSteps(draft.mode)} current={2} />
      </div>

      <div className="shrink-0 px-5 pb-4">
        <Segmented
          value={side}
          onChange={setSide}
          options={[
            { value: 'origin', label: `Drop in ${cityName(draft.fromCityId)}` },
            { value: 'destination', label: `Collect in ${cityName(draft.toCityId)}` },
          ]}
        />
      </div>

      <ScreenBody>
        <Card padded={false} className="mb-4 overflow-hidden">
          <HubMap
            height={150}
            hubIds={list.map((h) => h.id)}
            cityId={side === 'origin' ? draft.fromCityId : draft.toCityId}
            activeIndex={activeIndex}
          />
        </Card>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-(--radius-lg) border border-ink-100 bg-white p-4 shadow-(--shadow-e1)"
              >
                <div className="flex gap-3">
                  <Skeleton w={40} h={40} radius={10} />
                  <div className="flex-1">
                    <Skeleton h={12} w="52%" radius={6} className="mb-2" />
                    <Skeleton h={9} w="76%" radius={5} className="mb-1.5" />
                    <Skeleton h={9} w="44%" radius={5} />
                  </div>
                  <Skeleton w={44} h={14} radius={6} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stagger flex flex-col gap-3">
            {list.map((h) => (
              <HubCard
                key={h.id}
                hub={h}
                showLoad
                selected={selectedId === h.id}
                onSelect={() =>
                  patchDraft(
                    side === 'origin' ? { originHubId: h.id } : { destinationHubId: h.id },
                  )
                }
              />
            ))}
          </div>
        )}

        <Note
          tone="brand"
          icon={<Clock size={15} />}
          className="mt-5"
          title={side === 'origin' ? 'Drop within 24 hours' : 'Collect within 48 hours'}
        >
          {side === 'origin'
            ? 'Your booking holds a slot for 24 hours. Bring the parcel and your drop-off OTP to the counter.'
            : 'The receiver gets an OTP by SMS once the parcel lands. Free storage for 48 hours, then ₹20/day.'}
        </Note>

        {side === 'origin' && (
          <button
            onClick={() => setSide('destination')}
            className="pressable mt-4 flex w-full items-center justify-center gap-2 rounded-(--radius-md) border border-ink-200 bg-white py-3.5 text-[13.5px] font-bold text-ink-700"
          >
            <Navigation size={15} />
            Now pick the collection hub
          </button>
        )}
      </ScreenBody>

      <ActionBar>
        <Button
          block
          size="lg"
          disabled={!ready}
          onClick={() => navigate('/sender/book/review')}
          iconRight={<ArrowRight size={18} />}
        >
          Review booking
        </Button>
      </ActionBar>
    </Screen>
  )
}

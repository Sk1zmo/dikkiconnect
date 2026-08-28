import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Crosshair, Home, Loader2, MapPin, Navigation } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { ActionBar, Button, Card, Note, Segmented, Stepper } from '@/components/ui'
import { HubCard } from '@/components/domain/Cards'
import { AddressField } from '@/components/domain/AddressField'
import { HubMap } from '@/components/viz/Map'
import { cityName } from '@/lib/data'
import { useApp } from '@/lib/store'
import { useNearbyHubs } from '@/lib/nearby'
import { bookSteps } from './BookRoute'

/**
 * Step 3 — where the parcel enters the network and where it leaves it.
 *
 * Door to door collects two addresses. Hub to hub collects two *areas* and
 * ranks the counters around each: the sender's end is ranked from wherever the
 * sender is, and the receiver's end from wherever the receiver is, because a
 * hub that is convenient for one of them is frequently useless for the other.
 *
 * Both sides reuse `pickupCoord` / `dropCoord`. In door-to-door those are the
 * two doors; in hub-to-hub they are the two neighbourhoods being measured from.
 */
export default function BookHub() {
  const navigate = useNavigate()
  const { draft, patchDraft } = useApp()
  const [side, setSide] = useState<'origin' | 'destination'>('origin')

  const isP2P = draft.mode === 'p2p'

  /* The reference point for the side being viewed, and the city its hubs are
     in. Hooks run before any branch so the P2P return below cannot reorder
     them. */
  const reference = side === 'origin' ? draft.pickupCoord : draft.dropCoord
  const sideCityId = side === 'origin' ? draft.fromCityId : draft.toCityId
  const { hubs: ranked, refining, precise } = useNearbyHubs(reference, sideCityId)

  const selectedId = side === 'origin' ? draft.originHubId : draft.destinationHubId

  /* Default to the genuinely nearest hub, and only when nothing is chosen.
     Changing the address clears the choice (below), so the default follows the
     new reference point rather than stranding a hub picked against the old
     one. */
  useEffect(() => {
    if (isP2P || !ranked.length) return
    const key = side === 'origin' ? 'originHubId' : 'destinationHubId'
    if (!selectedId) patchDraft({ [key]: ranked[0].hub.id })
  }, [isP2P, ranked, selectedId, side, patchDraft])

  const ready = isP2P
    ? draft.pickupAddress.trim().length > 8 && draft.dropAddress.trim().length > 8
    : Boolean(draft.originHubId && draft.destinationHubId)

  /* ── Door to door: no hubs involved, so collect the two addresses ─────── */
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
              placeholder="Search a building, street or area"
              value={draft.pickupAddress}
              onChange={(v) => patchDraft({ pickupAddress: v })}
              coord={draft.pickupCoord ?? undefined}
              onCoord={(p) => patchDraft({ pickupCoord: p })}
              flat={draft.pickupFlat}
              onFlat={(v) => patchDraft({ pickupFlat: v })}
              landmark={draft.pickupLandmark}
              onLandmark={(v) => patchDraft({ pickupLandmark: v })}
              cityId={draft.fromCityId}
              onCityChange={(id) => patchDraft({ fromCityId: id, originHubId: null })}
              hint="Shared with the traveler only after they accept the job."
            />
          </div>

          <div className="mt-5">
            <AddressField
              label={`Delivery address in ${cityName(draft.toCityId)}`}
              placeholder="Search a building, street or area"
              value={draft.dropAddress}
              onChange={(v) => patchDraft({ dropAddress: v })}
              coord={draft.dropCoord ?? undefined}
              onCoord={(p) => patchDraft({ dropCoord: p })}
              flat={draft.dropFlat}
              onFlat={(v) => patchDraft({ dropFlat: v })}
              landmark={draft.dropLandmark}
              onLandmark={(v) => patchDraft({ dropLandmark: v })}
              cityId={draft.toCityId}
              onCityChange={(id) => patchDraft({ toCityId: id, destinationHubId: null })}
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

  /* ── Hub to hub ───────────────────────────────────────────────────────── */

  const activeIndex = Math.max(
    0,
    ranked.findIndex((r) => r.hub.id === selectedId),
  )

  const isOrigin = side === 'origin'

  /* Changing the reference area invalidates the hub chosen against the old
     one, so it is cleared and the nearest to the new area takes over. */
  const setReference = (p: { lng: number; lat: number }) =>
    patchDraft(
      isOrigin ? { pickupCoord: p, originHubId: null } : { dropCoord: p, destinationHubId: null },
    )

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
        {/* The reference area. Everything below is measured from this. */}
        <AddressField
          label={
            isOrigin
              ? 'Where are you sending from?'
              : `Where is it going in ${cityName(draft.toCityId)}?`
          }
          placeholder={isOrigin ? 'Your area or street' : "The receiver's area or street"}
          value={isOrigin ? draft.pickupAddress : draft.dropAddress}
          onChange={(v) => patchDraft(isOrigin ? { pickupAddress: v } : { dropAddress: v })}
          coord={(isOrigin ? draft.pickupCoord : draft.dropCoord) ?? undefined}
          onCoord={setReference}
          cityId={sideCityId}
          onCityChange={(id) =>
            patchDraft(
              isOrigin
                ? { fromCityId: id, originHubId: null }
                : { toCityId: id, destinationHubId: null },
            )
          }
          showMap={false}
          hint={
            isOrigin
              ? 'Only used to sort the counters below by how far they are from you.'
              : 'Only used to find a counter the receiver can reach easily.'
          }
        />

        <Card padded={false} className="my-4 overflow-hidden">
          <HubMap
            height={150}
            hubIds={ranked.map((r) => r.hub.id)}
            cityId={sideCityId}
            activeIndex={activeIndex}
          />
        </Card>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            {ranked.length} counter{ranked.length === 1 ? '' : 's'} in {cityName(sideCityId)}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
            {refining ? (
              <>
                <Loader2 size={11} className="anim-spin" />
                Checking road distances…
              </>
            ) : precise ? (
              <>
                <Navigation size={11} className="text-brand-600" />
                Sorted by drive distance
              </>
            ) : reference ? (
              <>
                <MapPin size={11} className="text-brand-600" />
                Sorted by straight-line distance
              </>
            ) : (
              <>
                <Crosshair size={11} />
                Set an area to sort these
              </>
            )}
          </p>
        </div>

        {ranked.length === 0 ? (
          <div className="rounded-(--radius-lg) border border-ink-200 bg-white p-6 text-center">
            <MapPin size={24} className="mx-auto mb-3 text-ink-300" />
            <p className="text-[14px] font-semibold text-ink-700">
              No counters in {cityName(sideCityId)} yet
            </p>
            <p className="mt-1 text-[12.5px] text-ink-500">
              Pick a different city, or switch to door-to-door and a traveler will collect from the
              address directly.
            </p>
          </div>
        ) : (
          <div className="stagger flex flex-col gap-3">
            {ranked.map((r, i) => (
              <HubCard
                key={r.hub.id}
                hub={r.hub}
                showLoad
                km={r.km}
                minutes={r.minutes}
                road={r.road}
                nearest={i === 0 && Boolean(reference)}
                selected={selectedId === r.hub.id}
                onSelect={() =>
                  patchDraft(
                    isOrigin ? { originHubId: r.hub.id } : { destinationHubId: r.hub.id },
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
          title={isOrigin ? 'Drop within 24 hours' : 'Collect within 48 hours'}
        >
          {isOrigin
            ? 'Your booking holds a slot for 24 hours. Bring the parcel and your drop-off OTP to the counter.'
            : 'The receiver gets an OTP by email once the parcel lands. Free storage for 48 hours, then ₹20/day.'}
        </Note>

        {isOrigin && (
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

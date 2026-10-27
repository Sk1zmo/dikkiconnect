import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CheckCircle, Users } from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import { Avatar, Badge, Card, EmptyState, OtpInput, SkeletonList, useToast } from '@/components/ui'
import { cityName } from '@/lib/data'
import { useTrip } from '@/lib/store'
import { rides, explain } from '@/lib/api'
import type { RideBooking } from '@/lib/types'
import { inr, time } from '@/lib/format'

/**
 * The driver's side of the boarding OTP — the half that did not exist before
 * this: a passenger's app could show a code, but nothing anywhere let a
 * driver type it in and have the server actually check it. Without this
 * screen the whole mechanic was theatre, the exact failure the server-issued
 * OTP was built to rule out for parcels.
 */
export default function TripManifest() {
  const { id } = useParams()
  const toast = useToast()
  const trip = useTrip(id)

  const [bookings, setBookings] = useState<RideBooking[] | null>(null)
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [verifying, setVerifying] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    rides
      .one(id)
      .then(({ bookings: b }) => {
        if (!cancelled) setBookings(b ?? [])
      })
      .catch(() => {
        if (!cancelled) setBookings([])
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (trip === null) return <Navigate to="/traveler/trips" replace />
  if (!trip || !id) return null

  const verify = async (bookingId: string) => {
    const code = codes[bookingId] ?? ''
    if (code.length < 6 || verifying) return
    setVerifying(bookingId)
    try {
      const { booking } = await rides.board(bookingId, code)
      setBookings((list) => (list ? list.map((b) => (b.id === bookingId ? booking : b)) : list))
      toast.success('Boarded', 'This seat is confirmed on board.')
    } catch (e) {
      toast.error('Code not accepted', explain(e))
      setCodes((c) => ({ ...c, [bookingId]: '' }))
    } finally {
      setVerifying(null)
    }
  }

  const active = (bookings ?? []).filter((b) => b.status !== 'cancelled')

  return (
    <Screen tone="white">
      <TopBar
        back
        backTo="/traveler/trips"
        title="Passenger manifest"
        subtitle={`${cityName(trip.fromCityId)} → ${cityName(trip.toCityId)} · ${time(trip.departAt)}`}
      />

      <ScreenBody>
        {bookings === null ? (
          <SkeletonList count={3} />
        ) : active.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              kind="rides"
              title="No seats booked yet"
              body="Passengers who book this ride will show up here to board."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((b) => {
              const boarded = b.status !== 'upcoming'
              return (
                <Card key={b.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={b.passengerName} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-ink-900">
                        {b.passengerName}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-500">
                        {b.seats} seat{b.seats > 1 ? 's' : ''} · {inr(b.fare)} · {b.boardingPoint}
                      </p>
                    </div>
                    {boarded ? (
                      <Badge tone="success" size="sm">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle size={12} /> Boarded
                        </span>
                      </Badge>
                    ) : (
                      <Users size={16} className="shrink-0 text-ink-400" />
                    )}
                  </div>

                  {!boarded && (
                    <div className="mt-3.5 border-t border-ink-100 pt-3.5">
                      <p className="mb-2 text-[11.5px] font-semibold text-ink-500">
                        Enter the code they show you at pickup
                      </p>
                      <OtpInput
                        value={codes[b.id] ?? ''}
                        onChange={(v) => setCodes((c) => ({ ...c, [b.id]: v }))}
                        onComplete={() => void verify(b.id)}
                        disabled={verifying === b.id}
                      />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </ScreenBody>
    </Screen>
  )
}

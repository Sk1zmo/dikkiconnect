import { useCallback, useEffect, useState } from 'react'
import { ApiError, custody, explain, type Checkpoint, type ServerParcel } from './api'

/* ═══════════════════════════════════════════════════════════════════════════
   The hand-off gate, moved to the server.

   The `lib/otp.ts` this replaces — now deleted — derived the expected code on
   the device from the parcel id, compared it in the browser,
   and offered to show it to the person about to type it. On one phone running
   a demo that was a reasonable convenience and it said so. With two real
   parties it is not a check at all: the code is computable by whoever holds
   the parcel, and the device that decides whether the code is right is the
   device that wants it to be right.

   Here the code is issued by the server, held by the server, and compared by
   the server, which in the same call advances custody and writes the event.
   Verification and the state change are one operation on purpose — there is no
   window in which a code has been accepted but the parcel has not moved, and
   no way to replay an accepted code, because passing it consumes it.

   ── Why photographs come first ───────────────────────────────────────────
   The screens used to verify the code and then ask for photos. The server
   needs both in one request, so the order is now photos, then code. That is
   also the better order on a hub counter: you photograph the box while it is
   in front of you, and the last thing you do is read six digits off someone
   else's phone.
   ═══════════════════════════════════════════════════════════════════════════ */

export const HANDOFF_MAX_ATTEMPTS = 5

export interface CustodyGate {
  /** Attempts remaining before the server locks this checkpoint. */
  attemptsLeft: number
  locked: boolean
  /** Plain-language text for the last failure, or undefined. */
  error?: string
  passed: boolean
  submitting: boolean
  /**
   * Verifies the code and, if it is right, advances custody — one call.
   * Resolves with the server's parcel on success and `null` on refusal; the
   * reason is on `error` either way, so a caller can simply check for null.
   */
  submit: (code: string) => Promise<ServerParcel | null>
  reset: () => void
}

/**
 * @param parcelId   the parcel in hand
 * @param checkpoint which of the four hand-offs this is
 * @param photoIds   ids already uploaded. The server refuses an empty list.
 */
export function useCustodyGate(
  parcelId: string | undefined,
  checkpoint: Checkpoint,
  photoIds: string[],
): CustodyGate {
  const [attemptsLeft, setAttemptsLeft] = useState(HANDOFF_MAX_ATTEMPTS)
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState<string>()
  const [passed, setPassed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(
    async (code: string) => {
      if (!parcelId || locked || submitting || passed) return null
      setSubmitting(true)
      setError(undefined)
      try {
        const { parcel } = await custody.complete(checkpoint, {
          parcelId,
          code,
          photoIds,
          coords: await coarsePosition(),
        })
        setPassed(true)
        return parcel
      } catch (e) {
        setError(explain(e))
        /* The attempt count is the server's, not ours. Counting locally would
           drift the moment the same checkpoint is tried from another device. */
        if (e instanceof ApiError) {
          const left = e.data?.attemptsLeft
          if (typeof left === 'number') setAttemptsLeft(left)
          if (e.code === 'locked') {
            setAttemptsLeft(0)
            setLocked(true)
          }
        }
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [parcelId, checkpoint, photoIds, locked, submitting, passed],
  )

  const reset = useCallback(() => {
    setError(undefined)
    setPassed(false)
  }, [])

  return { attemptsLeft, locked, error, passed, submitting, submit, reset }
}

/* ═══════════════════════════════════════════════════════════════════════════
   The other side of the gate: the code the giving party holds up.

   This is only ever called on the device that currently has the parcel. The
   server will not issue a code for a checkpoint the parcel cannot pass, so a
   screen asking at the wrong moment gets `out-of-order` rather than a number
   that looks real.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CustodyCode {
  code?: string
  loading: boolean
  error?: string
  refresh: () => void
}

export function useCustodyCode(
  parcelId: string | undefined,
  checkpoint: Checkpoint,
  enabled = true,
): CustodyCode {
  const [code, setCode] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!enabled || !parcelId) return
    let cancelled = false
    setLoading(true)
    setError(undefined)
    custody
      .code(parcelId, checkpoint)
      .then(({ code: c }) => {
        if (!cancelled) setCode(c)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(explain(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [parcelId, checkpoint, enabled, nonce])

  return { code, loading, error, refresh: () => setNonce((n) => n + 1) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Where the hand-off happened.

   Best-effort and never blocking: a refused or slow location must not stop a
   parcel moving, so this resolves to undefined after three seconds and the
   event is written without coordinates. A missing location on one event is a
   gap in the record; a hub manager stuck at a counter is a broken product.
   ═══════════════════════════════════════════════════════════════════════════ */
function coarsePosition(): Promise<{ lat: number; lng: number } | undefined> {
  if (!navigator.geolocation) return Promise.resolve(undefined)
  return new Promise((resolve) => {
    let settled = false
    const finish = (v?: { lat: number; lng: number }) => {
      if (settled) return
      settled = true
      resolve(v)
    }
    const timer = window.setTimeout(() => finish(undefined), 3000)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer)
        finish({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        window.clearTimeout(timer)
        finish(undefined)
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60_000 },
    )
  })
}

/* ═══════════════════════════════════════════════════════════════════════════
   Several codes at once — a hub releasing a boot-load.

   One code per parcel, because that is what the server issues and what it
   will check. A single shared "release code" for five parcels would mean any
   one of them could be signed for with a code earned by another, which is
   precisely the audit question a custody chain exists to answer.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ReleaseCodes {
  codes: Array<{ id: string; code: string }>
  loading: boolean
  /** Set when at least one code could not be issued, with the reason. */
  error?: string
}

export function useReleaseCodes(
  parcelIds: string[],
  checkpoint: Checkpoint,
  enabled = true,
): ReleaseCodes {
  const [codes, setCodes] = useState<Array<{ id: string; code: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  /* The array identity changes on every render of the parent, so the effect
     keys off the contents instead — otherwise this would re-issue codes in a
     loop for as long as the screen is open. */
  const key = parcelIds.join(',')

  useEffect(() => {
    if (!enabled || !parcelIds.length) return
    let cancelled = false
    setLoading(true)
    setError(undefined)
    Promise.all(
      parcelIds.map((id) =>
        custody
          .code(id, checkpoint)
          .then(({ code }) => ({ id, code, failure: undefined as string | undefined }))
          .catch((e: unknown) => ({ id, code: '', failure: explain(e) })),
      ),
    ).then((results) => {
      if (cancelled) return
      setCodes(results.filter((r) => r.code).map(({ id, code }) => ({ id, code })))
      const failed = results.find((r) => r.failure)
      if (failed) setError(`${failed.id}: ${failed.failure}`)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, checkpoint, enabled])

  return { codes, loading, error }
}

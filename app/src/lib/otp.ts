import { useCallback, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   Custody-handoff OTPs.

   Every physical handoff in the PRD is gated by a code one party shows and the
   other types. These checks are strict: only the parcel's real code passes,
   wrong entries are counted, and five failures lock the checkpoint until it is
   restarted. Nothing here accepts "any six digits".

   On a single device the counterpart's screen isn't in front of you, so each
   gate can disclose the expected code on request. That is a convenience of a
   one-device build, not a hole in the check — a disclosed code still has to be
   entered, and a wrong one still fails.
   ═══════════════════════════════════════════════════════════════════════════ */

export const HANDOFF_MAX_ATTEMPTS = 5

export interface OtpGate {
  /** The code the counterpart is showing. */
  expected: string
  /** Attempts remaining before this checkpoint locks. */
  attemptsLeft: number
  locked: boolean
  /** Error text for the last failed attempt, or undefined. */
  error?: string
  /** True once the correct code has been entered. */
  passed: boolean
  /** Has the user asked to see the code on this device? */
  revealed: boolean
  reveal: () => void
  /** Strictly check an entry. Returns true only for the real code. */
  check: (value: string) => boolean
  reset: () => void
}

export function useOtpGate(expected: string): OtpGate {
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState<string>()
  const [passed, setPassed] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const attemptsLeft = Math.max(0, HANDOFF_MAX_ATTEMPTS - attempts)
  const locked = attemptsLeft === 0

  const check = useCallback(
    (value: string) => {
      if (locked) {
        setError('Too many wrong entries. Restart this handoff to try again.')
        return false
      }
      if (value === expected) {
        setError(undefined)
        setPassed(true)
        return true
      }
      const next = attempts + 1
      setAttempts(next)
      const left = Math.max(0, HANDOFF_MAX_ATTEMPTS - next)
      setError(
        left === 0
          ? 'Too many wrong entries. Restart this handoff to try again.'
          : `That code doesn’t match this parcel. ${left} attempt${left === 1 ? '' : 's'} left.`,
      )
      return false
    },
    [attempts, expected, locked],
  )

  const reset = useCallback(() => {
    setAttempts(0)
    setError(undefined)
    setPassed(false)
  }, [])

  return {
    expected,
    attemptsLeft,
    locked,
    error,
    passed,
    revealed,
    reveal: () => setRevealed(true),
    check,
    reset,
  }
}

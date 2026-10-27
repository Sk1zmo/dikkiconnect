/* ═══════════════════════════════════════════════════════════════════════════
   When is something scarce?

   The app has exactly one colour that means "this expires, this saves money,
   this is nearly gone" — signal yellow. A colour with one meaning is only
   worth having if the rule behind it is consistent, and the first cut of
   these badges hard-coded six different numbers across five screens: two
   seats here, ninety minutes there, eighteen hours in the hub, seventy per
   cent on a shelf. Each was defensible on its own and together they were not
   a rule, they were six opinions.

   So they live here, named, with the reasoning attached, and every screen
   asks rather than decides. Changing what "nearly gone" means is now one
   edit in one file instead of a search across the pages directory.

   None of these are product decisions that have been made — they are the
   defaults chosen when the brief needed a cut-off and the PRD did not
   specify one. If the PRD grows real windows, this is the file to change,
   and nothing else has to move.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Seats at or below which a trip reads as filling up rather than available. */
export const SCARCE_SEATS = 2

/**
 * Minutes before departure at which a ride stops being "later today" and
 * becomes a deadline you act on. Shorter on a screen you opened deliberately
 * (you are already looking at this ride) than in a list you are scanning,
 * where the warning has to arrive earlier to be useful.
 */
export const LEAVING_SOON_MINS = 90
export const LEAVING_SOON_MINS_LIST = 180

/**
 * Hours into a 24-hour hub hold at which a parcel starts being flagged.
 * Six hours of notice: long enough to act on during one shift, short enough
 * that the flag still means something when it appears.
 */
export const HOLD_WARN_HOURS = 18
export const HOLD_TOTAL_HOURS = 24

/** Percentage of shelf capacity above which a hub reads as running hot. */
export const SHELF_BUSY_PCT = 70

/* ── Predicates ───────────────────────────────────────────────────────────
   Screens call these rather than comparing numbers themselves, so a rule can
   gain a condition without every call site learning about it. Each one is
   deliberately total: "sold out" is not scarce, and a departure already in
   the past is not imminent. */

/** True while seats remain but few enough to hurry. Sold out is not scarce. */
export const seatsScarce = (seatsLeft: number) => seatsLeft > 0 && seatsLeft <= SCARCE_SEATS

/** Minutes from now until `when`. Negative once it has passed. */
export const minsUntil = (when: string) => (new Date(when).getTime() - Date.now()) / 60_000

/** True while departure is ahead and close. A departure past is not soon. */
export function leavingSoon(departAt: string, within = LEAVING_SOON_MINS) {
  const mins = minsUntil(departAt)
  return mins > 0 && mins <= within
}

/** True in the window before a hold expires — not after, where warn owns it. */
export function holdEndingSoon(intakeAt: string) {
  const age = (Date.now() - new Date(intakeAt).getTime()) / 3_600_000
  return age >= HOLD_WARN_HOURS && age < HOLD_TOTAL_HOURS
}

/** True when a hub's shelves are full enough to change how it is worked. */
export const shelfBusy = (loadPct: number) => loadPct > SHELF_BUSY_PCT

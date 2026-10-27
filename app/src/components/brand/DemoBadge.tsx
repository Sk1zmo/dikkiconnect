import { DEMO } from '@/lib/demo'

/**
 * The mark of a demo build.
 *
 * Always on top, and impossible to dismiss. The risk with a sign-in-free
 * build is not that somebody gets in — it is that somebody is shown it,
 * believes they were shown the product, and later discovers the accounts
 * were never real. A label costs a few pixels and removes that entirely.
 *
 * It took two goes to place. Floating at the top centre it landed on every
 * screen's title; moved to the bottom left it landed on the sticky action
 * bar, which is worse, because that one is a button. The problem was never
 * the position — it was that a floating badge has no position that is free
 * on all forty-four screens.
 *
 * So it does not float. It is a strip in the layout, directly above the
 * app, exactly like the offline/slow-connection banner it sits next to, and
 * it pushes the product down by twenty pixels instead of covering it. The
 * one thing a permanent label must never do is obscure the thing it labels.
 *
 * Returns null in the real build, and the whole component is dead code there
 * because DEMO is inlined false at build time.
 */
export function DemoBadge() {
  if (!DEMO) return null

  return (
    <div
      className="flex shrink-0 items-center justify-center gap-2 bg-warn-500 py-1 text-[10px] font-extrabold tracking-[0.14em] text-ink-900 uppercase"
      role="status"
    >
      Demo · no sign-in
    </div>
  )
}

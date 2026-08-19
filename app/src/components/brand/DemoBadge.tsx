import { DEMO } from '@/lib/demo'

/**
 * The mark of a demo build.
 *
 * Fixed, always on top, and impossible to dismiss. The risk with a
 * sign-in-free build is not that somebody gets in — it is that somebody is
 * shown it, believes they were shown the product, and later discovers the
 * accounts were never real. A label costs a few pixels and removes that
 * entirely.
 *
 * Returns null in the real build, and the whole component is dead code there
 * because DEMO is inlined false at build time.
 */
export function DemoBadge() {
  if (!DEMO) return null

  return (
    <span
      className="pointer-events-none fixed top-0 left-1/2 z-[300] -translate-x-1/2 rounded-b-lg bg-warn-500 px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] text-ink-900 uppercase shadow-md"
      role="status"
    >
      Demo · no sign-in
    </span>
  )
}

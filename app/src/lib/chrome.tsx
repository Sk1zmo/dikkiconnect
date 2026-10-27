import { createContext, useContext, type ReactNode } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   Does this screen have a tab bar under it?

   One fact, and it exists to stop the safe-area inset being paid twice.

   `ActionBar` sticks to the bottom of a scroll and carries `pb-safe-4` —
   the home-indicator inset plus a rem of breathing room — because on a flow
   screen it IS the bottom of the phone. On a tabbed screen it is not: the tab
   bar is, and the tab bar already carries `pb-safe`. Both together leave
   about 34mm of dead white between the button and the tabs on any device with
   a home indicator, and nothing on a desktop or in the device-shell preview,
   which is exactly the kind of bug that ships.

   It is a context rather than a prop because the call site is the wrong place
   to know this. A screen does not choose whether it is tabbed — the route
   does, by which layout it sits in — so RoleLayout states it once and every
   ActionBar beneath it reads the answer. A flow screen provides nothing and
   gets the default, which is the inset.
   ═══════════════════════════════════════════════════════════════════════════ */

const TabBarContext = createContext(false)

/** Wraps the tabbed layouts. Everything inside knows a tab bar is below. */
export function TabBarProvider({ children }: { children: ReactNode }) {
  return <TabBarContext.Provider value={true}>{children}</TabBarContext.Provider>
}

/** True when a tab bar sits below this subtree and owns the bottom inset. */
export function useHasTabBar() {
  return useContext(TabBarContext)
}

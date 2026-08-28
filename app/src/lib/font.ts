/* ═══════════════════════════════════════════════════════════════════════════
   Typeface switch — demo only.

   The product ships in Inter. This exists so the same build can be shown, and
   screenshotted, in two near neighbours: one set of screens, three type
   systems, no chance of the three drifting apart between builds.

   `?font=geist` pins the face. It has to persist rather than ride the URL,
   because react-router drops the query string on the first in-app navigation
   and a URL-only switch would therefore survive exactly one screen.

   The default is Inter and stays Inter: an unrecognised value falls back
   rather than leaving the app in whatever the last visitor chose.
   ═══════════════════════════════════════════════════════════════════════════ */

export const FONTS = {
  inter: 'Inter',
  geist: 'Geist',
  jakarta: 'Plus Jakarta Sans',
} as const

export type FontKey = keyof typeof FONTS

const STORAGE_KEY = 'dikkiconnect.font'

const isFontKey = (v: string | null | undefined): v is FontKey => !!v && v in FONTS

/** localStorage throws outright in some privacy modes — never on the boot path. */
const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}
const write = (v: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, v)
  } catch {
    /* nothing to do: the attribute below still applies for this session */
  }
}

/**
 * Resolve the face and put it on <html>, where the CSS is waiting for it.
 * Called before render so the first paint is already in the right typeface —
 * a swap applied after mount is a visible reflow, and reflow is exactly what
 * a screenshot pass must not capture.
 */
export function applyFont(): FontKey {
  const requested = new URLSearchParams(window.location.search).get('font')
  if (isFontKey(requested)) write(requested)

  const stored = read()
  const key: FontKey = isFontKey(requested) ? requested : isFontKey(stored) ? stored : 'inter'

  document.documentElement.dataset.font = key
  return key
}

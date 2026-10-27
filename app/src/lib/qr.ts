import { BRAND } from './brand'

/* ═══════════════════════════════════════════════════════════════════════════
   Reading a scan.

   The pass a sender shows is `waypool://parcel/WYP-4796/dropoff`, so a scan
   produces that string and not a parcel id. Parsing it is the step that makes
   the scanner mean something: before this, both scan screens fired a callback
   with no argument and then opened a confirmation sheet about whichever parcel
   the app had already decided was next, so pointing the camera at the wrong
   box — or at nothing — produced a confident "Match".

   Anything that is not one of ours returns null, and the caller says so. A
   stranger's QR code is a normal thing to find on a parcel and must not be
   mistaken for a WayPool pass.
   ═══════════════════════════════════════════════════════════════════════════ */

/** `WYP-` then at least three digits, and nothing either side of it. The
    server mints nothing else, and anchoring the pattern is what stops this
    matching an id that merely appears somewhere inside another string. */
const PARCEL_ID = /^(WYP-\d{3,})$/i

/**
 * Pulls a parcel id out of whatever the camera read, or out of something a
 * person typed by hand. Accepts the deep link, a bare id, and an id with
 * surrounding whitespace or a lowercase prefix; rejects everything else.
 */
export function parcelIdFromScan(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null

  /* A link of ours is the expected case, and is checked first so a code that
     merely contains something id-shaped cannot pass as a pass. */
  const prefix = `${BRAND.scheme}://parcel/`
  if (text.toLowerCase().startsWith(prefix.toLowerCase())) {
    const [id] = text.slice(prefix.length).split('/')
    return PARCEL_ID.test(id) ? id.toUpperCase() : null
  }

  /* Otherwise the whole string has to be an id and nothing else. An earlier
     version searched the text for anything id-shaped, which meant
     `https://example.com/parcel/WYP-4861` read as a WayPool pass — a QR code
     anyone can print. What that bought was reading an id out of a sentence,
     which no scanner produces and nobody needs. */
  const m = PARCEL_ID.exec(text)
  return m ? m[1].toUpperCase() : null
}

/** The intent encoded in the pass — which hand-off the sender opened it for. */
export function scanIntent(raw: string): 'pickup' | 'dropoff' | null {
  const prefix = `${BRAND.scheme}://parcel/`
  if (!raw.trim().toLowerCase().startsWith(prefix.toLowerCase())) return null
  const tail = raw.trim().slice(prefix.length).split('/')[1]?.toLowerCase()
  return tail === 'pickup' || tail === 'dropoff' ? tail : null
}

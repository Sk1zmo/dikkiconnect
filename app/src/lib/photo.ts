/* ═══════════════════════════════════════════════════════════════════════════
   Taking a photograph, for real.

   The app has always claimed every hand-off is photographed. Until now the
   capture surface was a drawing of a cardboard box and a shutter button that
   counted to three — the camera was never opened and no image ever existed.
   The server refuses a custody step without a photo id, so this is the piece
   that makes the claim true rather than printed.

   ── Why a file input and not a plugin ────────────────────────────────────
   `<input type="file" accept="image/*" capture="environment">` opens the rear
   camera on Android and iOS, inside the Capacitor WebView and in a mobile
   browser, with no native plugin, no permission plumbing of our own and no
   extra bytes in the bundle. The OS camera app handles focus, exposure and
   the shutter better than anything we would write, and on a desktop it falls
   back to a file picker, which is the correct behaviour for someone testing
   from a laptop.

   ── Why it is downscaled here ────────────────────────────────────────────
   A modern phone shoots 4–12 MB. A hub manager photographs three angles per
   parcel on a hub's connection, and the point of the picture is to read a
   label and show the condition of a box — 1280px of JPEG does that at about
   a tenth the size. Doing it before the upload rather than after means the
   large version never crosses the network at all.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Long edge, in pixels. Enough to read a shipping label. */
const MAX_EDGE = 1280

/** JPEG quality. 0.72 is where box-texture artefacts stop being visible. */
const QUALITY = 0.72

export interface Shot {
  /** A JPEG data URL, downscaled, ready to upload. */
  dataUrl: string
  /** Approximate encoded size, for the ceiling the server enforces. */
  bytes: number
  width: number
  height: number
}

/**
 * Opens the camera (or the file picker) and resolves with one downscaled shot.
 * Resolves to `null` when the person backs out, which is not an error — a
 * cancelled camera is a cancelled camera, and every caller treats it as such.
 */
export function capturePhoto(): Promise<Shot | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    /* `environment` asks for the rear camera. Ignored on desktop, which is
       where the plain file picker is what you want anyway. */
    input.setAttribute('capture', 'environment')
    input.style.display = 'none'

    /* Cancelling a file dialog fires no event in most engines. `cancel` is
       supported in current Chrome and Safari; where it is not, the promise
       simply stays pending until the person tries again, which is harmless
       because nothing is awaiting it except a button's busy state. */
    input.addEventListener('cancel', () => {
      input.remove()
      resolve(null)
    })

    input.addEventListener('change', () => {
      const file = input.files?.[0]
      input.remove()
      if (!file) return resolve(null)
      downscale(file).then(resolve, reject)
    })

    document.body.append(input)
    input.click()
  })
}

/** Reads a file, fits it inside MAX_EDGE, re-encodes as JPEG. */
export async function downscale(file: Blob): Promise<Shot> {
  const bitmap = await decode(file)

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height)
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
  const bytes = Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4)
  return { dataUrl, bytes, width, height }
}

/**
 * `createImageBitmap` handles EXIF orientation and decodes off the main
 * thread; an `<img>` is the fallback for WebViews that lack it, which still
 * exist on older Android builds the pilot will meet.
 */
async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* Fall through — some WebViews advertise it and then refuse the
         orientation option, and a rotated photo beats no photo. */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('could not decode that image'))
      img.src = url
    })
  } finally {
    /* Revoking immediately is safe: decoding has finished by the time the
       promise settles, and leaving it would leak for the life of the page. */
    URL.revokeObjectURL(url)
  }
}

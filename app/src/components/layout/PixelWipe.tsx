import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════════════════════
   The pixel wipe — how one screen becomes the next.

   A grid of chunky squares floods the frame like water coming up a beach:
   each cell pops in on a wave that runs top to bottom with a sine ripple
   across it and a little grain per cell, holds while the screens swap
   underneath, and pops out again in the same order. Painted in the brand's
   own dusk and blues, so the dissolve is unmistakably Stowza and not a
   generic fade. Pure CSS per cell (transform + opacity, compositor only);
   312 cells is nothing.

   One host, at the top of the phone frame; anyone can ask for a wipe with
   `playPixelWipe()`. Route changes ask for one (RouteWipe); the opening asks
   for one when it lifts. The swap belongs at PIXEL_WIPE_MID_MS, when the
   frame is fully covered. Off under reduced motion — the screens crossfade.
   ═══════════════════════════════════════════════════════════════════════════ */

const COLS = 12
const ROWS = 26
/* Each cell: in for the first 25%, held to 70%, out by 100%. The wave's
   stagger (≤ ~115 ms) is shorter than the hold, so there is a window — from
   about 270 ms to 430 ms — in which every cell is solid. The swap goes in
   the middle of it. */
export const PIXEL_WIPE_MS = 620
export const PIXEL_WIPE_MID_MS = 340

const EVENT = 'stowza:wipe'
export function playPixelWipe() {
  window.dispatchEvent(new Event(EVENT))
}

const frac = (n: number) => {
  const v = Math.sin(n) * 43758.5453
  return v - Math.floor(v)
}
const PALETTE = ['#071231', '#0c2f92', '#1650e0', '#2a5cf0', '#0e339a', '#3a68f5']

/* The wave: down the frame, rippled across it, grained per cell. Computed once. */
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  const delay = (row / ROWS) * 75 + Math.sin(col * 0.8 + row * 0.35) * 12 + 12 + frac(i * 7.31) * 26
  return { delay: Math.max(0, Math.round(delay)), color: PALETTE[Math.floor(frac(i * 3.7) * PALETTE.length)] }
})

export function PixelWipeHost() {
  const reduced = useReducedMotion()
  const [run, setRun] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const on = () => {
      if (reduced) return
      setRun((r) => r + 1)
      setActive(true)
    }
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [reduced])

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setActive(false), PIXEL_WIPE_MS + 220)
    return () => clearTimeout(t)
  }, [active, run])

  if (!active) return null
  return (
    <div
      key={run}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-190 grid overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
    >
      {CELLS.map((c, i) => (
        <span
          key={i}
          className="anim-pixel block"
          style={{ background: c.color, animationDelay: `${c.delay}ms`, animationDuration: `${PIXEL_WIPE_MS}ms` }}
        />
      ))}
    </div>
  )
}

/** Asks for a wipe on every route change after the first. */
export function RouteWipe() {
  const { pathname } = useLocation()
  const [seen, setSeen] = useState<string | null>(null)
  useEffect(() => {
    if (seen !== null && seen !== pathname) playPixelWipe()
    setSeen(pathname)
  }, [pathname, seen])
  return null
}

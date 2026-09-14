/* ═══════════════════════════════════════════════════════════════════════════
   Regenerates every raster the brand mark appears in, from the one path in
   src/components/brand/Logo.tsx:

     public/icon.svg, icon-maskable.png, apple-touch-icon.png
     android mipmap-<density>/ic_launcher, ic_launcher_round, ic_launcher_foreground
     ios AppIcon.appiconset/AppIcon-512@2x.png

   Rasterised by a headless Chromium over the DevTools protocol (no image
   library in the tree, and Chromium draws SVG exactly as the app does). Point
   CHROME at a binary if the usual places do not have one:

     CHROME="C:/path/to/chrome.exe" node scripts/brand-icons.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

/* Kept in step with Logo.tsx by hand — the two files are the whole brand. */
const MARK_PATH = 'M36 9.5H14.5a5.75 5.75 0 0 0 0 11.5h17a5.75 5.75 0 0 1 0 11.5H9'
const DOT = { cx: 39.5, cy: 38.5, r: 4.25 }

const TILE = ['#1d5cf2', '#0e3aa8'] // brand-600-ish → brand-800: the launcher field
const DOT_ON_TILE = '#96b8ff'

/** The mark alone, white, on nothing. `box` is the size of the SVG canvas. */
const markSvg = (box, markSize, dot = DOT_ON_TILE) => {
  const s = markSize / 48
  const off = (box - markSize) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
    <g transform="translate(${off} ${off}) scale(${s})">
      <path d="${MARK_PATH}" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${dot}"/>
    </g></svg>`
}

/** The mark on the brand tile. `radius` in px; 0 for a full-bleed square. */
const tileSvg = (box, radius, markScale = 0.6, shape = 'rect') => {
  const markSize = box * markScale
  const off = (box - markSize) / 2
  const s = markSize / 48
  const field =
    shape === 'circle'
      ? `<circle cx="${box / 2}" cy="${box / 2}" r="${box / 2}" fill="url(#t)"/>`
      : `<rect width="${box}" height="${box}" rx="${radius}" fill="url(#t)"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
    <defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${TILE[0]}"/><stop offset="1" stop-color="${TILE[1]}"/></linearGradient></defs>
    ${field}
    <g transform="translate(${off} ${off}) scale(${s})">
      <path d="${MARK_PATH}" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${DOT_ON_TILE}"/>
    </g></svg>`
}

const RES = `${ROOT}/android/app/src/main/res`
const DENSITY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }

const jobs = [
  { out: 'public/icon-maskable.png', svg: tileSvg(512, 0, 0.52) }, // maskable: keep the mark inside the 80% safe zone
  { out: 'public/apple-touch-icon.png', svg: tileSvg(512, 0, 0.6) },
  { out: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', svg: tileSvg(1024, 0, 0.6) },
]
for (const [d, px] of Object.entries(DENSITY)) {
  jobs.push({ out: `android/app/src/main/res/mipmap-${d}/ic_launcher.png`, svg: tileSvg(px, px * 0.2, 0.6) })
  jobs.push({ out: `android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, svg: tileSvg(px, 0, 0.6, 'circle') })
  // Adaptive foreground: 108dp canvas, the visible disc is the middle 66dp —
  // the mark takes 44% of the canvas so it sits well inside that.
  jobs.push({ out: `android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, svg: markSvg(px * 2.25, px * 2.25 * 0.44), transparent: true })
}

/* The vector sources need no browser. */
writeFileSync(`${ROOT}/public/icon.svg`, tileSvg(512, 112, 0.6).replace('width="512" height="512"', 'width="512" height="512"') + '\n')
writeFileSync(
  `${RES}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${TILE[0]}</color>\n</resources>\n`,
)

/* ── Rasterise ─────────────────────────────────────────────────────────── */
const candidates = [
  process.env.CHROME,
  `${homedir()}/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const CHROME = candidates.find((p) => existsSync(p))
if (!CHROME) {
  console.error('brand-icons: no Chromium found — set CHROME=<path to chrome.exe>')
  process.exit(1)
}

const port = 9400 + Math.floor(Math.random() * 400)
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TMP ?? '/tmp'}/brand-icons-${port}`, 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target
for (let i = 0; i < 50 && !target; i++) {
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page')
  } catch {}
  if (!target) await sleep(200)
}
if (!target) { chrome.kill(); throw new Error('brand-icons: Chromium did not come up') }

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })

await send('Page.enable')
for (const job of jobs) {
  const size = Number(job.svg.match(/width="(\d+)"/)[1])
  await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
  const html = `<!doctype html><html><body style="margin:0;background:transparent">${job.svg}</body></html>`
  await send('Page.navigate', { url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}` })
  await sleep(120)
  const { result } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } })
  const out = `${ROOT}/${job.out}`
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, Buffer.from(result.data, 'base64'))
  console.log(`${job.out}  ${size}px`)
}
ws.close()
chrome.kill()

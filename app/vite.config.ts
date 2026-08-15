import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'
import fs from 'node:fs'

/**
 * The single-file build runs from file://, where the manifest, touch icon and
 * service worker have nothing to resolve against. Drop those tags so the page
 * stays genuinely self-contained and logs no failed requests.
 */
function stripPwaTags() {
  return {
    name: 'strip-pwa-tags',
    transformIndexHtml(html: string) {
      return html
        .replace(/\s*<link rel="manifest"[^>]*>/g, '')
        .replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, '')
        .replace(/\s*<script>[\s\S]*?serviceWorker[\s\S]*?<\/script>/g, '')
    },
  }
}

/**
 * MapLibre's tile-parsing worker, made deployable.
 *
 * Two things are wrong out of the box with a bundler:
 *
 *  1. MapLibre resolves the worker as a *sibling file* of whatever module it
 *     is running from — `new URL('./maplibre-gl-worker.mjs', import.meta.url)`.
 *     Vite bundles MapLibre into a hashed chunk and never emits that sibling,
 *     so the Worker constructor 404s.
 *
 *  2. The shipped worker is an ES module that imports a 480 KB shared chunk.
 *     MapLibre decides at runtime whether to construct a module worker or a
 *     classic one, and when it picks classic the bare `import` inside is an
 *     immediate syntax error.
 *
 * Neither failure throws anything you can see. The map loads its style,
 * sprites and TileJSON, draws our own route layers and markers perfectly, and
 * then requests zero tiles — a blank canvas with pins floating on it.
 *
 * So: pre-bundle the worker into one self-contained IIFE with no imports at
 * all, which runs correctly as either worker type, and emit it at a fixed path
 * that `setWorkerUrl` can point at. Works for the web build and for the APK,
 * which serves the same files off disk.
 */
function maplibreWorker() {
  const entry = path.resolve(
    process.cwd(),
    'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs',
  )
  return {
    name: 'maplibre-worker-asset',
    async generateBundle(this: { emitFile: (f: unknown) => void }) {
      const { build } = await import('esbuild')
      const out = await build({
        entryPoints: [entry],
        bundle: true,
        format: 'iife',
        platform: 'browser',
        target: 'es2020',
        minify: true,
        write: false,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'maplibre-gl-worker.js',
        source: out.outputFiles[0].text,
      })
    },
    configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
      let cached: string | null = null
      server.middlewares.use(async (req: { url?: string }, res: any, next: () => void) => {
        if (req.url !== '/maplibre-gl-worker.js') return next()
        if (!cached) {
          const { build } = await import('esbuild')
          const out = await build({
            entryPoints: [entry],
            bundle: true,
            format: 'iife',
            platform: 'browser',
            target: 'es2020',
            write: false,
          })
          cached = out.outputFiles[0].text
        }
        res.setHeader('Content-Type', 'text/javascript')
        res.end(cached)
      })
    },
  }
}

/**
 * Two build targets:
 *   npm run build         → dist/        static site for a host (clean URLs)
 *   npm run build:single  → dist-single/ one self-contained .html (hash URLs)
 */
export default defineConfig(({ mode }) => {
  const single = mode === 'single'

  return {
    // The single-file build is opened off disk, so its base must be relative.
    // The hosted build must NOT be relative: with a history router, a nested
    // URL like /sender/track/DKC-4821 would resolve "./assets/…" against
    // /sender/track/ and get the SPA fallback HTML instead of the JS bundle.
    // Set VITE_BASE=/subfolder/ when deploying somewhere other than the root.
    base: single ? './' : (process.env.VITE_BASE ?? '/'),
    plugins: [
      react(),
      tailwindcss(),
      // Not in the single-file build: that one has no sibling files at all.
      ...(single ? [] : [maplibreWorker()]),
      ...(single ? [stripPwaTags(), viteSingleFile()] : []),
    ],
    resolve: {
      alias: { '@': path.resolve(process.cwd(), 'src') },
    },
    server: { port: 5173 },
    build: {
      outDir: single ? 'dist-single' : 'dist',
      // The single-file build must not code-split — everything is inlined.
      ...(single ? { assetsInlineLimit: 100_000_000, cssCodeSplit: false } : {}),
    },
  }
})

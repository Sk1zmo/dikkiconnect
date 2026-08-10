import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

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

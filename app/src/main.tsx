import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import App from './App'
import { applyFont } from './lib/font'
import './index.css'

/* Before render, not after: a typeface applied on mount is a visible reflow,
   and a screenshot pass must not catch the app mid-swap. */
applyFont()

/**
 * Clean URLs when the app is served by a web server; hash URLs for the
 * single-file build, which is opened straight off disk (file://) where a
 * history-API router has no server to fall back to.
 */
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

/* One icon family, one weight, everywhere: Phosphor at `bold` sits between
   the two strokes this UI was drawn with and holds up at 14px in a tab bar.
   A component that wants `fill` or `duotone` says so on the icon. */
const ICONS = { weight: 'bold', mirrored: false } as const

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconContext.Provider value={ICONS}>
      <Router>
        <App />
      </Router>
    </IconContext.Provider>
  </StrictMode>,
)

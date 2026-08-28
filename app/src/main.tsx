import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/ui/Empty'
import { RouteSettled } from '@/lib/boot'

/* ═══════════════════════════════════════════════════════════════════════════
   The net under every screen.

   React unmounts the whole tree on an uncaught render error — a blank white
   page, no explanation, no way back, and the bottom tab bar gone with it.
   This catches it one screen at a time: the route that broke shows a plain
   "something went wrong" with a retry, and the rest of the app stays up.

   Two failures get their own words:

     · A chunk that will not load ("Failed to fetch dynamically imported
       module") almost always means the app was redeployed while this tab
       was open and the old index is asking for files that no longer exist.
       The fix is a reload, so that is the button, and the copy says why.
     · Anything else is ours. "Try again" re-mounts the screen; "Go home"
       leaves it.

   `resetKey` — the pathname, in practice — clears the error when the route
   changes, so a broken screen does not follow you to the next one.
   ═══════════════════════════════════════════════════════════════════════════ */

const CHUNK_RE = /dynamically imported module|Loading chunk|import\(\)|Importing a module script failed/i

type Props = { children: ReactNode; resetKey?: string; onHome?: () => void }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[screen crashed]', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const stale = CHUNK_RE.test(error.message)
    return (
      <div className="device-scroll flex flex-1 flex-col">
        {/* The app is here, even if the screen is not: let the opening lift. */}
        <RouteSettled />
        {stale ? (
          <ErrorState kind="chunk" onAction={() => window.location.reload()} detail={error.message} />
        ) : (
          <ErrorState
            kind="crash"
            onAction={() => this.setState({ error: null })}
            onSecondary={this.props.onHome}
            detail={`${error.name}: ${error.message}`}
          />
        )}
      </div>
    )
  }
}

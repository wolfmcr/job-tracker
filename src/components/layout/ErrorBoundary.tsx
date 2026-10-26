import { AlertTriangleIcon } from 'lucide-react'
import { Component, type ReactNode } from 'react'

// Shown instead of a blank screen when something crashes while rendering
export function ErrorFallback() {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 min-h-dvh px-8 text-center">
      <AlertTriangleIcon size={40} className="text-gray-400" />
      <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
      <p className="text-sm text-gray-500">Reloading usually fixes it. Nothing you saved has been lost.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold active:opacity-80"
      >
        Reload
      </button>
    </div>
  )
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[app] crashed while rendering', error)
  }

  render() {
    return this.state.failed ? <ErrorFallback /> : this.props.children
  }
}

import { XIcon } from 'lucide-react'
import { dismissToast, useToasts } from '../../lib/toast'

export function Toaster() {
  const toasts = useToasts()
  if (toasts.length === 0) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 z-90 flex flex-col items-center gap-2 px-4 pointer-events-none"
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm shadow-lg"
        >
          <p className="flex-1">{toast.message}</p>
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss" className="-m-1 p-1 text-gray-400">
            <XIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

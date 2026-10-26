import { WifiOffIcon } from 'lucide-react'
import { useOnline } from '../../hooks/useOnline'

// The app is online-only: while offline, cover everything so nothing can be edited
export function OfflineOverlay() {
  const online = useOnline()
  if (online) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-3 px-8 bg-white/95 text-center"
    >
      <WifiOffIcon size={40} className="text-gray-400" />
      <h2 id="offline-title" className="text-lg font-semibold text-gray-900">No connection</h2>
      <p className="text-sm text-gray-500">Job Tracker needs the internet. It’ll come back as soon as you’re online.</p>
    </div>
  )
}

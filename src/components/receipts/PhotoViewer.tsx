import { XIcon } from 'lucide-react'

interface Props {
  src: string
  onClose: () => void
}

// Full-screen receipt photo; pinch to zoom is the browser's own
export function PhotoViewer({ src, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-60 bg-black flex flex-col" role="dialog" aria-label="Receipt photo">
      <button type="button" onClick={onClose} aria-label="Close photo" className="self-end text-white p-4" style={{ marginTop: 'env(safe-area-inset-top)' }}>
        <XIcon size={24} />
      </button>
      <div className="flex-1 overflow-auto flex items-start justify-center">
        <img src={src} alt="Receipt" className="max-w-full" />
      </div>
    </div>
  )
}

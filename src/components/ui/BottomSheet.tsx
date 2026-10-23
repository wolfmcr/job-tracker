import { XIcon } from 'lucide-react'
import { useVisualViewport } from '../../hooks/useVisualViewport'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: Props) {
  const { keyboardInset, height } = useVisualViewport()
  if (!open) return null

  const keyboardOpen = keyboardInset > 0

  // Brings the field being typed in into view once the keyboard has finished opening
  function handleFocus(e: React.FocusEvent<HTMLDivElement>) {
    const field = e.target
    if (!field.matches('input, textarea, select')) return
    setTimeout(() => field.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      {/* Rests on the keyboard while it's open and scrolls inside when the form is taller than the space left */}
      <div
        onFocus={handleFocus}
        className="fixed left-0 right-0 overflow-y-auto overscroll-contain bg-white rounded-t-2xl z-50 p-6 shadow-xl animate-slide-up"
        style={{
          bottom: keyboardInset,
          maxHeight: keyboardOpen ? height - 16 : '90dvh',
          paddingBottom: keyboardOpen ? '1rem' : 'calc(1.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 p-1 -mr-1">
            <XIcon size={20} />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}

import { XIcon } from 'lucide-react'
import { useVisualViewport } from '../../hooks/useVisualViewport'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  // Pinned under the content, outside the scrolling part (e.g. an action bar)
  footer?: React.ReactNode
}

// Every list row holds a closed sheet, so the viewport is only watched while one is open
export function BottomSheet({ open, ...props }: Props) {
  return open ? <OpenSheet {...props} /> : null
}

function OpenSheet({ onClose, title, children, footer }: Omit<Props, 'open'>) {
  const { keyboardOpen, keyboardInset, height } = useVisualViewport()

  // Brings the field being typed in into view once the keyboard has finished opening
  function handleFocus(e: React.FocusEvent<HTMLDivElement>) {
    const field = e.target
    if (!field.matches('input, textarea, select')) return
    setTimeout(() => field.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300)
  }

  const bottomPadding = keyboardOpen ? '1rem' : 'calc(1.5rem + env(safe-area-inset-bottom))'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      {/* Rests on the keyboard while it's open and scrolls inside when the form is taller than the space left */}
      <div
        onFocus={handleFocus}
        className="fixed left-0 right-0 flex flex-col bg-white rounded-t-2xl z-50 shadow-xl animate-slide-up"
        style={{
          bottom: keyboardInset,
          maxHeight: keyboardOpen ? height - 16 : '90dvh',
        }}
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain p-6" style={{ paddingBottom: footer ? '1.5rem' : bottomPadding }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 p-1 -mr-1">
              <XIcon size={20} />
            </button>
          </div>
          {children}
        </div>
        {footer && (
          <div className="shrink-0 px-6 pt-3 border-t border-gray-200 bg-white" style={{ paddingBottom: bottomPadding }}>
            {footer}
          </div>
        )}
      </div>
    </>
  )
}

import { PlusIcon } from 'lucide-react'

interface Props {
  onClick: () => void
  color?: string
  label?: string
}

export function FAB({ onClick, color = '#111827', label = 'Add' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-5 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:opacity-80 z-30"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 1rem)', backgroundColor: color }}
      aria-label={label}
    >
      <PlusIcon size={24} />
    </button>
  )
}

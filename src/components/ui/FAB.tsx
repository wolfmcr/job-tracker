import { PlusIcon } from 'lucide-react'

interface Props {
  onClick: () => void
}

export function FAB({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-5 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:bg-blue-700 z-30"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 1rem)' }}
      aria-label="Add job"
    >
      <PlusIcon size={24} />
    </button>
  )
}

import { PlusIcon } from 'lucide-react'

interface Props {
  label: string
  onClick: () => void
}

export function AddButton({ label, onClick }: Props) {
  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white text-base font-semibold active:opacity-80 w-full justify-center"
      >
        <PlusIcon size={18} />
        {label}
      </button>
    </div>
  )
}

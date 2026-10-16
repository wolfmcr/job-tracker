import { XIcon } from 'lucide-react'
import type { TodoItem } from '../../types'

interface Props {
  item: TodoItem
  onToggle: () => void
  onDelete: () => void
}

export function TodoItemRow({ item, onToggle, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <input
        type="checkbox"
        checked={item.isDone}
        onChange={onToggle}
        className="w-5 h-5 accent-blue-600 shrink-0"
      />
      <span className={`flex-1 text-sm ${item.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {item.text}
      </span>
      <button type="button" onClick={onDelete} className="text-gray-300 active:text-red-500 p-1 -mr-1">
        <XIcon size={16} />
      </button>
    </div>
  )
}

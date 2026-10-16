import { XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import type { TodoItem } from '../../types'

interface Props {
  item: TodoItem
  onToggle: () => void
  onDelete: () => void
  onUpdate: (text: string) => void
  readOnly?: boolean
}

export function TodoItemRow({ item, onToggle, onDelete, onUpdate, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(item.text)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    if (readOnly) return
    setText(item.text)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function save() {
    const trimmed = text.trim()
    if (trimmed && trimmed !== item.text) onUpdate(trimmed)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <input
        type="checkbox"
        checked={item.isDone}
        onChange={onToggle}
        disabled={readOnly}
        className="w-5 h-5 accent-blue-600 shrink-0"
      />
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-400 rounded-lg text-sm focus:outline-none"
        />
      ) : (
        <span
          className={`flex-1 text-sm ${item.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}
          onClick={startEdit}
        >
          {item.text}
        </span>
      )}
      {!readOnly && !editing && (
        <button type="button" onClick={onDelete} className="text-gray-300 active:text-red-500 p-1 -mr-1">
          <XIcon size={16} />
        </button>
      )}
    </div>
  )
}

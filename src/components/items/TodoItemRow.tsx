import { FlagIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import type { TodoItem } from '../../types'

interface Props {
  item: TodoItem
  onToggle: () => void
  onDelete: () => void
  onUpdate: (text: string) => void
  onSetPriority?: (priority: number) => void
  jobColor?: string
  readOnly?: boolean
}

function nextPriority(p: number) {
  if (p === 0) return 2
  if (p === 2) return 1
  return 0
}

function flagStyle(p: number): { color: string; fill: string } {
  if (p === 2) return { color: '#ef4444', fill: '#ef4444' }
  if (p === 1) return { color: '#f59e0b', fill: '#f59e0b' }
  return { color: '#d1d5db', fill: 'none' }
}

export function TodoItemRow({ item, onToggle, onDelete, onUpdate, onSetPriority, jobColor, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(item.text)
  const inputRef = useRef<HTMLInputElement>(null)
  const priority = item.priority ?? 0

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

  const { color: flagColor, fill: flagFill } = flagStyle(priority)

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      {jobColor && (
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: jobColor }} />
      )}
      <input
        type="checkbox"
        checked={item.isDone}
        onChange={onToggle}
        disabled={readOnly}
        className="w-5 h-5 shrink-0"
        style={{ accentColor: jobColor ?? '#2563eb' }}
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
      {!readOnly && !editing && onSetPriority && (
        <button
          type="button"
          onClick={() => onSetPriority(nextPriority(priority))}
          className="p-1 shrink-0 active:opacity-60"
        >
          <FlagIcon size={15} style={{ color: flagColor, fill: flagFill }} />
        </button>
      )}
      {!readOnly && !editing && (
        <button type="button" onClick={onDelete} className="text-gray-300 active:text-red-500 p-1 -mr-1 shrink-0">
          <XIcon size={16} />
        </button>
      )}
    </div>
  )
}

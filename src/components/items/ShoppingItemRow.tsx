import { FlagIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ShoppingItem } from '../../types'

interface Props {
  item: ShoppingItem
  onToggle: () => void
  onDelete: () => void
  onUpdate: (qty: string, name: string) => void
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

export function ShoppingItemRow({ item, onToggle, onDelete, onUpdate, onSetPriority, jobColor, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(item.qty)
  const [name, setName] = useState(item.name)
  const nameRef = useRef<HTMLInputElement>(null)
  const priority = item.priority ?? 0

  function startEdit() {
    if (readOnly) return
    setQty(item.qty)
    setName(item.name)
    setEditing(true)
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  function save() {
    const trimmedName = name.trim()
    if (trimmedName && (trimmedName !== item.name || qty.trim() !== item.qty)) {
      onUpdate(qty.trim(), trimmedName)
    }
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
        checked={item.isGot}
        onChange={onToggle}
        disabled={readOnly}
        className="w-5 h-5 shrink-0"
        style={{ accentColor: jobColor ?? '#2563eb' }}
      />
      {editing ? (
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={qty}
            onChange={e => setQty(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            placeholder="Qty"
            className="w-16 px-2 py-1 border border-blue-400 rounded-lg text-sm focus:outline-none"
          />
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 border border-blue-400 rounded-lg text-sm focus:outline-none"
          />
        </div>
      ) : (
        <span
          className={`flex-1 text-sm ${item.isGot ? 'line-through text-gray-400' : 'text-gray-800'}`}
          onClick={startEdit}
        >
          {item.qty ? <span className="font-medium text-gray-500 mr-1">{item.qty}</span> : null}
          {item.name}
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

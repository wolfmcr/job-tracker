import { XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ShoppingItem } from '../../types'

interface Props {
  item: ShoppingItem
  onToggle: () => void
  onDelete: () => void
  onUpdate: (qty: string, name: string) => void
  readOnly?: boolean
}

export function ShoppingItemRow({ item, onToggle, onDelete, onUpdate, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(item.qty)
  const [name, setName] = useState(item.name)
  const nameRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <input
        type="checkbox"
        checked={item.isGot}
        onChange={onToggle}
        disabled={readOnly}
        className="w-5 h-5 accent-blue-600 shrink-0"
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
      {!readOnly && !editing && (
        <button type="button" onClick={onDelete} className="text-gray-300 active:text-red-500 p-1 -mr-1">
          <XIcon size={16} />
        </button>
      )}
    </div>
  )
}

import { PlusIcon } from 'lucide-react'
import { useRef, useState } from 'react'

interface Props {
  onAdd: (text: string, qty?: string) => Promise<void>
  hasQty?: boolean
  placeholder?: string
}

export function InlineAddRow({ onAdd, hasQty = false, placeholder = 'Add item…' }: Props) {
  const [text, setText] = useState('')
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)
  const textRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    await onAdd(text.trim(), qty.trim() || undefined)
    setText('')
    setQty('')
    setSaving(false)
    textRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2 border-t border-gray-100">
      {hasQty && (
        <input
          type="text"
          placeholder="Qty"
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
      <input
        ref={textRef}
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={e => setText(e.target.value)}
        className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={saving || !text.trim()}
        className="text-blue-600 disabled:opacity-30"
        aria-label="Add"
      >
        <PlusIcon size={20} />
      </button>
    </form>
  )
}

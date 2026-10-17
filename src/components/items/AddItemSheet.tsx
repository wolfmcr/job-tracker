import { XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (text: string, qty?: string) => Promise<void>
  title: string
  hasQty?: boolean
  placeholder?: string
  color?: string
}

export function AddItemSheet({ open, onClose, onAdd, title, hasQty = false, placeholder = 'Item…', color = '#2563eb' }: Props) {
  const [text, setText] = useState('')
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)
  const textRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setQty('')
      setTimeout(() => textRef.current?.focus(), 80)
    }
  }, [open])

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

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 shadow-xl animate-slide-up"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 p-1 -mr-1">
            <XIcon size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {hasQty && (
            <input
              type="text"
              placeholder="Quantity (e.g. 3x, 1 bag)"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            ref={textRef}
            type="text"
            placeholder={placeholder}
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="w-full py-3 text-white font-semibold rounded-xl text-base disabled:opacity-50 active:opacity-80"
            style={{ backgroundColor: color }}
          >
            {saving ? 'Adding…' : 'Add'}
          </button>
        </form>
      </div>
    </>
  )
}

import { XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ShoppingItem } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  item: ShoppingItem
  onUpdate: (qty: string, name: string) => void
  onDelete: () => void
}

export function EditShoppingItemSheet({ open, onClose, item, onUpdate, onDelete }: Props) {
  const [qty, setQty] = useState(item.qty)
  const [name, setName] = useState(item.name)

  useEffect(() => {
    if (open) {
      setQty(item.qty)
      setName(item.name)
    }
  }, [open, item])

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    onUpdate(qty.trim(), name.trim())
    onClose()
  }

  function handleDelete() {
    onDelete()
    onClose()
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
          <h2 className="text-lg font-semibold text-gray-900">Edit Item</h2>
          <button type="button" onClick={onClose} className="text-gray-400 p-1 -mr-1">
            <XIcon size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Quantity (e.g. 3x, 1 bag)"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Item name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl text-base disabled:opacity-50 active:opacity-80"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-3 text-red-500 font-semibold rounded-xl text-base border border-red-100 active:bg-red-50"
          >
            Delete
          </button>
        </form>
      </div>
    </>
  )
}

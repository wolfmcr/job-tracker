import { useEffect, useState } from 'react'
import type { ShoppingItem } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { DeleteButton } from '../ui/DeleteButton'
import { Field } from '../ui/Field'
import { SubmitButton } from '../ui/SubmitButton'

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

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Item">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Field label="Quantity">
          <input
            type="text"
            placeholder="e.g. 3x, 1 bag"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <Field label="Item" required>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </Field>
        <SubmitButton label="Save" disabled={!name.trim()} />
        <DeleteButton onDelete={handleDelete} />
      </form>
    </BottomSheet>
  )
}

import { useEffect, useState } from 'react'
import type { TodoItem } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { DeleteButton } from '../ui/DeleteButton'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  open: boolean
  onClose: () => void
  item: TodoItem
  onUpdate: (text: string) => void
  onDelete: () => void
}

export function EditTodoItemSheet({ open, onClose, item, onUpdate, onDelete }: Props) {
  const [text, setText] = useState(item.text)

  useEffect(() => {
    if (open) setText(item.text)
  }, [open, item])

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim()) return
    onUpdate(text.trim())
    onClose()
  }

  function handleDelete() {
    onDelete()
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Task">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Task"
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <SubmitButton label="Save" disabled={!text.trim()} />
        <DeleteButton onDelete={handleDelete} />
      </form>
    </BottomSheet>
  )
}

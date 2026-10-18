import { XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { TodoItem } from '../../types'

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

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 shadow-xl animate-slide-up"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>
          <button type="button" onClick={onClose} className="text-gray-400 p-1 -mr-1">
            <XIcon size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Task"
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={!text.trim()}
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

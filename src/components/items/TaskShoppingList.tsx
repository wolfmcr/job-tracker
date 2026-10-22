import { XIcon } from 'lucide-react'
import { useState } from 'react'
import { createdMillis } from '../../lib/sortItems'
import { addShoppingItem, deleteShoppingItem, toggleShoppingItem } from '../../services/jobService'
import type { ShoppingItem, Task } from '../../types'
import { Field, FieldLabel } from '../ui/Field'

interface Props {
  task: Task
  items: ShoppingItem[]
  jobColor?: string
  readOnly?: boolean
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

// The task's own shopping list, shown in the task sheet. Items are regular job shopping items tagged with taskId,
// so they also show on the Shopping tab.
export function TaskShoppingList({ task, items, jobColor, readOnly = false }: Props) {
  const [qty, setQty] = useState('')
  const [name, setName] = useState('')

  const sorted = [...items].sort((a, b) => Number(a.isGot) - Number(b.isGot) || createdMillis(a) - createdMillis(b))

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    const [q, n] = [qty.trim(), name.trim()]
    setQty('')
    setName('')
    await addShoppingItem(task.jobId, q, n, task.id)
  }

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>Shopping</FieldLabel>
      {sorted.length > 0 ? (
        <ul className="flex flex-col">
          {sorted.map(item => (
            <li key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
              <input
                type="checkbox"
                checked={item.isGot}
                aria-label={`Got: ${item.name}`}
                onChange={() => toggleShoppingItem(task.jobId, item.id, !item.isGot)}
                disabled={readOnly}
                className="w-5 h-5 shrink-0"
                style={{ accentColor: jobColor ?? '#2563eb' }}
              />
              <span className={`flex-1 min-w-0 text-base wrap-break-word ${item.isGot ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {item.qty && <span className="font-medium text-gray-500 mr-1">{item.qty}</span>}
                {item.name}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => deleteShoppingItem(task.jobId, item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="p-1.5 -mr-1.5 shrink-0 text-gray-400 active:opacity-60"
                >
                  <XIcon size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-gray-400">Nothing to buy</p>
      )}
      {!readOnly && (
        <form onSubmit={handleAdd} className="flex items-end gap-2">
          <Field label="Qty" className="w-20 shrink-0">
            <input type="text" value={qty} onChange={e => setQty(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Item" className="flex-1 min-w-0">
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
          </Field>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2.5 rounded-xl text-base font-semibold text-white shrink-0 disabled:opacity-50 active:opacity-80"
            style={{ backgroundColor: jobColor ?? '#111827' }}
          >
            Add
          </button>
        </form>
      )}
    </div>
  )
}

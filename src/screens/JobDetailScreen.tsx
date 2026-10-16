import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeftIcon, MapPinIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { EditJobSheet } from '../components/jobs/EditJobSheet'
import { InlineAddRow } from '../components/items/InlineAddRow'
import { ShoppingItemRow } from '../components/items/ShoppingItemRow'
import { TodoItemRow } from '../components/items/TodoItemRow'
import { useJob } from '../hooks/useJob'
import { useShoppingItems, useTodoItems } from '../hooks/useJobItems'
import {
  addShoppingItem,
  addTodoItem,
  archiveJob,
  completeJob,
  deleteShoppingItem,
  deleteTodoItem,
  restoreJob,
  toggleShoppingItem,
  toggleTodoItem,
  updateShoppingItem,
  updateTodoItem,
} from '../services/jobService'

export function JobDetailScreen() {
  const { jobId } = useParams({ from: '/layout/jobs/$jobId' })
  const navigate = useNavigate()
  const job = useJob(jobId)
  const [editOpen, setEditOpen] = useState(false)

  const { items: shoppingItems } = useShoppingItems(jobId)
  const { items: todoItems } = useTodoItems(jobId)

  if (!job) return null

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(job.address)}`
  const readOnly = job.isArchived

  const sortedShopping = [...shoppingItems].sort((a, b) => Number(a.isGot) - Number(b.isGot))
  const sortedTodos = [...todoItems].sort((a, b) => Number(a.isDone) - Number(b.isDone))

  const backRoute = readOnly ? '/archive' : '/jobs'

  async function handleComplete() {
    if (!window.confirm(`Mark "${job!.name}" as complete and archive it?`)) return
    await completeJob(jobId)
    navigate({ to: '/jobs' })
  }

  async function handleArchive() {
    if (!window.confirm(`Archive "${job!.name}"?`)) return
    await archiveJob(jobId)
    navigate({ to: '/jobs' })
  }

  async function handleRestore() {
    await restoreJob(jobId)
    navigate({ to: '/jobs' })
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button type="button" onClick={() => navigate({ to: backRoute })} className="text-gray-400 -ml-1 p-1">
          <ArrowLeftIcon size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{job.name}</h1>
          {job.address && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-500">
              <MapPinIcon size={12} />
              <span className="truncate">{job.address}</span>
            </a>
          )}
        </div>
        {readOnly ? (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Archived</span>
        ) : (
          <button type="button" onClick={() => setEditOpen(true)} className="text-gray-400 p-1 -mr-1">
            <PencilIcon size={18} />
          </button>
        )}
      </div>

      {/* Shopping list */}
      <div className="mt-2">
        <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Shopping</p>
        {sortedShopping.map(item => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggle={readOnly ? () => {} : () => toggleShoppingItem(jobId, item.id, !item.isGot)}
            onDelete={readOnly ? () => {} : () => deleteShoppingItem(jobId, item.id)}
            onUpdate={(qty, name) => updateShoppingItem(jobId, item.id, qty, name)}
            readOnly={readOnly}
          />
        ))}
        {!readOnly && (
          <InlineAddRow
            hasQty
            placeholder="Item name…"
            onAdd={(name, qty) => addShoppingItem(jobId, qty ?? '', name)}
          />
        )}
      </div>

      {/* To-do list */}
      <div className="mt-4">
        <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">To-Do</p>
        {sortedTodos.map(item => (
          <TodoItemRow
            key={item.id}
            item={item}
            onToggle={readOnly ? () => {} : () => toggleTodoItem(jobId, item.id, !item.isDone)}
            onDelete={readOnly ? () => {} : () => deleteTodoItem(jobId, item.id)}
            onUpdate={(text) => updateTodoItem(jobId, item.id, text)}
            readOnly={readOnly}
          />
        ))}
        {!readOnly && (
          <InlineAddRow
            placeholder="Task…"
            onAdd={(text) => addTodoItem(jobId, text)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 px-4 flex flex-col gap-3">
        {readOnly ? (
          <button
            type="button"
            onClick={handleRestore}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500"
          >
            Restore job
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleComplete}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl text-sm active:bg-green-700"
            >
              Complete job
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-400"
            >
              Archive without completing
            </button>
          </>
        )}
      </div>
      {!readOnly && (
        <EditJobSheet job={job} open={editOpen} onClose={() => setEditOpen(false)} />
      )}
    </div>
  )
}

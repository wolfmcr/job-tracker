import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeftIcon, MapPinIcon } from 'lucide-react'
import { InlineAddRow } from '../components/items/InlineAddRow'
import { ShoppingItemRow } from '../components/items/ShoppingItemRow'
import { TodoItemRow } from '../components/items/TodoItemRow'
import { useShoppingItems, useTodoItems } from '../hooks/useJobItems'
import { useJobs } from '../hooks/useJobs'
import {
  addShoppingItem,
  addTodoItem,
  archiveJob,
  deleteShoppingItem,
  deleteTodoItem,
  toggleShoppingItem,
  toggleTodoItem,
} from '../services/jobService'

export function JobDetailScreen() {
  const { jobId } = useParams({ from: '/layout/jobs/$jobId' })
  const navigate = useNavigate()
  const { jobs } = useJobs()
  const job = jobs.find(j => j.id === jobId)

  const { items: shoppingItems } = useShoppingItems(jobId)
  const { items: todoItems } = useTodoItems(jobId)

  if (!job) return null

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(job.address)}`

  async function handleArchive() {
    if (!window.confirm(`Archive "${job!.name}"?`)) return
    await archiveJob(jobId)
    navigate({ to: '/jobs' })
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button type="button" onClick={() => navigate({ to: '/jobs' })} className="text-gray-400 -ml-1 p-1">
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
      </div>

      {/* Shopping list */}
      <div className="mt-2">
        <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Shopping</p>
        {shoppingItems.map(item => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggle={() => toggleShoppingItem(jobId, item.id, !item.isGot)}
            onDelete={() => deleteShoppingItem(jobId, item.id)}
          />
        ))}
        <InlineAddRow
          hasQty
          placeholder="Item name…"
          onAdd={(name, qty) => addShoppingItem(jobId, qty ?? '', name)}
        />
      </div>

      {/* To-do list */}
      <div className="mt-4">
        <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">To-Do</p>
        {todoItems.map(item => (
          <TodoItemRow
            key={item.id}
            item={item}
            onToggle={() => toggleTodoItem(jobId, item.id, !item.isDone)}
            onDelete={() => deleteTodoItem(jobId, item.id)}
          />
        ))}
        <InlineAddRow
          placeholder="Task…"
          onAdd={(text) => addTodoItem(jobId, text)}
        />
      </div>

      {/* Archive */}
      <div className="mt-8 px-4">
        <button
          type="button"
          onClick={handleArchive}
          className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-400"
        >
          Archive job
        </button>
      </div>
    </div>
  )
}

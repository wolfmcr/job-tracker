import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeftIcon, ChevronRightIcon, NavigationIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { EditJobSheet } from '../components/jobs/EditJobSheet'
import { SectionHeader } from '../components/ui/SectionHeader'
import { AddButton } from '../components/ui/AddButton'
import { AddItemSheet } from '../components/items/AddItemSheet'
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
  const [addShoppingOpen, setAddShoppingOpen] = useState(false)
  const [addTodoOpen, setAddTodoOpen] = useState(false)
  const [showDoneShopping, setShowDoneShopping] = useState(false)
  const [showDoneTodos, setShowDoneTodos] = useState(false)

  const { items: shoppingItems } = useShoppingItems(jobId)
  const { items: todoItems } = useTodoItems(jobId)

  if (!job) return null

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(job.address)}`
  const readOnly = job.isArchived
  const color = job.color || DEFAULT_JOB_COLOR

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
      {/* Colored top accent */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      {/* Nav strip */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button type="button" onClick={() => navigate({ to: backRoute })} className="flex items-center gap-1 text-gray-500 -ml-1 p-1">
          <ArrowLeftIcon size={20} />
        </button>
        {readOnly ? (
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">Archived</span>
        ) : (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white active:opacity-80"
            style={{ backgroundColor: color }}
          >
            <PencilIcon size={13} />
            Edit
          </button>
        )}
      </div>

      {/* Info card */}
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="px-4 pt-4 pb-3" style={{ backgroundColor: `${color}18` }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <h1 className="text-xl font-bold text-gray-900">{job.name}</h1>
          </div>
        </div>
        {job.address && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-100 active:bg-gray-50"
            onClick={e => e.stopPropagation()}
          >
            <NavigationIcon size={16} style={{ color }} className="shrink-0" />
            <span className="flex-1 text-sm text-gray-700 truncate">{job.address}</span>
            <ChevronRightIcon size={16} className="text-gray-300 shrink-0" />
          </a>
        )}
      </div>

      {/* Shopping list */}
      <div className="mt-2">
        <SectionHeader
          title="Shopping"
          color={color}
          action={sortedShopping.filter(i => i.isGot).length > 0 ? (
            <button type="button" onClick={() => setShowDoneShopping(v => !v)} className="text-sm font-medium" style={{ color }}>
              {showDoneShopping ? 'Hide completed' : `Show ${sortedShopping.filter(i => i.isGot).length} completed`}
            </button>
          ) : undefined}
        />
        {showDoneShopping && sortedShopping.filter(i => i.isGot).map(item => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggle={readOnly ? () => {} : () => toggleShoppingItem(jobId, item.id, !item.isGot)}
            onDelete={readOnly ? () => {} : () => deleteShoppingItem(jobId, item.id)}
            onUpdate={(qty, name) => updateShoppingItem(jobId, item.id, qty, name)}
            readOnly={readOnly}
          />
        ))}
        {sortedShopping.filter(i => !i.isGot).map(item => (
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
          <AddButton label="Add item" onClick={() => setAddShoppingOpen(true)} color={color} />
        )}
      </div>

      {/* To-do list */}
      <div className="mt-4">
        <SectionHeader
          title="To-Do"
          color={color}
          action={sortedTodos.filter(i => i.isDone).length > 0 ? (
            <button type="button" onClick={() => setShowDoneTodos(v => !v)} className="text-sm font-medium" style={{ color }}>
              {showDoneTodos ? 'Hide completed' : `Show ${sortedTodos.filter(i => i.isDone).length} completed`}
            </button>
          ) : undefined}
        />
        {showDoneTodos && sortedTodos.filter(i => i.isDone).map(item => (
          <TodoItemRow
            key={item.id}
            item={item}
            onToggle={readOnly ? () => {} : () => toggleTodoItem(jobId, item.id, !item.isDone)}
            onDelete={readOnly ? () => {} : () => deleteTodoItem(jobId, item.id)}
            onUpdate={(text) => updateTodoItem(jobId, item.id, text)}
            readOnly={readOnly}
          />
        ))}
        {sortedTodos.filter(i => !i.isDone).map(item => (
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
          <AddButton label="Add task" onClick={() => setAddTodoOpen(true)} color={color} />
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
      <AddItemSheet
        open={addShoppingOpen}
        onClose={() => setAddShoppingOpen(false)}
        onAdd={(name, qty) => addShoppingItem(jobId, qty ?? '', name)}
        title="Add Shopping Item"
        hasQty
        placeholder="Item name…"
        color={color}
      />
      <AddItemSheet
        open={addTodoOpen}
        onClose={() => setAddTodoOpen(false)}
        onAdd={(text) => addTodoItem(jobId, text)}
        title="Add Task"
        placeholder="Task…"
        color={color}
      />
    </div>
  )
}

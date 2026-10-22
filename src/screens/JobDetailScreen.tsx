import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeftIcon, ChevronRightIcon, MessageSquareIcon, NavigationIcon, PencilIcon, PhoneIcon, StickyNoteIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { EditJobSheet } from '../components/jobs/EditJobSheet'
import { JobNotesSheet } from '../components/jobs/JobNotesSheet'
import { SectionHeader } from '../components/ui/SectionHeader'
import { AddButton } from '../components/ui/AddButton'
import { AddShoppingItemSheet } from '../components/items/AddShoppingItemSheet'
import { ShoppingItemRow } from '../components/items/ShoppingItemRow'
import { AddTaskSheet } from '../components/items/AddTaskSheet'
import { TaskRow } from '../components/items/TaskRow'
import { useJob } from '../hooks/useJob'
import { useShoppingItems, useTasks } from '../hooks/useJobItems'
import { formatPhone } from '../lib/format'
import { groupShoppingByTask } from '../lib/shopping'
import { sortByCompleted, sortItems } from '../lib/sortItems'
import type { ShoppingItem, Task } from '../types'
import {
  addShoppingItem,
  addTask,
  archiveJob,
  completeJob,
  deleteShoppingItem,
  deleteTask,
  restoreJob,
  toggleShoppingItem,
  toggleTask,
  updateShoppingItem,
  updateTask,
} from '../services/jobService'

export function JobDetailScreen() {
  const { jobId } = useParams({ from: '/layout/jobs/$jobId' })
  const navigate = useNavigate()
  const job = useJob(jobId)
  const [editOpen, setEditOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [addShoppingOpen, setAddShoppingOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [showDoneShopping, setShowDoneShopping] = useState(false)
  const [showDoneTasks, setShowDoneTasks] = useState(false)

  const { items: shoppingItems } = useShoppingItems(jobId)
  const { items: tasks } = useTasks(jobId)

  if (!job) return null

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(job.address)}`
  const phoneDigits = job.clientPhone?.replace(/[^\d+]/g, '') ?? ''
  const readOnly = job.isArchived
  const color = job.color || DEFAULT_JOB_COLOR

  const openShopping = sortItems(shoppingItems.filter(i => !i.isGot), 'priority', 'desc', () => '')
  const doneShopping = sortItems(shoppingItems.filter(i => i.isGot), 'priority', 'desc', () => '')
  const shoppingFor = groupShoppingByTask(shoppingItems)
  const taskName = (taskId?: string) => (taskId ? tasks.find(t => t.id === taskId)?.text : undefined)
  const openTasks = sortItems(tasks.filter(i => !i.isDone), 'priority', 'desc', () => '')
  const doneTasks = sortByCompleted(tasks.filter(i => i.isDone))

  function renderShoppingRow(item: ShoppingItem) {
    return (
      <ShoppingItemRow
        key={item.id}
        item={item}
        taskName={taskName(item.taskId)}
        onToggle={readOnly ? () => {} : () => toggleShoppingItem(jobId, item.id, !item.isGot)}
        onDelete={readOnly ? () => {} : () => deleteShoppingItem(jobId, item.id)}
        onUpdate={readOnly ? () => {} : (fields) => updateShoppingItem(jobId, item.id, fields)}
        readOnly={readOnly}
      />
    )
  }

  function renderTaskRow(task: Task) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        shoppingItems={shoppingFor(task.id)}
        onToggle={readOnly ? () => {} : () => toggleTask(jobId, task.id, !task.isDone)}
        onDelete={readOnly ? () => {} : (deleteShopping) => deleteTask(jobId, task.id, shoppingFor(task.id).map(i => i.id), deleteShopping)}
        onUpdate={readOnly ? () => {} : (fields) => updateTask(jobId, task.id, fields)}
        readOnly={readOnly}
      />
    )
  }

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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600 active:bg-gray-50"
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
        {(job.clientName || job.clientPhone) && (
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-100">
            <UserIcon size={16} style={{ color }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              {job.clientName && <p className="text-sm text-gray-700 truncate">{job.clientName}</p>}
              {job.clientPhone && <p className="text-xs text-gray-400 truncate">{formatPhone(job.clientPhone)}</p>}
            </div>
            {phoneDigits && (
              <>
                <a
                  href={`sms:${phoneDigits}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:opacity-70"
                  style={{ backgroundColor: `${color}18`, color }}
                  aria-label="Text client"
                >
                  <MessageSquareIcon size={16} />
                </a>
                <a
                  href={`tel:${phoneDigits}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:opacity-70"
                  style={{ backgroundColor: `${color}18`, color }}
                  aria-label="Call client"
                >
                  <PhoneIcon size={16} />
                </a>
              </>
            )}
          </div>
        )}
        {(job.notes || !readOnly) && (
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            disabled={readOnly}
            className="w-full flex items-start gap-3 px-4 py-3 bg-white border-t border-gray-100 text-left active:bg-gray-50"
          >
            <StickyNoteIcon size={16} style={{ color }} className="shrink-0 mt-0.5" />
            {job.notes ? (
              <span className="flex-1 text-sm text-gray-700 whitespace-pre-wrap wrap-break-word">{job.notes}</span>
            ) : (
              <span className="flex-1 text-sm text-gray-400">Add notes</span>
            )}
          </button>
        )}
      </div>

      {/* Shopping list */}
      <div className="mt-2">
        <SectionHeader
          title="Shopping"
          color={color}
          action={doneShopping.length > 0 ? (
            <button type="button" onClick={() => setShowDoneShopping(v => !v)} className="text-sm font-medium" style={{ color }}>
              {showDoneShopping ? 'Hide completed' : `Show ${doneShopping.length} completed`}
            </button>
          ) : undefined}
        />
        {openShopping.map(renderShoppingRow)}
        {showDoneShopping && doneShopping.map(renderShoppingRow)}
        {!readOnly && (
          <AddButton label="Add item" onClick={() => setAddShoppingOpen(true)} color={color} />
        )}
      </div>

      {/* Tasks */}
      <div className="mt-4">
        <SectionHeader
          title="Tasks"
          color={color}
          action={doneTasks.length > 0 ? (
            <button type="button" onClick={() => setShowDoneTasks(v => !v)} className="text-sm font-medium" style={{ color }}>
              {showDoneTasks ? 'Hide completed' : `Show ${doneTasks.length} completed`}
            </button>
          ) : undefined}
        />
        {openTasks.map(renderTaskRow)}
        {showDoneTasks && doneTasks.map(renderTaskRow)}
        {!readOnly && (
          <AddButton label="Add task" onClick={() => setAddTaskOpen(true)} color={color} />
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
        <>
          <EditJobSheet job={job} open={editOpen} onClose={() => setEditOpen(false)} />
          <JobNotesSheet job={job} open={notesOpen} onClose={() => setNotesOpen(false)} color={color} />
        </>
      )}
      <AddShoppingItemSheet
        open={addShoppingOpen}
        onClose={() => setAddShoppingOpen(false)}
        onAdd={addShoppingItem}
        defaultJobId={jobId}
        color={color}
      />
      <AddTaskSheet
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        onAdd={addTask}
        defaultJobId={jobId}
        color={color}
      />
    </div>
  )
}

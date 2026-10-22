import { useEffect, useState } from 'react'
import type { TaskFields } from '../../services/jobService'
import type { Timestamp } from 'firebase/firestore'
import type { ShoppingItem, Task } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { cleanBullets } from '../../lib/format'
import { BulletListInput } from '../ui/BulletListInput'
import { DeleteButton } from '../ui/DeleteButton'
import { DueDateField } from '../ui/DueDateField'
import { Field } from '../ui/Field'
import { DueDateLabel } from '../ui/DueDateLabel'
import { JobBadge } from '../ui/JobBadge'
import { PriorityPicker } from '../ui/PriorityPicker'
import { SubmitButton } from '../ui/SubmitButton'
import { TaskShoppingList } from './TaskShoppingList'

interface Props {
  open: boolean
  onClose: () => void
  task: Task
  shoppingItems: ShoppingItem[]
  onUpdate: (fields: TaskFields) => void
  onDelete: (deleteShopping: boolean) => void
  jobColor?: string
  jobName?: string
  readOnly?: boolean
}

function formatTimestamp(timestamp: Timestamp | undefined) {
  const date = timestamp?.toDate?.()
  if (!date) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function EditTaskSheet({ open, onClose, task, shoppingItems, onUpdate, onDelete, jobColor, jobName, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [choosingDelete, setChoosingDelete] = useState(false)
  const [text, setText] = useState(task.text)
  const [bullets, setBullets] = useState<string[]>(task.bullets ?? [])
  const [priority, setPriority] = useState(task.priority ?? 0)
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')

  useEffect(() => {
    if (open) {
      setEditing(false)
      setChoosingDelete(false)
      setText(task.text)
      setBullets(task.bullets ?? [])
      setPriority(task.priority ?? 0)
      setDueDate(task.dueDate ?? '')
    }
  }, [open, task])

  const created = formatTimestamp(task.createdAt)
  const completed = task.isDone ? formatTimestamp(task.completedAt) : null

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim()) return
    onUpdate({ text: text.trim(), bullets: cleanBullets(bullets), priority, dueDate })
    onClose()
  }

  function handleDelete(deleteShopping: boolean) {
    onDelete(deleteShopping)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? 'Edit Task' : 'Task'}>
      {(jobName && jobColor) || created ? (
        <div className="flex items-center gap-2 -mt-3 mb-4">
          {jobName && jobColor && <JobBadge name={jobName} color={jobColor} />}
          {created && <span className="text-xs text-gray-400 mt-1">Added {created}</span>}
          {completed && <span className="text-xs text-gray-400 mt-1">· Done {completed}</span>}
        </div>
      ) : null}

      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Field label="Task" required>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </Field>
          <BulletListInput label="Details" value={bullets} onChange={setBullets} />
          <DueDateField value={dueDate} onChange={setDueDate} />
          <PriorityPicker value={priority} onChange={setPriority} />
          <SubmitButton label="Save" disabled={!text.trim()} />
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className={`text-lg font-semibold ${task.isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.text}
          </p>
          {task.dueDate && !task.isDone && <DueDateLabel dueDate={task.dueDate} className="text-sm -mt-3" />}
          {task.bullets && task.bullets.length > 0 ? (
            <ul className="list-disc pl-5 flex flex-col gap-1 text-base text-gray-700 wrap-break-word max-h-[50vh] overflow-y-auto">
              {task.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
            </ul>
          ) : (
            <p className="text-base text-gray-400">No details</p>
          )}
          <TaskShoppingList task={task} items={shoppingItems} jobColor={jobColor} readOnly={readOnly} />
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full py-3 text-white font-semibold rounded-xl text-base active:opacity-80"
                style={{ backgroundColor: '#111827' }}
              >
                Edit
              </button>
              {shoppingItems.length === 0 ? (
                <DeleteButton onDelete={() => handleDelete(false)} />
              ) : choosingDelete ? (
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-red-100">
                  <p className="text-sm text-gray-700">
                    This task has {shoppingItems.length} shopping {shoppingItems.length === 1 ? 'item' : 'items'}. Delete {shoppingItems.length === 1 ? 'it' : 'them'} too?
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(true)}
                    className="w-full py-3 font-semibold rounded-xl text-base bg-red-500 text-white active:bg-red-600"
                  >
                    Delete task and shopping
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(false)}
                    className="w-full py-3 font-semibold rounded-xl text-base border border-red-100 text-red-500 active:bg-red-50"
                  >
                    Delete task, keep shopping on job list
                  </button>
                  <button type="button" onClick={() => setChoosingDelete(false)} className="w-full py-2 text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setChoosingDelete(true)}
                  className="w-full py-3 font-semibold rounded-xl text-base border text-red-500 border-red-100 active:bg-red-50"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      )}
    </BottomSheet>
  )
}

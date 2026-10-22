import { useEffect, useState } from 'react'
import type { TaskFields } from '../../services/jobService'
import type { Timestamp } from 'firebase/firestore'
import type { Task } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { cleanBullets } from '../../lib/format'
import { BulletListInput } from '../ui/BulletListInput'
import { DeleteButton } from '../ui/DeleteButton'
import { Field } from '../ui/Field'
import { JobBadge } from '../ui/JobBadge'
import { PriorityPicker } from '../ui/PriorityPicker'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  open: boolean
  onClose: () => void
  task: Task
  onUpdate: (fields: TaskFields) => void
  onDelete: () => void
  jobColor?: string
  jobName?: string
  readOnly?: boolean
}

function formatTimestamp(timestamp: Timestamp | undefined) {
  const date = timestamp?.toDate?.()
  if (!date) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function EditTaskSheet({ open, onClose, task, onUpdate, onDelete, jobColor, jobName, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(task.text)
  const [bullets, setBullets] = useState<string[]>(task.bullets ?? [])
  const [priority, setPriority] = useState(task.priority ?? 0)

  useEffect(() => {
    if (open) {
      setEditing(false)
      setText(task.text)
      setBullets(task.bullets ?? [])
      setPriority(task.priority ?? 0)
    }
  }, [open, task])

  const created = formatTimestamp(task.createdAt)
  const completed = task.isDone ? formatTimestamp(task.completedAt) : null

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim()) return
    onUpdate({ text: text.trim(), bullets: cleanBullets(bullets), priority })
    onClose()
  }

  function handleDelete() {
    onDelete()
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
          <PriorityPicker value={priority} onChange={setPriority} />
          <SubmitButton label="Save" disabled={!text.trim()} />
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className={`text-lg font-semibold ${task.isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.text}
          </p>
          {task.bullets && task.bullets.length > 0 ? (
            <ul className="list-disc pl-5 flex flex-col gap-1 text-base text-gray-700 wrap-break-word max-h-[50vh] overflow-y-auto">
              {task.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
            </ul>
          ) : (
            <p className="text-base text-gray-400">No details</p>
          )}
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
              <DeleteButton onDelete={handleDelete} />
            </>
          )}
        </div>
      )}
    </BottomSheet>
  )
}

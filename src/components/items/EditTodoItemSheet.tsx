import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { TodoItem } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { DeleteButton } from '../ui/DeleteButton'
import { JobBadge } from '../ui/JobBadge'
import { RequiredMark } from '../ui/RequiredMark'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  open: boolean
  onClose: () => void
  item: TodoItem
  onUpdate: (text: string, details: string) => void
  onDelete: () => void
  jobColor?: string
  jobName?: string
  readOnly?: boolean
}

function useAutoGrow(value: string, active: boolean) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }, [value, active])
  return ref
}

function formatCreated(item: TodoItem) {
  const date = item.createdAt?.toDate?.()
  if (!date) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function EditTodoItemSheet({ open, onClose, item, onUpdate, onDelete, jobColor, jobName, readOnly = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(item.text)
  const [details, setDetails] = useState(item.details ?? '')
  const detailsRef = useAutoGrow(details, editing)

  useEffect(() => {
    if (open) {
      setEditing(false)
      setText(item.text)
      setDetails(item.details ?? '')
    }
  }, [open, item])

  const created = formatCreated(item)

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim()) return
    onUpdate(text.trim(), details.trim())
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
        </div>
      ) : null}

      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Task"
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <RequiredMark show={!text} />
          </div>
          <textarea
            ref={detailsRef}
            rows={3}
            placeholder="Details"
            value={details}
            onChange={e => setDetails(e.target.value)}
            className="w-full resize-none max-h-[50vh] px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <SubmitButton label="Save" disabled={!text.trim()} />
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className={`text-lg font-semibold ${item.isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {item.text}
          </p>
          {item.details ? (
            <p className="text-base text-gray-700 whitespace-pre-wrap wrap-break-word max-h-[50vh] overflow-y-auto">
              {item.details}
            </p>
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

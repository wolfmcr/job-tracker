import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { TodoItem } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { DeleteButton } from '../ui/DeleteButton'
import { JobBadge } from '../ui/JobBadge'
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

function useAutoGrow(value: string, open: boolean) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value, open])
  return ref
}

function formatCreated(item: TodoItem) {
  const date = item.createdAt?.toDate?.()
  if (!date) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function EditTodoItemSheet({ open, onClose, item, onUpdate, onDelete, jobColor, jobName, readOnly = false }: Props) {
  const [text, setText] = useState(item.text)
  const [details, setDetails] = useState(item.details ?? '')
  const textRef = useAutoGrow(text, open)
  const detailsRef = useAutoGrow(details, open)

  useEffect(() => {
    if (open) {
      setText(item.text)
      setDetails(item.details ?? '')
    }
  }, [open, item])

  const isDirty = text.trim() !== item.text || details.trim() !== (item.details ?? '')
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
    <BottomSheet open={open} onClose={onClose} title="Task">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {(jobName && jobColor) || created ? (
          <div className="flex items-center gap-2 -mt-3">
            {jobName && jobColor && <JobBadge name={jobName} color={jobColor} />}
            {created && <span className="text-xs text-gray-400 mt-1">Added {created}</span>}
          </div>
        ) : null}
        <textarea
          ref={textRef}
          rows={1}
          placeholder="Task"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              detailsRef.current?.focus()
            }
          }}
          readOnly={readOnly}
          className={`w-full resize-none overflow-hidden bg-transparent text-lg font-semibold focus:outline-none ${item.isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}
          required
        />
        <textarea
          ref={detailsRef}
          rows={3}
          placeholder={readOnly ? 'No details' : 'Add details…'}
          value={details}
          onChange={e => setDetails(e.target.value)}
          readOnly={readOnly}
          className="w-full resize-none max-h-[50vh] bg-transparent text-base text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        {!readOnly && isDirty && <SubmitButton label="Save" disabled={!text.trim()} />}
        {!readOnly && <DeleteButton onDelete={handleDelete} />}
      </form>
    </BottomSheet>
  )
}

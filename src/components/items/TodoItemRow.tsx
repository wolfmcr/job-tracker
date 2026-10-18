import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import type { TodoItem } from '../../types'
import { JobBadge } from '../ui/JobBadge'
import { PriorityFlagButton } from '../ui/PriorityFlagButton'
import { EditTodoItemSheet } from './EditTodoItemSheet'

interface Props {
  item: TodoItem
  onToggle: () => void
  onUpdate: (text: string) => void
  onDelete: () => void
  onSetPriority?: (priority: number) => void
  jobColor?: string
  jobName?: string
  readOnly?: boolean
}

export function TodoItemRow({ item, onToggle, onUpdate, onDelete, onSetPriority, jobColor, jobName, readOnly = false }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const priority = item.priority ?? 0

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
        <input
          type="checkbox"
          checked={item.isDone}
          onChange={onToggle}
          disabled={readOnly}
          className="w-6 h-6 shrink-0"
          style={{ accentColor: jobColor ?? '#2563eb' }}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-base ${item.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.text}
          </p>
          {jobName && jobColor && (
            <JobBadge name={jobName} color={jobColor} />
          )}
        </div>
        {!readOnly && onSetPriority && (
          <PriorityFlagButton priority={priority} onSetPriority={onSetPriority} />
        )}
        {!readOnly && (
          <button type="button" onClick={() => setEditOpen(true)} className="text-gray-300 active:text-gray-500 p-2 -mr-2 shrink-0">
            <PencilIcon size={20} />
          </button>
        )}
      </div>
      <EditTodoItemSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  )
}

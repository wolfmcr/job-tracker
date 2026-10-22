import { useState } from 'react'
import type { TodoItem } from '../../types'
import { JobBadge } from '../ui/JobBadge'
import { PriorityFlagButton } from '../ui/PriorityFlagButton'
import { EditTodoItemSheet } from './EditTodoItemSheet'

interface Props {
  item: TodoItem
  onToggle: () => void
  onUpdate: (text: string, details: string) => void
  onDelete: () => void
  onSetPriority?: (priority: number) => void
  jobColor?: string
  jobName?: string
  readOnly?: boolean
}

export function TodoItemRow({ item, onToggle, onUpdate, onDelete, onSetPriority, jobColor, jobName, readOnly = false }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const priority = item.priority ?? 0

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSheetOpen(true)}
        onKeyDown={e => { if (e.key === 'Enter') setSheetOpen(true) }}
        className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 cursor-pointer active:bg-gray-50"
      >
        <input
          type="checkbox"
          checked={item.isDone}
          aria-label={`Done: ${item.text}`}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          disabled={readOnly}
          className="w-6 h-6 shrink-0"
          style={{ accentColor: jobColor ?? '#2563eb' }}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-base ${item.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.text}
          </p>
          {item.details && (
            <p className="text-sm text-gray-400 truncate">{item.details}</p>
          )}
          {jobName && jobColor && (
            <JobBadge name={jobName} color={jobColor} />
          )}
        </div>
        {!readOnly && onSetPriority && (
          <div onClick={e => e.stopPropagation()}>
            <PriorityFlagButton priority={priority} onSetPriority={onSetPriority} />
          </div>
        )}
      </div>
      <EditTodoItemSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
        jobColor={jobColor}
        jobName={jobName}
        readOnly={readOnly}
      />
    </>
  )
}

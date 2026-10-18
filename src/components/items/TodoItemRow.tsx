import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import type { TodoItem } from '../../types'
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

function nextPriority(p: number) {
  if (p === 0) return 2
  if (p === 2) return 1
  return 0
}

function flagColor(p: number) {
  if (p === 2) return '#ef4444'
  if (p === 1) return '#f59e0b'
  return '#d1d5db'
}

export function TodoItemRow({ item, onToggle, onUpdate, onDelete, onSetPriority, jobColor, jobName, readOnly = false }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const priority = item.priority ?? 0

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <input
          type="checkbox"
          checked={item.isDone}
          onChange={onToggle}
          disabled={readOnly}
          className="w-5 h-5 shrink-0"
          style={{ accentColor: jobColor ?? '#2563eb' }}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${item.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.text}
          </p>
          {jobName && jobColor && (
            <span
              className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
              style={{ backgroundColor: `${jobColor}22`, color: jobColor }}
            >
              {jobName}
            </span>
          )}
        </div>
        {!readOnly && onSetPriority && (
          <button
            type="button"
            onClick={() => onSetPriority(nextPriority(priority))}
            className="p-1 shrink-0 active:opacity-60"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={priority > 0 ? flagColor(priority) : 'none'} stroke={flagColor(priority)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </button>
        )}
        {!readOnly && (
          <button type="button" onClick={() => setEditOpen(true)} className="text-gray-300 active:text-gray-500 p-1 -mr-1 shrink-0">
            <PencilIcon size={15} />
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

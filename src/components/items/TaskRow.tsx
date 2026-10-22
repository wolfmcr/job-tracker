import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import type { TaskFields } from '../../services/jobService'
import type { Task } from '../../types'
import { JobBadge } from '../ui/JobBadge'
import { PriorityFlagButton } from '../ui/PriorityFlagButton'
import { EditTaskSheet } from './EditTaskSheet'

interface Props {
  task: Task
  onToggle: () => void
  onUpdate: (fields: TaskFields) => void
  onDelete: () => void
  onSetPriority?: (priority: number) => void
  jobColor?: string
  jobName?: string
  readOnly?: boolean
}

export function TaskRow({ task, onToggle, onUpdate, onDelete, onSetPriority, jobColor, jobName, readOnly = false }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const priority = task.priority ?? 0
  const bullets = task.bullets ?? []

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSheetOpen(true)}
        onKeyDown={e => { if (e.key === 'Enter') setSheetOpen(true) }}
        className="px-4 py-4 border-b border-gray-100 cursor-pointer active:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={task.isDone}
            aria-label={`Done: ${task.text}`}
            onChange={onToggle}
            onClick={e => e.stopPropagation()}
            disabled={readOnly}
            className="w-6 h-6 shrink-0"
            style={{ accentColor: jobColor ?? '#2563eb' }}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-base ${task.isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.text}
            </p>
            {jobName && jobColor && (
              <JobBadge name={jobName} color={jobColor} />
            )}
          </div>
          {bullets.length > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Hide' : 'Show'} ${bullets.length} details`}
              className="flex items-center gap-0.5 p-2 shrink-0 text-sm text-gray-400 active:opacity-60"
            >
              {bullets.length}
              <ChevronDownIcon size={18} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          {!readOnly && onSetPriority && (
            <div onClick={e => e.stopPropagation()}>
              <PriorityFlagButton priority={priority} onSetPriority={onSetPriority} />
            </div>
          )}
        </div>
        {expanded && (
          <ul className="list-disc pl-10 pr-12 mt-2 flex flex-col gap-1 text-sm text-gray-600 wrap-break-word">
            {bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
          </ul>
        )}
      </div>
      <EditTaskSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        task={task}
        onUpdate={onUpdate}
        onDelete={onDelete}
        jobColor={jobColor}
        jobName={jobName}
        readOnly={readOnly}
      />
    </>
  )
}

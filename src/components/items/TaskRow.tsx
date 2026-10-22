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
  const priority = task.priority ?? 0

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
          {task.bullets && task.bullets.length > 0 && (
            <p className="text-sm text-gray-400 truncate">{task.bullets.join(' · ')}</p>
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

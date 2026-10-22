import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import type { TaskFields } from '../../services/jobService'
import type { Task } from '../../types'
import { DueDateLabel } from '../ui/DueDateLabel'
import { JobBadge } from '../ui/JobBadge'
import { EditTaskSheet } from './EditTaskSheet'

interface Props {
  task: Task
  onToggle: () => void
  onUpdate: (fields: TaskFields) => void
  onDelete: () => void
  jobColor?: string
  jobName?: string
  readOnly?: boolean
}

export function TaskRow({ task, onToggle, onUpdate, onDelete, jobColor, jobName, readOnly = false }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
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
        <div className="flex items-start gap-4">
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
            {task.dueDate && !task.isDone && <DueDateLabel dueDate={task.dueDate} className="text-sm" />}
            {expanded && (
              <ul className="tree-list mt-1 flex flex-col gap-0.5 text-sm text-gray-500 wrap-break-word">
                {bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
              </ul>
            )}
            {jobName && jobColor && (
              <JobBadge name={jobName} color={jobColor} />
            )}
          </div>
          {bullets.length > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              aria-expanded={expanded}
              aria-label={expanded ? 'Hide details' : 'Show details'}
              className="p-2 -mr-2 -mt-1 shrink-0 text-gray-400 active:opacity-60"
            >
              <ChevronDownIcon size={18} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
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

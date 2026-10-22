import { CheckSquareIcon } from 'lucide-react'
import { useState } from 'react'
import type { ShoppingItemFields } from '../../services/jobService'
import type { ShoppingItem } from '../../types'
import { JobBadge } from '../ui/JobBadge'
import { EditShoppingItemSheet } from './EditShoppingItemSheet'

interface Props {
  item: ShoppingItem
  onToggle: () => void
  onUpdate: (fields: ShoppingItemFields) => void
  onDelete: () => void
  jobColor?: string
  jobName?: string
  taskName?: string // set when the item is on a task's shopping list
  readOnly?: boolean
}

export function ShoppingItemRow({ item, onToggle, onUpdate, onDelete, jobColor, jobName, taskName, readOnly = false }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)

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
            checked={item.isGot}
            aria-label={`Got: ${item.name}`}
            onChange={onToggle}
            onClick={e => e.stopPropagation()}
            disabled={readOnly}
            className="w-6 h-6 shrink-0"
            style={{ accentColor: jobColor ?? '#2563eb' }}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-base ${item.isGot ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {item.qty ? <span className="font-medium text-gray-500 mr-1">{item.qty}</span> : null}
              {item.name}
            </p>
            {taskName && (
              <p className="flex items-center gap-1 text-sm text-gray-500">
                <CheckSquareIcon size={13} className="shrink-0" />
                <span className="truncate">{taskName}</span>
              </p>
            )}
            {jobName && jobColor && (
              <JobBadge name={jobName} color={jobColor} />
            )}
          </div>
        </div>
      </div>
      <EditShoppingItemSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
        jobColor={jobColor}
        jobName={jobName}
        taskName={taskName}
        readOnly={readOnly}
      />
    </>
  )
}

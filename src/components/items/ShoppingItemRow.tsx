import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import type { ShoppingItem } from '../../types'
import { JobBadge } from '../ui/JobBadge'
import { PriorityFlagButton } from '../ui/PriorityFlagButton'
import { EditShoppingItemSheet } from './EditShoppingItemSheet'

interface Props {
  item: ShoppingItem
  onToggle: () => void
  onUpdate: (qty: string, name: string) => void
  onDelete: () => void
  onSetPriority?: (priority: number) => void
  jobColor?: string
  jobName?: string
  readOnly?: boolean
}

export function ShoppingItemRow({ item, onToggle, onUpdate, onDelete, onSetPriority, jobColor, jobName, readOnly = false }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const priority = item.priority ?? 0

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
        <input
          type="checkbox"
          checked={item.isGot}
          onChange={onToggle}
          disabled={readOnly}
          className="w-6 h-6 shrink-0"
          style={{ accentColor: jobColor ?? '#2563eb' }}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-base ${item.isGot ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.qty ? <span className="font-medium text-gray-500 mr-1">{item.qty}</span> : null}
            {item.name}
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
      <EditShoppingItemSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  )
}

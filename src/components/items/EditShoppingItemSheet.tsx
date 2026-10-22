import { useEffect, useState } from 'react'
import type { ShoppingItemFields } from '../../services/jobService'
import type { ShoppingItem } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { DeleteButton } from '../ui/DeleteButton'
import { Field } from '../ui/Field'
import { JobBadge } from '../ui/JobBadge'
import { PriorityPicker } from '../ui/PriorityPicker'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  open: boolean
  onClose: () => void
  item: ShoppingItem
  onUpdate: (fields: ShoppingItemFields) => void
  onDelete: () => void
  jobColor?: string
  jobName?: string
  taskName?: string
  readOnly?: boolean
}

export function EditShoppingItemSheet({ open, onClose, item, onUpdate, onDelete, jobColor, jobName, taskName, readOnly = false }: Props) {
  const [qty, setQty] = useState(item.qty)
  const [name, setName] = useState(item.name)
  const [priority, setPriority] = useState(item.priority ?? 0)

  useEffect(() => {
    if (open) {
      setQty(item.qty)
      setName(item.name)
      setPriority(item.priority ?? 0)
    }
  }, [open, item])

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    onUpdate({ qty: qty.trim(), name: name.trim(), priority })
    onClose()
  }

  function handleDelete() {
    onDelete()
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={readOnly ? 'Item' : 'Edit Item'}>
      {(jobName && jobColor) || taskName ? (
        <div className="flex flex-wrap items-center gap-2 -mt-3 mb-4">
          {jobName && jobColor && <JobBadge name={jobName} color={jobColor} />}
          {taskName && <span className="text-xs text-gray-400 mt-1">For {taskName}</span>}
        </div>
      ) : null}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <fieldset disabled={readOnly} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Field label="Qty" className="w-24 shrink-0">
              <input
                type="text"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Item" required className="flex-1 min-w-0">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </Field>
          </div>
          <PriorityPicker value={priority} onChange={setPriority} />
        </fieldset>
        {!readOnly && (
          <>
            <SubmitButton label="Save" disabled={!name.trim()} />
            <DeleteButton onDelete={handleDelete} />
          </>
        )}
      </form>
    </BottomSheet>
  )
}

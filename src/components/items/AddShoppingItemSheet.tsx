import { useRef, useState } from 'react'
import { useOnOpen } from '../../hooks/useOnOpen'
import type { ShoppingItemFields } from '../../services/jobService'
import type { Job } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { Field } from '../ui/Field'
import { JobPicker } from '../ui/JobPicker'
import { PriorityPicker } from '../ui/PriorityPicker'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (jobId: string, fields: ShoppingItemFields) => unknown
  color?: string
  // Shows a job picker; omit when the job is fixed (pass defaultJobId instead)
  jobs?: Job[]
  defaultJobId?: string
}

export function AddShoppingItemSheet({ open, onClose, onAdd, color = '#111827', jobs, defaultJobId }: Props) {
  const [qty, setQty] = useState('')
  const [name, setName] = useState('')
  const [priority, setPriority] = useState(0)
  // '' until a job is picked; then the fixed job, else the first in the list (which may load after opening)
  const [pickedJobId, setPickedJobId] = useState('')
  const selectedJobId = pickedJobId || defaultJobId || jobs?.[0]?.id || ''
  const nameRef = useRef<HTMLInputElement>(null)

  useOnOpen(open, () => {
    setQty('')
    setName('')
    setPriority(0)
    setPickedJobId('')
    setTimeout(() => nameRef.current?.focus(), 80)
  })

  const selectedJob = jobs?.find(j => j.id === selectedJobId)
  const submitColor = selectedJob?.color || color

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !selectedJobId) return
    onAdd(selectedJobId, { qty: qty.trim(), name: name.trim(), priority })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Shopping Item">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {jobs && jobs.length > 0 && (
          <JobPicker jobs={jobs} value={selectedJobId} onChange={setPickedJobId} />
        )}
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
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>
        <PriorityPicker value={priority} onChange={setPriority} />
        <SubmitButton
          label="Add"
          disabled={!name.trim() || !selectedJobId}
          color={submitColor}
        />
      </form>
    </BottomSheet>
  )
}

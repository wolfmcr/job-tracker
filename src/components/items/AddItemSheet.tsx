import { useEffect, useRef, useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { Field } from '../ui/Field'
import { JobPicker } from '../ui/JobPicker'
import { SubmitButton } from '../ui/SubmitButton'
import type { Job } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (text: string, qty?: string, jobId?: string) => Promise<void>
  title: string
  hasQty?: boolean
  label?: string
  color?: string
  jobs?: Job[]
  defaultJobId?: string
}

export function AddItemSheet({ open, onClose, onAdd, title, hasQty = false, label = 'Item', color = '#2563eb', jobs, defaultJobId }: Props) {
  const [text, setText] = useState('')
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>(defaultJobId ?? '')
  const textRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setQty('')
      setSelectedJobId(defaultJobId ?? jobs?.[0]?.id ?? '')
      setTimeout(() => textRef.current?.focus(), 80)
    }
  }, [open, defaultJobId, jobs])

  const selectedJob = jobs?.find(j => j.id === selectedJobId)
  const submitColor = selectedJob?.color || color

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim()) return
    if (jobs && !selectedJobId) return
    setSaving(true)
    await onAdd(text.trim(), qty.trim() || undefined, selectedJobId || undefined)
    setSaving(false)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {jobs && jobs.length > 0 && (
          <JobPicker jobs={jobs} value={selectedJobId} onChange={setSelectedJobId} />
        )}
        {hasQty && (
          <Field label="Quantity">
            <input
              type="text"
              placeholder="e.g. 3x, 1 bag"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        )}
        <Field label={label} required>
          <input
            ref={textRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <SubmitButton
          label="Add"
          loadingLabel="Adding…"
          loading={saving}
          disabled={saving || !text.trim() || (!!jobs && !selectedJobId)}
          color={submitColor}
        />
      </form>
    </BottomSheet>
  )
}

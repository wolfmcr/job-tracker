import { useEffect, useRef, useState } from 'react'
import type { Job } from '../../types'
import type { TaskFields } from '../../services/jobService'
import { BottomSheet } from '../ui/BottomSheet'
import { cleanBullets } from '../../lib/format'
import { BulletListInput } from '../ui/BulletListInput'
import { DueDateField } from '../ui/DueDateField'
import { Field } from '../ui/Field'
import { JobPicker } from '../ui/JobPicker'
import { PriorityPicker } from '../ui/PriorityPicker'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (jobId: string, fields: TaskFields) => unknown
  color?: string
  // Shows a job picker; omit when the job is fixed (pass defaultJobId instead)
  jobs?: Job[]
  defaultJobId?: string
}

export function AddTaskSheet({ open, onClose, onAdd, color = '#111827', jobs, defaultJobId }: Props) {
  const [text, setText] = useState('')
  const [bullets, setBullets] = useState<string[]>([])
  const [priority, setPriority] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [selectedJobId, setSelectedJobId] = useState<string>(defaultJobId ?? '')
  const textRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setBullets([])
      setPriority(0)
      setDueDate('')
      setSelectedJobId(defaultJobId ?? jobs?.[0]?.id ?? '')
      setTimeout(() => textRef.current?.focus(), 80)
    }
  }, [open, defaultJobId, jobs])

  const selectedJob = jobs?.find(j => j.id === selectedJobId)
  const submitColor = selectedJob?.color || color

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim() || !selectedJobId) return
    onAdd(selectedJobId, { text: text.trim(), bullets: cleanBullets(bullets), priority, dueDate })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {jobs && jobs.length > 0 && (
          <JobPicker jobs={jobs} value={selectedJobId} onChange={setSelectedJobId} />
        )}
        <Field label="Task" required>
          <input
            ref={textRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <BulletListInput label="Details" value={bullets} onChange={setBullets} />
        <DueDateField value={dueDate} onChange={setDueDate} />
        <PriorityPicker value={priority} onChange={setPriority} />
        <SubmitButton
          label="Add"
          disabled={!text.trim() || !selectedJobId}
          color={submitColor}
        />
      </form>
    </BottomSheet>
  )
}

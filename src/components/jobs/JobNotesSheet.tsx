import { useEffect, useState } from 'react'
import { updateJob } from '../../services/jobService'
import type { Job } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  job: Job
  open: boolean
  onClose: () => void
  color: string
}

export function JobNotesSheet({ job, open, onClose, color }: Props) {
  const [notes, setNotes] = useState(job.notes ?? '')

  useEffect(() => {
    if (open) setNotes(job.notes ?? '')
  }, [open, job])

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    updateJob(job.id, { notes: notes.trim() })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Job Notes">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <textarea
          rows={8}
          placeholder="Gate code, paint colors, parking, anything else…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full resize-none max-h-[50vh] px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <SubmitButton label="Save" color={color} />
      </form>
    </BottomSheet>
  )
}

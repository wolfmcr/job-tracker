import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import { updateJob } from '../../services/jobService'
import type { Job } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  job: Job
  open: boolean
  onClose: () => void
}

export function EditJobSheet({ job, open, onClose }: Props) {
  const [name, setName] = useState(job.name)
  const [address, setAddress] = useState(job.address)
  const [color, setColor] = useState(job.color || DEFAULT_JOB_COLOR)
  const colorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(job.name)
      setAddress(job.address)
      setColor(job.color || DEFAULT_JOB_COLOR)
    }
  }, [open, job])

  const mutation = useMutation({
    mutationFn: () => updateJob(job.id, name.trim(), address.trim(), color),
    onSuccess: onClose,
  })

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Job">
      <form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); mutation.mutate() }}
        className="flex flex-col gap-4"
      >
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={() => colorRef.current?.click()}
            className="w-12 h-12 rounded-full shrink-0 border-2 border-white shadow-md"
            style={{ backgroundColor: color }}
            aria-label="Pick color"
          />
          <input
            ref={colorRef}
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="sr-only"
          />
          <input
            type="text"
            placeholder="Job name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Address (optional)"
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {mutation.isError && (
          <p className="text-red-600 text-sm text-center">Failed to save. Try again.</p>
        )}
        <SubmitButton
          label="Save"
          loadingLabel="Saving…"
          loading={mutation.isPending}
          disabled={mutation.isPending || !name.trim()}
          color={color}
        />
      </form>
    </BottomSheet>
  )
}

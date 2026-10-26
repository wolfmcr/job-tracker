import { useEffect, useRef, useState } from 'react'
import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import { updateJob } from '../../services/jobService'
import type { Job } from '../../types'
import { formatPhone } from '../../lib/format'
import { AddressInput } from '../ui/AddressInput'
import { BottomSheet } from '../ui/BottomSheet'
import { Field } from '../ui/Field'
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
  const [clientName, setClientName] = useState(job.clientName ?? '')
  const [clientPhone, setClientPhone] = useState(formatPhone(job.clientPhone ?? ''))
  const colorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(job.name)
      setAddress(job.address)
      setColor(job.color || DEFAULT_JOB_COLOR)
      setClientName(job.clientName ?? '')
      setClientPhone(formatPhone(job.clientPhone ?? ''))
    }
  }, [open, job])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    updateJob(job.id, {
      name: name.trim(),
      address: address.trim(),
      color,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
    })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Job">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex gap-3 items-end">
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
          <Field label="Job name" required className="flex-1">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </Field>
        </div>
        <AddressInput value={address} onChange={setAddress} />
        <Field label="Client name">
          <input
            type="text"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            autoComplete="off"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <Field label="Client phone">
          <input
            type="tel"
            value={clientPhone}
            onChange={e => setClientPhone(formatPhone(e.target.value))}
            autoComplete="off"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
        <SubmitButton
          label="Save"
          disabled={!name.trim()}
          color={color}
        />
      </form>
    </BottomSheet>
  )
}

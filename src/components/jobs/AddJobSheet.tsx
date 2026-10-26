import { useEffect, useRef, useState } from 'react'
import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import { addJob } from '../../services/jobService'
import { formatPhone } from '../../lib/format'
import { AddressInput } from '../ui/AddressInput'
import { BottomSheet } from '../ui/BottomSheet'
import { Field } from '../ui/Field'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  open: boolean
  onClose: () => void
}

export function AddJobSheet({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [color, setColor] = useState(DEFAULT_JOB_COLOR)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 100)
  }, [open])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    addJob({
      name: name.trim(),
      address: address.trim(),
      color,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
    })
    setName('')
    setAddress('')
    setColor(DEFAULT_JOB_COLOR)
    setClientName('')
    setClientPhone('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Job">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3 items-end">
          {/* Color picker — circle taps open native color wheel */}
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
              ref={nameRef}
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
          label="Add Job"
          disabled={!name.trim()}
          color={color}
        />
      </form>
    </BottomSheet>
  )
}

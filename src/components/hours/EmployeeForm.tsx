import { useEffect, useState } from 'react'
import { Field } from '../ui/Field'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  initialName?: string
  initialRate?: number
  submitLabel: string
  onSave: (name: string, hourlyRate: number) => void
  resetKey?: unknown
}

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

export function EmployeeForm({ initialName = '', initialRate, submitLabel, onSave, resetKey }: Props) {
  const [name, setName] = useState(initialName)
  const [rate, setRate] = useState(initialRate !== undefined ? String(initialRate) : '')

  useEffect(() => {
    setName(initialName)
    setRate(initialRate !== undefined ? String(initialRate) : '')
  }, [resetKey, initialName, initialRate])

  const parsedRate = Number(rate)
  const valid = name.trim() !== '' && rate.trim() !== '' && Number.isFinite(parsedRate) && parsedRate >= 0

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!valid) return
    onSave(name.trim(), parsedRate)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Name" required>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="off"
          className={inputClass}
          required
        />
      </Field>
      <Field label="Hourly rate ($)" required>
        <input
          type="text"
          inputMode="decimal"
          placeholder="e.g. 30"
          value={rate}
          onChange={e => setRate(e.target.value.replace(/[^\d.]/g, ''))}
          className={inputClass}
          required
        />
      </Field>
      <SubmitButton label={submitLabel} disabled={!valid} />
    </form>
  )
}

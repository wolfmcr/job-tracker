import { useEffect, useState } from 'react'
import { formatMoney, todayISO } from '../../lib/format'
import { BottomSheet } from '../ui/BottomSheet'
import { DeleteButton } from '../ui/DeleteButton'
import { Field } from '../ui/Field'
import { SubmitButton } from '../ui/SubmitButton'

interface Props {
  open: boolean
  onClose: () => void
  kind: 'hours' | 'payment'
  // Present when editing an existing entry
  initial?: { date: string; value: number; note: string; rate?: number }
  onSave: (date: string, value: number, note: string) => void
  onDelete?: () => void
}

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

export function LedgerEntrySheet({ open, onClose, kind, initial, onSave, onDelete }: Props) {
  const [date, setDate] = useState(todayISO())
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setDate(initial?.date ?? todayISO())
      setValue(initial ? String(initial.value) : '')
      setNote(initial?.note ?? '')
    }
  }, [open, initial])

  const parsed = Number(value)
  const valid = value.trim() !== '' && Number.isFinite(parsed) && parsed > 0 && !!date
  const isHours = kind === 'hours'
  const title = initial
    ? (isHours ? 'Edit Hours' : 'Edit Payment')
    : (isHours ? 'Log Hours' : 'Add Payment')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!valid) return
    onSave(date, parsed, note.trim())
    onClose()
  }

  function handleDelete() {
    onDelete?.()
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Date" required>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label={isHours ? 'Hours' : 'Amount ($)'} required>
          <input
            type="text"
            inputMode="decimal"
            placeholder={isHours ? 'e.g. 7.5' : 'e.g. 250'}
            value={value}
            onChange={e => setValue(e.target.value.replace(/[^\d.]/g, ''))}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Note">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            className={inputClass}
          />
        </Field>
        {isHours && initial?.rate !== undefined && (
          <p className="text-sm text-gray-400 -mt-1">Logged at {formatMoney(initial.rate)}/hr</p>
        )}
        <SubmitButton label={initial ? 'Save' : (isHours ? 'Log Hours' : 'Add Payment')} disabled={!valid} />
        {onDelete && <DeleteButton onDelete={handleDelete} />}
      </form>
    </BottomSheet>
  )
}

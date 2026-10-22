import { useId } from 'react'
import { FieldLabel } from './Field'

interface Props {
  value: string // YYYY-MM-DD, or '' for no due date
  onChange: (value: string) => void
}

export function DueDateField({ value, onChange }: Props) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id}><FieldLabel>Due date</FieldLabel></label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-sm font-medium text-blue-600">
            Clear
          </button>
        )}
      </div>
      <input
        id={id}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full min-h-[50px] px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

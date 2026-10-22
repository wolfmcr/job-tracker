import { FieldLabel } from './Field'

const OPTIONS = [
  { value: 0, label: 'None', color: '#6b7280' },
  { value: 1, label: 'Medium', color: '#f59e0b' },
  { value: 2, label: 'High', color: '#ef4444' },
]

interface Props {
  value: number
  onChange: (priority: number) => void
}

export function PriorityPicker({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Priority" className="flex flex-col gap-1.5">
      <FieldLabel>Priority</FieldLabel>
      <div className="flex gap-2">
        {OPTIONS.map(option => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors"
              style={selected
                ? { backgroundColor: option.color, color: '#fff', borderColor: option.color }
                : { backgroundColor: `${option.color}15`, color: option.color, borderColor: `${option.color}30` }
              }
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

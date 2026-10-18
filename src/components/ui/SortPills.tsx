interface Props {
  options: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}

export function SortPills({ options, active, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            active === option.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

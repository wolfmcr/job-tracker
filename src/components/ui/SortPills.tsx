import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

interface Props {
  options: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
  // When set, the active pill shows an arrow and tapping it again calls onToggleDirection
  direction?: 'asc' | 'desc'
  onToggleDirection?: () => void
}

export function SortPills({ options, active, onChange, direction, onToggleDirection }: Props) {
  return (
    // Scrolls sideways rather than clipping when the pills outgrow a narrow screen
    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
      {options.map(option => {
        const isActive = active === option.key
        const showArrow = isActive && direction && onToggleDirection
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => (isActive && onToggleDirection ? onToggleDirection() : onChange(option.key))}
            aria-label={showArrow ? `${option.label}, ${direction === 'asc' ? 'ascending' : 'descending'}` : undefined}
            className={`flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${
              isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {option.label}
            {showArrow && (direction === 'asc' ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />)}
          </button>
        )
      })}
    </div>
  )
}

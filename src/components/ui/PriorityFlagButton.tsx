interface Props {
  priority: number
  onSetPriority: (p: number) => void
}

function nextPriority(p: number) {
  if (p === 0) return 2
  if (p === 2) return 1
  return 0
}

function flagColor(p: number) {
  if (p === 2) return '#ef4444'
  if (p === 1) return '#f59e0b'
  return '#d1d5db'
}

export function PriorityFlagButton({ priority, onSetPriority }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSetPriority(nextPriority(priority))}
      className="p-2 shrink-0 active:opacity-60"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={priority > 0 ? flagColor(priority) : 'none'}
        stroke={flagColor(priority)}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    </button>
  )
}

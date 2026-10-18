interface Props {
  count: number
  show: boolean
  onToggle: () => void
}

export function ShowCompletedToggle({ count, show, onToggle }: Props) {
  if (count === 0) return null

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-4 py-3 text-sm text-gray-400 text-left border-t border-gray-100"
    >
      {show ? 'Hide completed' : `Show ${count} completed`}
    </button>
  )
}

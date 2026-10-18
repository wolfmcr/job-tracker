import { AsteriskIcon } from 'lucide-react'

interface Props {
  show: boolean
}

// Place inside a `relative` wrapper around a required input
export function RequiredMark({ show }: Props) {
  if (!show) return null

  return (
    <AsteriskIcon
      size={14}
      strokeWidth={2.5}
      aria-hidden
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
    />
  )
}

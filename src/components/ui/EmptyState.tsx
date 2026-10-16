import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  message: string
}

export function EmptyState({ icon, message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  )
}

import { CalendarIcon } from 'lucide-react'
import { describeDueDate } from '../../lib/format'

const TONE_CLASS = {
  overdue: 'text-red-600 font-medium',
  today: 'text-amber-600 font-medium',
  upcoming: 'text-gray-500',
}

interface Props {
  dueDate: string
  className?: string
}

export function DueDateLabel({ dueDate, className = '' }: Props) {
  const { label, tone } = describeDueDate(dueDate)
  return (
    <p className={`flex items-center gap-1 ${TONE_CLASS[tone]} ${className}`}>
      <CalendarIcon size={13} className="shrink-0" />
      {label}
    </p>
  )
}

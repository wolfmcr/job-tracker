interface Props {
  title: string
  action?: React.ReactNode
  color?: string
}

export function SectionHeader({ title, action, color }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-y border-gray-100">
      <p
        className="text-sm font-bold uppercase tracking-widest"
        style={{ color: color ?? '#6b7280' }}
      >
        {title}
      </p>
      {action}
    </div>
  )
}

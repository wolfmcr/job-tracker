interface Props {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-y border-gray-100">
      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      {action}
    </div>
  )
}

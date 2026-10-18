interface Props {
  title: string
  right?: React.ReactNode
}

export function ScreenHeader({ title, right }: Props) {
  return (
    <div className="px-4 pt-12 pb-2 flex items-baseline justify-between">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {right}
    </div>
  )
}

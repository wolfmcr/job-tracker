interface Props {
  name: string
  color: string
}

export function JobBadge({ name, color }: Props) {
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {name}
    </span>
  )
}

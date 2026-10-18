interface Props {
  label: string
  loadingLabel?: string
  loading?: boolean
  disabled?: boolean
  color?: string
}

export function SubmitButton({ label, loadingLabel, loading = false, disabled = false, color = '#111827' }: Props) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="w-full py-3 text-white font-semibold rounded-xl text-base disabled:opacity-50 active:opacity-80"
      style={{ backgroundColor: color }}
    >
      {loading && loadingLabel ? loadingLabel : label}
    </button>
  )
}

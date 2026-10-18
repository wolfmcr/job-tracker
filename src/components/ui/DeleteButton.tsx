interface Props {
  onDelete: () => void
}

export function DeleteButton({ onDelete }: Props) {
  return (
    <button
      type="button"
      onClick={onDelete}
      className="w-full py-3 text-red-500 font-semibold rounded-xl text-base border border-red-100 active:bg-red-50"
    >
      Delete
    </button>
  )
}

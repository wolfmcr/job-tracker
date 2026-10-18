import { useEffect, useState } from 'react'

interface Props {
  onDelete: () => void
}

export function DeleteButton({ onDelete }: Props) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  function handleClick() {
    if (confirming) onDelete()
    else setConfirming(true)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full py-3 font-semibold rounded-xl text-base border ${confirming ? 'bg-red-500 text-white border-red-500 active:bg-red-600' : 'text-red-500 border-red-100 active:bg-red-50'}`}
    >
      {confirming ? 'Tap again to delete' : 'Delete'}
    </button>
  )
}

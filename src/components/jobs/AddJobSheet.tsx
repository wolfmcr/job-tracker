import { useMutation } from '@tanstack/react-query'
import { XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { addJob } from '../../services/jobService'

interface Props {
  open: boolean
  onClose: () => void
}

export function AddJobSheet({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: ({ name, address }: { name: string; address: string }) =>
      addJob(name, address),
    onSuccess: () => {
      setName('')
      setAddress('')
      onClose()
    },
  })

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 100)
    else mutation.reset()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({ name: name.trim(), address: address.trim() })
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 shadow-xl animate-slide-up"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add Job</h2>
          <button type="button" onClick={onClose} className="text-gray-400 p-1 -mr-1">
            <XIcon size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={nameRef}
            type="text"
            placeholder="Job name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Address (optional)"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {mutation.isError && (
            <p className="text-red-600 text-sm text-center">Failed to add job. Try again.</p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl text-base disabled:opacity-50 mt-1 active:bg-blue-700"
          >
            {mutation.isPending ? 'Adding…' : 'Add Job'}
          </button>
        </form>
      </div>
    </>
  )
}

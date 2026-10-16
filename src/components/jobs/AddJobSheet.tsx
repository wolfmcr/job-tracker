import { useMutation } from '@tanstack/react-query'
import { XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import { addJob } from '../../services/jobService'

interface Props {
  open: boolean
  onClose: () => void
}

export function AddJobSheet({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [color, setColor] = useState(DEFAULT_JOB_COLOR)
  const nameRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: ({ name, address, color }: { name: string; address: string; color: string }) =>
      addJob(name, address, color),
    onSuccess: () => {
      setName('')
      setAddress('')
      setColor(DEFAULT_JOB_COLOR)
      onClose()
    },
  })

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 100)
    else mutation.reset()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({ name: name.trim(), address: address.trim(), color })
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 shadow-xl animate-slide-up"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add Job</h2>
          <button type="button" onClick={onClose} className="text-gray-400 p-1 -mr-1">
            <XIcon size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3 items-center">
            {/* Color picker — circle taps open native color wheel */}
            <button
              type="button"
              onClick={() => colorRef.current?.click()}
              className="w-12 h-12 rounded-full shrink-0 border-2 border-white shadow-md"
              style={{ backgroundColor: color }}
              aria-label="Pick color"
            />
            <input
              ref={colorRef}
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="sr-only"
            />
            <input
              ref={nameRef}
              type="text"
              placeholder="Job name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
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
            className="w-full py-3 text-white font-semibold rounded-xl text-base disabled:opacity-50 active:opacity-80"
            style={{ backgroundColor: color }}
          >
            {mutation.isPending ? 'Adding…' : 'Add Job'}
          </button>
        </form>
      </div>
    </>
  )
}

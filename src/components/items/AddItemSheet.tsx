import { useEffect, useRef, useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { RequiredMark } from '../ui/RequiredMark'
import { SubmitButton } from '../ui/SubmitButton'
import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import type { Job } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (text: string, qty?: string, jobId?: string) => Promise<void>
  title: string
  hasQty?: boolean
  placeholder?: string
  color?: string
  jobs?: Job[]
  defaultJobId?: string
}

export function AddItemSheet({ open, onClose, onAdd, title, hasQty = false, placeholder = 'Item', color = '#2563eb', jobs, defaultJobId }: Props) {
  const [text, setText] = useState('')
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>(defaultJobId ?? '')
  const textRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setQty('')
      setSelectedJobId(defaultJobId ?? jobs?.[0]?.id ?? '')
      setTimeout(() => textRef.current?.focus(), 80)
    }
  }, [open, defaultJobId, jobs])

  const selectedJob = jobs?.find(j => j.id === selectedJobId)
  const submitColor = selectedJob?.color || color

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim()) return
    if (jobs && !selectedJobId) return
    setSaving(true)
    await onAdd(text.trim(), qty.trim() || undefined, selectedJobId || undefined)
    setSaving(false)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {jobs && jobs.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">Job</p>
            <div className="flex flex-wrap gap-2">
              {jobs.map(job => {
                const jobColor = job.color || DEFAULT_JOB_COLOR
                const selected = selectedJobId === job.id
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
                    style={selected
                      ? { backgroundColor: jobColor, color: '#fff', borderColor: jobColor }
                      : { backgroundColor: `${jobColor}15`, color: jobColor, borderColor: `${jobColor}30` }
                    }
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-current opacity-70" />
                    {job.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {hasQty && (
          <input
            type="text"
            placeholder="Quantity (e.g. 3x, 1 bag)"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        <div className="relative">
          <input
            ref={textRef}
            type="text"
            placeholder={placeholder}
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <RequiredMark show={!text} />
        </div>
        <SubmitButton
          label="Add"
          loadingLabel="Adding…"
          loading={saving}
          disabled={saving || !text.trim() || (!!jobs && !selectedJobId)}
          color={submitColor}
        />
      </form>
    </BottomSheet>
  )
}

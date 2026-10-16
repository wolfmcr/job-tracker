import { CheckIcon } from 'lucide-react'
import type { Job } from '../../types'

interface Props {
  job: Job
  onToggleDone: (isDone: boolean) => void
  onTap: () => void
}

export function JobRow({ job, onToggleDone, onTap }: Props) {
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(job.address)}`

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 active:bg-gray-50 ${job.isDone ? 'opacity-50' : ''}`}
      onClick={onTap}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleDone(!job.isDone) }}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          job.isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
        }`}
      >
        {job.isDone && <CheckIcon size={14} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-900 truncate ${job.isDone ? 'line-through' : ''}`}>
          {job.name}
        </p>
        {job.address && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-blue-500 truncate block"
          >
            {job.address}
          </a>
        )}
      </div>
    </div>
  )
}

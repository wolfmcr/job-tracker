import { ChevronRightIcon, MapPinIcon } from 'lucide-react'
import type { Job } from '../../types'

interface Props {
  job: Job
  onTap: () => void
}

export function JobRow({ job, onTap }: Props) {
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(job.address)}`

  return (
    <div className="flex items-center border-b border-gray-100">
      {/* Job detail tap area */}
      <div
        className="flex-1 flex items-center gap-2 px-4 py-4 active:bg-gray-50 min-w-0"
        onClick={onTap}
      >
        <span className="font-medium text-gray-900 truncate">{job.name}</span>
        <ChevronRightIcon size={16} className="text-gray-300 shrink-0" />
      </div>

      {/* Maps button */}
      {job.address && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 mx-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 active:bg-blue-100"
          onClick={e => e.stopPropagation()}
        >
          <MapPinIcon size={15} />
          <span className="text-sm font-medium">Map</span>
        </a>
      )}
    </div>
  )
}

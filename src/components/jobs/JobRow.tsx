import { ChevronRightIcon, MapPinIcon } from 'lucide-react'
import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import type { Job } from '../../types'

interface Props {
  job: Job
  onTap: () => void
}

export function JobRow({ job, onTap }: Props) {
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(job.address)}`
  const color = job.color || DEFAULT_JOB_COLOR

  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-50" onClick={onTap}>
      {/* Color tag */}
      <div className="w-10 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-base">{job.name}</p>
        {job.address && (
          <p className="text-sm text-gray-400 truncate mt-0.5">{job.address}</p>
        )}
      </div>

      {/* Maps button */}
      {job.address && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl shrink-0 active:opacity-70"
          style={{ backgroundColor: `${color}25`, color }}
          onClick={e => e.stopPropagation()}
        >
          <MapPinIcon size={18} />
          <span className="text-xs font-medium">Map</span>
        </a>
      )}

      <ChevronRightIcon size={18} className="text-gray-300 shrink-0" />
    </div>
  )
}

import type { Job } from '../../types'

interface Props {
  job: Job
  onTap: () => void
}

export function JobRow({ job, onTap }: Props) {
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(job.address)}`

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 active:bg-gray-50"
      onClick={onTap}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{job.name}</p>
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

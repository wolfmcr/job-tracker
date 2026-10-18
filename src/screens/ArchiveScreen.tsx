import { useNavigate } from '@tanstack/react-router'
import { ArchiveIcon, ChevronRightIcon } from 'lucide-react'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { useArchivedJobs } from '../hooks/useArchivedJobs'

export function ArchiveScreen() {
  const { jobs, loading } = useArchivedJobs()
  const navigate = useNavigate()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <ScreenHeader title="Archive" />

      {jobs.length === 0 ? (
        <EmptyState icon={<ArchiveIcon size={40} />} message="No archived jobs." />
      ) : (
        <div>
          {jobs.map(job => (
            <div
              key={job.id}
              className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-50"
              onClick={() => navigate({ to: '/jobs/$jobId', params: { jobId: job.id } })}
            >
              <div
                className="w-10 h-10 rounded-full shrink-0 opacity-50"
                style={{ backgroundColor: job.color || DEFAULT_JOB_COLOR }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-500 truncate">{job.name}</p>
                {job.address && (
                  <p className="text-sm text-gray-400 truncate mt-0.5">{job.address}</p>
                )}
              </div>
              {job.isDone && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">Done</span>
              )}
              <ChevronRightIcon size={18} className="text-gray-300 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

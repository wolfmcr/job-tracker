import { useNavigate } from '@tanstack/react-router'
import { ArchiveIcon, BriefcaseIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { AddJobSheet } from '../components/jobs/AddJobSheet'
import { JobRow } from '../components/jobs/JobRow'
import { FAB } from '../components/ui/FAB'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { useJobs } from '../hooks/useJobs'

export function JobsScreen() {
  const { jobs, loading } = useJobs()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <>
      <ScreenHeader title="Jobs" />

      {jobs.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon size={40} />}
          message="No active jobs. Tap + to add one."
        />
      ) : (
        <div>
          {jobs.map(job => (
            <JobRow
              key={job.id}
              job={job}
              onTap={() => navigate({ to: '/jobs/$jobId', params: { jobId: job.id } })}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate({ to: '/archive' })}
        className="mx-4 mt-4 w-[calc(100%-2rem)] flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-left active:bg-gray-50"
      >
        <ArchiveIcon size={18} className="text-gray-400 shrink-0" />
        <span className="flex-1 text-sm font-medium text-gray-600">Archived jobs</span>
        <ChevronRightIcon size={16} className="text-gray-300 shrink-0" />
      </button>

      <p className="text-center text-xs text-gray-300 py-6">
        {__APP_VERSION__} · {new Date(__BUILD_TIME__).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </p>

      <FAB onClick={() => setSheetOpen(true)} color="#111827" label="Add job" />
      <AddJobSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}

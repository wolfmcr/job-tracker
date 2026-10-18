import { useNavigate } from '@tanstack/react-router'
import { BriefcaseIcon } from 'lucide-react'
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

      <FAB onClick={() => setSheetOpen(true)} color="#111827" label="Add job" />
      <AddJobSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}

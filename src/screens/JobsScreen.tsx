import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { BriefcaseIcon } from 'lucide-react'
import { useState } from 'react'
import { AddJobSheet } from '../components/jobs/AddJobSheet'
import { JobRow } from '../components/jobs/JobRow'
import { FAB } from '../components/ui/FAB'
import { EmptyState } from '../components/ui/EmptyState'
import { useJobs } from '../hooks/useJobs'
import { toggleJobDone } from '../services/jobService'

export function JobsScreen() {
  const { jobs, loading } = useJobs()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  const toggleDone = useMutation({
    mutationFn: ({ jobId, isDone }: { jobId: string; isDone: boolean }) =>
      toggleJobDone(jobId, isDone),
  })

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="px-4 pt-12 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
      </div>

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
              onToggleDone={(isDone) => toggleDone.mutate({ jobId: job.id, isDone })}
              onTap={() => navigate({ to: '/jobs/$jobId', params: { jobId: job.id } })}
            />
          ))}
        </div>
      )}

      <FAB onClick={() => setSheetOpen(true)} />
      <AddJobSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}

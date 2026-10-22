import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import type { Job } from '../../types'
import { FieldLabel } from './Field'

interface Props {
  jobs: Job[]
  value: string
  onChange: (jobId: string) => void
}

export function JobPicker({ jobs, value, onChange }: Props) {
  return (
    <div role="group" aria-label="Job" className="flex flex-col gap-1.5">
      <FieldLabel required>Job</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {jobs.map(job => {
          const jobColor = job.color || DEFAULT_JOB_COLOR
          const selected = value === job.id
          return (
            <button
              key={job.id}
              type="button"
              onClick={() => onChange(job.id)}
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
  )
}

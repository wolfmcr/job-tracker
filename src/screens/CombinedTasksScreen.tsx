import { CheckSquareIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddTaskSheet } from '../components/items/AddTaskSheet'
import { TaskRow } from '../components/items/TaskRow'
import { EmptyState } from '../components/ui/EmptyState'
import { FAB } from '../components/ui/FAB'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { ShowCompletedToggle } from '../components/ui/ShowCompletedToggle'
import { SortPills } from '../components/ui/SortPills'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { useCombinedTasks } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { DEFAULT_DIRECTION, SORT_OPTIONS, sortByCompleted, sortItems, type SortDirection, type SortKey } from '../lib/sortItems'
import { addTask, deleteTask, toggleTask, updateTask } from '../services/jobService'
import type { Task } from '../types'

export function CombinedTasksScreen() {
  const { jobs, loading: jobsLoading } = useJobs()
  const { items: rawItems, loading: itemsLoading } = useCombinedTasks()
  const [sort, setSort] = useState<SortKey>('job')
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_DIRECTION.job)
  const [showCompleted, setShowCompleted] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const jobMap = useMemo(() => new Map(jobs.map(j => [j.id, j])), [jobs])
  // Items from archived jobs stay in Firestore but don't belong on the active list
  const allItems = rawItems.filter(i => jobMap.has(i.jobId))
  const loading = jobsLoading || itemsLoading

  const jobName = (jobId: string) => jobMap.get(jobId)?.name ?? ''

  function changeSort(key: SortKey) {
    setSort(key)
    setDirection(DEFAULT_DIRECTION[key])
  }

  function renderRow(task: Task) {
    const job = jobMap.get(task.jobId)
    return (
      <TaskRow
        key={task.id}
        task={task}
        jobColor={job?.color || DEFAULT_JOB_COLOR}
        jobName={job?.name}
        onToggle={() => toggleTask(task.jobId, task.id, !task.isDone)}
        onDelete={() => deleteTask(task.jobId, task.id)}
        onUpdate={(fields) => updateTask(task.jobId, task.id, fields)}
      />
    )
  }

  const incomplete = sortItems(allItems.filter(i => !i.isDone), sort, direction, jobName)
  const completed = sortByCompleted(allItems.filter(i => i.isDone))

  return (
    <div className="pb-24">
      <ScreenHeader
        title="Tasks"
        right={incomplete.length > 0 ? <span className="text-sm text-gray-400">{incomplete.length} left</span> : undefined}
      />
      <div className="px-4 pb-3">
        <SortPills
          options={SORT_OPTIONS}
          active={sort}
          onChange={key => changeSort(key as SortKey)}
          direction={direction}
          onToggleDirection={() => setDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : allItems.length === 0 ? (
        <EmptyState icon={<CheckSquareIcon size={40} />} message="No tasks." />
      ) : (
        <>
          {incomplete.map(renderRow)}

          <ShowCompletedToggle
            count={completed.length}
            show={showCompleted}
            onToggle={() => setShowCompleted(v => !v)}
          />

          {showCompleted && completed.map(renderRow)}
        </>
      )}
      <FAB onClick={() => setAddOpen(true)} color="#111827" label="Add task" />
      <AddTaskSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addTask}
        jobs={jobs}
      />
    </div>
  )
}

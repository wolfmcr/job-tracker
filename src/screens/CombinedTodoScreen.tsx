import { CheckSquareIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddItemSheet } from '../components/items/AddItemSheet'
import { TodoItemRow } from '../components/items/TodoItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { FAB } from '../components/ui/FAB'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { ShowCompletedToggle } from '../components/ui/ShowCompletedToggle'
import { SortPills } from '../components/ui/SortPills'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { useCombinedTodoItems } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { addTodoItem, deleteTodoItem, setTodoItemPriority, toggleTodoItem, updateTodoItem } from '../services/jobService'
import type { TodoItem } from '../types'

type SortKey = 'priority' | 'job' | 'added'

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'priority', label: 'Priority' },
  { key: 'job', label: 'Job' },
  { key: 'added', label: 'Added' },
]

export function CombinedTodoScreen() {
  const { jobs } = useJobs()
  const { items: allItems, loading } = useCombinedTodoItems()
  const [sort, setSort] = useState<SortKey>('job')
  const [showCompleted, setShowCompleted] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const jobMap = useMemo(() => new Map(jobs.map(j => [j.id, j])), [jobs])

  function sortItems(items: TodoItem[]) {
    const sorted = [...items]
    if (sort === 'job') {
      sorted.sort((a, b) => {
        const nameA = jobMap.get(a.jobId)?.name ?? ''
        const nameB = jobMap.get(b.jobId)?.name ?? ''
        return nameA.localeCompare(nameB) || (b.priority ?? 0) - (a.priority ?? 0)
      })
    } else if (sort === 'added') {
      sorted.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
    } else {
      sorted.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.createdAt.toMillis() - b.createdAt.toMillis())
    }
    return sorted
  }

  const incomplete = sortItems(allItems.filter(i => !i.isDone))
  const completed = sortItems(allItems.filter(i => i.isDone))

  return (
    <div className="pb-24">
      <ScreenHeader
        title="To-Do"
        right={incomplete.length > 0 ? <span className="text-sm text-gray-400">{incomplete.length} left</span> : undefined}
      />
      <div className="px-4 pb-3">
        <SortPills options={SORT_OPTIONS} active={sort} onChange={key => setSort(key as SortKey)} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : allItems.length === 0 ? (
        <EmptyState icon={<CheckSquareIcon size={40} />} message="Nothing to do." />
      ) : (
        <>
          {incomplete.map(item => {
            const job = jobMap.get(item.jobId)
            const color = job?.color || DEFAULT_JOB_COLOR
            return (
              <TodoItemRow
                key={item.id}
                item={item}
                jobColor={color}
                jobName={job?.name}
                onToggle={() => toggleTodoItem(item.jobId, item.id, !item.isDone)}
                onDelete={() => deleteTodoItem(item.jobId, item.id)}
                onUpdate={(text, details) => updateTodoItem(item.jobId, item.id, text, details)}
                onSetPriority={(p) => setTodoItemPriority(item.jobId, item.id, p)}
              />
            )
          })}

          <ShowCompletedToggle
            count={completed.length}
            show={showCompleted}
            onToggle={() => setShowCompleted(v => !v)}
          />

          {showCompleted && completed.map(item => {
            const job = jobMap.get(item.jobId)
            const color = job?.color || DEFAULT_JOB_COLOR
            return (
              <TodoItemRow
                key={item.id}
                item={item}
                jobColor={color}
                jobName={job?.name}
                onToggle={() => toggleTodoItem(item.jobId, item.id, !item.isDone)}
                onDelete={() => deleteTodoItem(item.jobId, item.id)}
                onUpdate={(text, details) => updateTodoItem(item.jobId, item.id, text, details)}
                onSetPriority={(p) => setTodoItemPriority(item.jobId, item.id, p)}
              />
            )
          })}
        </>
      )}
      <FAB onClick={() => setAddOpen(true)} color="#111827" label="Add task" />
      <AddItemSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(text, _qty, jobId) => addTodoItem(jobId!, text)}
        title="Add Task"
        label="Task"
        jobs={jobs}
      />
    </div>
  )
}

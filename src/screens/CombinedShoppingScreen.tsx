import { ShoppingCartIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddItemSheet } from '../components/items/AddItemSheet'
import { ShoppingItemRow } from '../components/items/ShoppingItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { FAB } from '../components/ui/FAB'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { ShowCompletedToggle } from '../components/ui/ShowCompletedToggle'
import { SortPills } from '../components/ui/SortPills'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { useCombinedShoppingItems, useCombinedTasks } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { DEFAULT_DIRECTION, SORT_OPTIONS, sortItems, type SortDirection, type SortKey } from '../lib/sortItems'
import { addShoppingItem, deleteShoppingItem, setShoppingItemPriority, toggleShoppingItem, updateShoppingItem } from '../services/jobService'

export function CombinedShoppingScreen() {
  const { jobs, loading: jobsLoading } = useJobs()
  const { items: rawItems, loading: itemsLoading } = useCombinedShoppingItems()
  const { items: tasks } = useCombinedTasks()
  const [sort, setSort] = useState<SortKey>('job')
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_DIRECTION.job)
  const [showCompleted, setShowCompleted] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const jobMap = useMemo(() => new Map(jobs.map(j => [j.id, j])), [jobs])
  // Items from archived jobs stay in Firestore but don't belong on the active list
  const allItems = rawItems.filter(i => jobMap.has(i.jobId))
  const loading = jobsLoading || itemsLoading

  const jobName = (jobId: string) => jobMap.get(jobId)?.name ?? ''
  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t.text])), [tasks])
  const taskName = (taskId?: string) => (taskId ? taskMap.get(taskId) : undefined)

  function changeSort(key: SortKey) {
    setSort(key)
    setDirection(DEFAULT_DIRECTION[key])
  }

  const incomplete = sortItems(allItems.filter(i => !i.isGot), sort, direction, jobName)
  const completed = sortItems(allItems.filter(i => i.isGot), sort, direction, jobName)

  return (
    <div className="pb-24">
      <ScreenHeader
        title="Shopping"
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
        <EmptyState icon={<ShoppingCartIcon size={40} />} message="No shopping items." />
      ) : (
        <>
          {incomplete.map(item => {
            const job = jobMap.get(item.jobId)
            const color = job?.color || DEFAULT_JOB_COLOR
            return (
              <ShoppingItemRow
                key={item.id}
                item={item}
                taskName={taskName(item.taskId)}
                jobColor={color}
                jobName={job?.name}
                onToggle={() => toggleShoppingItem(item.jobId, item.id, !item.isGot)}
                onDelete={() => deleteShoppingItem(item.jobId, item.id)}
                onUpdate={(qty, name) => updateShoppingItem(item.jobId, item.id, qty, name)}
                onSetPriority={(p) => setShoppingItemPriority(item.jobId, item.id, p)}
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
              <ShoppingItemRow
                key={item.id}
                item={item}
                taskName={taskName(item.taskId)}
                jobColor={color}
                jobName={job?.name}
                onToggle={() => toggleShoppingItem(item.jobId, item.id, !item.isGot)}
                onDelete={() => deleteShoppingItem(item.jobId, item.id)}
                onUpdate={(qty, name) => updateShoppingItem(item.jobId, item.id, qty, name)}
                onSetPriority={(p) => setShoppingItemPriority(item.jobId, item.id, p)}
              />
            )
          })}
        </>
      )}
      <FAB onClick={() => setAddOpen(true)} color="#111827" label="Add item" />
      <AddItemSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(name, qty, jobId) => addShoppingItem(jobId!, qty ?? '', name)}
        title="Add Shopping Item"
        hasQty
        label="Item"
        jobs={jobs}
      />
    </div>
  )
}

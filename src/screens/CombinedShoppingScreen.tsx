import { ShoppingCartIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddItemSheet } from '../components/items/AddItemSheet'
import { ShoppingItemRow } from '../components/items/ShoppingItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { FAB } from '../components/ui/FAB'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { ShowCompletedToggle } from '../components/ui/ShowCompletedToggle'
import { SortPills } from '../components/ui/SortPills'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { useCombinedShoppingItems } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { addShoppingItem, deleteShoppingItem, setShoppingItemPriority, toggleShoppingItem, updateShoppingItem } from '../services/jobService'
import type { ShoppingItem } from '../types'

type SortKey = 'priority' | 'job' | 'added'

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'priority', label: 'Priority' },
  { key: 'job', label: 'Job' },
  { key: 'added', label: 'Added' },
]

export function CombinedShoppingScreen() {
  const { jobs } = useJobs()
  const allItems = useCombinedShoppingItems()
  const [sort, setSort] = useState<SortKey>('job')
  const [showCompleted, setShowCompleted] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const jobMap = useMemo(() => new Map(jobs.map(j => [j.id, j])), [jobs])

  function sortItems(items: ShoppingItem[]) {
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

  const incomplete = sortItems(allItems.filter(i => !i.isGot))
  const completed = sortItems(allItems.filter(i => i.isGot))

  return (
    <div className="pb-24">
      <ScreenHeader
        title="Shopping"
        right={incomplete.length > 0 ? <span className="text-sm text-gray-400">{incomplete.length} left</span> : undefined}
      />
      <div className="px-4 pb-3">
        <SortPills options={SORT_OPTIONS} active={sort} onChange={key => setSort(key as SortKey)} />
      </div>

      {allItems.length === 0 ? (
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
        placeholder="Item name…"
        jobs={jobs}
      />
    </div>
  )
}

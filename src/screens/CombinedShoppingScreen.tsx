import { ShoppingCartIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ShoppingItemRow } from '../components/items/ShoppingItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { useCombinedShoppingItems } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { deleteShoppingItem, setShoppingItemPriority, toggleShoppingItem, updateShoppingItem } from '../services/jobService'
import type { ShoppingItem } from '../types'

type SortKey = 'priority' | 'job' | 'added'

export function CombinedShoppingScreen() {
  const { jobs } = useJobs()
  const allItems = useCombinedShoppingItems()
  const [sort, setSort] = useState<SortKey>('priority')
  const [showCompleted, setShowCompleted] = useState(false)

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
    <div>
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Shopping</h1>
          {incomplete.length > 0 && (
            <span className="text-sm text-gray-400">{incomplete.length} left</span>
          )}
        </div>
        <div className="flex gap-2">
          {(['priority', 'job', 'added'] as SortKey[]).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sort === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {key === 'priority' ? 'Priority' : key === 'job' ? 'Job' : 'Added'}
            </button>
          ))}
        </div>
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

          {completed.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCompleted(v => !v)}
              className="w-full px-4 py-3 text-sm text-gray-400 text-left border-t border-gray-100"
            >
              {showCompleted ? 'Hide completed' : `Show ${completed.length} completed`}
            </button>
          )}

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
    </div>
  )
}

import { ShoppingCartIcon } from 'lucide-react'
import { ShoppingItemRow } from '../components/items/ShoppingItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { useCombinedShoppingItems } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { deleteShoppingItem, toggleShoppingItem, updateShoppingItem } from '../services/jobService'

export function CombinedShoppingScreen() {
  const { jobs } = useJobs()
  const allItems = useCombinedShoppingItems()

  const grouped = jobs
    .map(job => ({
      job,
      items: [...allItems.filter(i => i.jobId === job.id)]
        .sort((a, b) => Number(a.isGot) - Number(b.isGot)),
    }))
    .filter(g => g.items.length > 0)

  const totalRemaining = allItems.filter(i => !i.isGot).length

  return (
    <div>
      <div className="px-4 pt-12 pb-2 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shopping</h1>
        {totalRemaining > 0 && (
          <span className="text-sm text-gray-400">{totalRemaining} left</span>
        )}
      </div>

      {grouped.length === 0 ? (
        <EmptyState icon={<ShoppingCartIcon size={40} />} message="No shopping items." />
      ) : (
        grouped.map(({ job, items }) => {
          const color = job.color || DEFAULT_JOB_COLOR
          const remaining = items.filter(i => !i.isGot).length
          return (
          <div key={job.id} className="mt-4">
            <div className="px-4 py-2 flex items-center gap-2 bg-gray-50 border-y border-gray-100">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{job.name}</span>
              {remaining > 0 && (
                <span className="ml-auto text-xs text-gray-400">{remaining} left</span>
              )}
            </div>
            {items.map(item => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleShoppingItem(job.id, item.id, !item.isGot)}
                onDelete={() => deleteShoppingItem(job.id, item.id)}
                onUpdate={(qty, name) => updateShoppingItem(job.id, item.id, qty, name)}
              />
            ))}
          </div>
          )
        })
      )}
    </div>
  )
}

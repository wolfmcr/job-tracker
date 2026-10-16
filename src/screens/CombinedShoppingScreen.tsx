import { ShoppingCartIcon } from 'lucide-react'
import { ShoppingItemRow } from '../components/items/ShoppingItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { useCombinedShoppingItems } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { deleteShoppingItem, toggleShoppingItem } from '../services/jobService'

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
        grouped.map(({ job, items }) => (
          <div key={job.id} className="mt-4">
            <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-y border-gray-100">
              {job.name}
            </p>
            {items.map(item => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleShoppingItem(job.id, item.id, !item.isGot)}
                onDelete={() => deleteShoppingItem(job.id, item.id)}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

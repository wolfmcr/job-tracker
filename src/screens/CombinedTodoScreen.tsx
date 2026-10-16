import { CheckSquareIcon } from 'lucide-react'
import { TodoItemRow } from '../components/items/TodoItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { useCombinedTodoItems } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { deleteTodoItem, toggleTodoItem, updateTodoItem } from '../services/jobService'

export function CombinedTodoScreen() {
  const { jobs } = useJobs()
  const allItems = useCombinedTodoItems()

  const grouped = jobs
    .map(job => ({
      job,
      items: [...allItems.filter(i => i.jobId === job.id)]
        .sort((a, b) => Number(a.isDone) - Number(b.isDone)),
    }))
    .filter(g => g.items.length > 0)

  const totalRemaining = allItems.filter(i => !i.isDone).length

  return (
    <div>
      <div className="px-4 pt-12 pb-2 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900">To-Do</h1>
        {totalRemaining > 0 && (
          <span className="text-sm text-gray-400">{totalRemaining} left</span>
        )}
      </div>

      {grouped.length === 0 ? (
        <EmptyState icon={<CheckSquareIcon size={40} />} message="Nothing to do." />
      ) : (
        grouped.map(({ job, items }) => (
          <div key={job.id} className="mt-4">
            <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-y border-gray-100">
              {job.name}
            </p>
            {items.map(item => (
              <TodoItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleTodoItem(job.id, item.id, !item.isDone)}
                onDelete={() => deleteTodoItem(job.id, item.id)}
                onUpdate={(text) => updateTodoItem(job.id, item.id, text)}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

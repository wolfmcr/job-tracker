import { CheckSquareIcon } from 'lucide-react'
import { TodoItemRow } from '../components/items/TodoItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
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
        grouped.map(({ job, items }) => {
          const color = job.color || DEFAULT_JOB_COLOR
          const remaining = items.filter(i => !i.isDone).length
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
                <TodoItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleTodoItem(job.id, item.id, !item.isDone)}
                  onDelete={() => deleteTodoItem(job.id, item.id)}
                  onUpdate={(text) => updateTodoItem(job.id, item.id, text)}
                />
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}

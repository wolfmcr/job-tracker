import { CheckSquareIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TodoItemRow } from '../components/items/TodoItemRow'
import { EmptyState } from '../components/ui/EmptyState'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { useCombinedTodoItems } from '../hooks/useCombinedItems'
import { useJobs } from '../hooks/useJobs'
import { deleteTodoItem, setTodoItemPriority, toggleTodoItem, updateTodoItem } from '../services/jobService'
import type { TodoItem } from '../types'

type SortKey = 'priority' | 'job' | 'added'

export function CombinedTodoScreen() {
  const { jobs } = useJobs()
  const allItems = useCombinedTodoItems()
  const [sort, setSort] = useState<SortKey>('priority')
  const [showCompleted, setShowCompleted] = useState(false)

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
    <div>
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">To-Do</h1>
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
                onUpdate={(text) => updateTodoItem(item.jobId, item.id, text)}
                onSetPriority={(p) => setTodoItemPriority(item.jobId, item.id, p)}
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
              <TodoItemRow
                key={item.id}
                item={item}
                jobColor={color}
                jobName={job?.name}
                onToggle={() => toggleTodoItem(item.jobId, item.id, !item.isDone)}
                onDelete={() => deleteTodoItem(item.jobId, item.id)}
                onUpdate={(text) => updateTodoItem(item.jobId, item.id, text)}
                onSetPriority={(p) => setTodoItemPriority(item.jobId, item.id, p)}
              />
            )
          })}
        </>
      )}
    </div>
  )
}

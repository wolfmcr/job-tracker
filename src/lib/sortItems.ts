import type { Timestamp } from 'firebase/firestore'

export type SortKey = 'priority' | 'job' | 'added' | 'due'
export type SortDirection = 'asc' | 'desc'

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'job', label: 'Job' },
  { key: 'priority', label: 'Priority' },
  { key: 'added', label: 'Added' },
]

export const TASK_SORT_OPTIONS: { key: SortKey; label: string }[] = [
  ...SORT_OPTIONS,
  { key: 'due', label: 'Due' },
]

// Direction a sort starts in when its pill is picked: high priority first, jobs A–Z, oldest first, soonest due first
export const DEFAULT_DIRECTION: Record<SortKey, SortDirection> = {
  priority: 'desc',
  job: 'asc',
  added: 'asc',
  due: 'asc',
}

interface Sortable {
  jobId: string
  priority?: number
  dueDate?: string
  createdAt: Timestamp | null
}

// Pending server timestamps are null until the write lands; treat them as newest
export function createdMillis(item: { createdAt: Timestamp | null }) {
  return item.createdAt?.toMillis() ?? Infinity
}

// Direction flips the chosen key only; ties fall back to high priority first, then oldest first.
// Items with no due date stay at the bottom of the Due sort in either direction.
export function sortItems<T extends Sortable>(items: T[], key: SortKey, direction: SortDirection, jobName: (jobId: string) => string) {
  const dir = direction === 'asc' ? 1 : -1
  const byPriority = (a: T, b: T) => (b.priority ?? 0) - (a.priority ?? 0)
  const byAdded = (a: T, b: T) => createdMillis(a) - createdMillis(b)

  return [...items].sort((a, b) => {
    if (key === 'job') return dir * jobName(a.jobId).localeCompare(jobName(b.jobId)) || byPriority(a, b) || byAdded(a, b)
    if (key === 'added') return dir * byAdded(a, b)
    if (key === 'due') {
      if (!a.dueDate || !b.dueDate) return Number(!a.dueDate) - Number(!b.dueDate) || byPriority(a, b) || byAdded(a, b)
      return dir * a.dueDate.localeCompare(b.dueDate) || byPriority(a, b) || byAdded(a, b)
    }
    return -dir * byPriority(a, b) || byAdded(a, b)
  })
}

// Missing (done before completedAt existed) sorts as oldest; null (pending write) as newest
function completedMillis(item: { completedAt?: Timestamp | null }) {
  if (item.completedAt === undefined) return 0
  return item.completedAt?.toMillis() ?? Infinity
}

// Completed tasks: most recently finished first
export function sortByCompleted<T extends { completedAt?: Timestamp | null; createdAt: Timestamp | null }>(items: T[]) {
  return [...items].sort((a, b) => completedMillis(b) - completedMillis(a) || createdMillis(b) - createdMillis(a))
}

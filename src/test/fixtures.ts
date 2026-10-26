import type { Job, ShoppingItem, Task } from '../types'
import { ts } from './timestamp'

export function makeJob(fields: Partial<Job> = {}): Job {
  return { id: 'job-1', name: 'Alder St', address: '', isDone: false, isArchived: false, createdAt: ts(0), updatedAt: ts(0), ...fields }
}

export function makeTask(fields: Partial<Task> = {}): Task {
  return { id: 'task-1', jobId: 'job-1', text: 'Paint door', isDone: false, createdAt: ts(0), ...fields }
}

export function makeShoppingItem(fields: Partial<ShoppingItem> = {}): ShoppingItem {
  return { id: 'item-1', jobId: 'job-1', qty: '', name: 'Paint', isGot: false, createdAt: ts(0), ...fields }
}

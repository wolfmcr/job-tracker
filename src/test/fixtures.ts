import type { Job, Receipt, ShoppingItem, Task } from '../types'
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

export function makeReceipt(fields: Partial<Receipt> = {}): Receipt {
  const items = fields.items ?? [{ name: 'Studs', amount: 60, jobId: 'job-1' }]
  return {
    id: 'receipt-1',
    store: 'Hardware Co',
    date: '2026-10-29',
    tax: 0,
    total: 60,
    note: '',
    createdAt: ts(0),
    ...fields,
    items,
    jobIds: [...new Set(items.map(i => i.jobId).filter((id): id is string => id !== null))],
  }
}

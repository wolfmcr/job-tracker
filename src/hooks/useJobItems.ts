import { collection, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ShoppingItem, Task } from '../types'
import { useLiveQuery, withJobId } from './useLive'

export function useShoppingItems(jobId: string) {
  return useLiveQuery(
    `shoppingItems:${jobId}`,
    () => query(collection(db, 'jobs', jobId, 'shoppingItems'), orderBy('createdAt', 'asc')),
    withJobId<ShoppingItem>,
  )
}

export function useTasks(jobId: string) {
  return useLiveQuery(
    `tasks:${jobId}`,
    () => query(collection(db, 'jobs', jobId, 'tasks'), orderBy('createdAt', 'asc')),
    withJobId<Task>,
  )
}

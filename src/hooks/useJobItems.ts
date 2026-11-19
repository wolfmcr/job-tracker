import { orderBy, query, where } from 'firebase/firestore'
import { bizCollection } from '../lib/business'
import type { ShoppingItem, Task } from '../types'
import { useLiveQuery, withId } from './useLive'

export function useShoppingItems(jobId: string) {
  return useLiveQuery(
    `shoppingItems:${jobId}`,
    () => query(bizCollection('shoppingItems'), where('jobId', '==', jobId), orderBy('createdAt', 'asc')),
    withId<ShoppingItem>,
  )
}

export function useTasks(jobId: string) {
  return useLiveQuery(
    `tasks:${jobId}`,
    () => query(bizCollection('tasks'), where('jobId', '==', jobId), orderBy('createdAt', 'asc')),
    withId<Task>,
  )
}

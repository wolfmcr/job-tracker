import { orderBy, query } from 'firebase/firestore'
import { bizCollection } from '../lib/business'
import type { ShoppingItem, Task } from '../types'
import { useLiveQuery, withId } from './useLive'

// Everything across all of the business's jobs, for the Shopping and Tasks tabs
export function useCombinedShoppingItems() {
  return useLiveQuery('shoppingItems:all', () => query(bizCollection('shoppingItems'), orderBy('createdAt', 'asc')), withId<ShoppingItem>)
}

export function useCombinedTasks() {
  return useLiveQuery('tasks:all', () => query(bizCollection('tasks'), orderBy('createdAt', 'asc')), withId<Task>)
}

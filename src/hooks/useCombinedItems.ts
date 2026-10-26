import { collectionGroup, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ShoppingItem, Task } from '../types'
import { useLiveQuery, withJobId } from './useLive'

// Everything across all jobs, for the Shopping and Tasks tabs
export function useCombinedShoppingItems() {
  return useLiveQuery('shoppingItems:all', () => query(collectionGroup(db, 'shoppingItems'), orderBy('createdAt', 'asc')), withJobId<ShoppingItem>)
}

export function useCombinedTasks() {
  return useLiveQuery('tasks:all', () => query(collectionGroup(db, 'tasks'), orderBy('createdAt', 'asc')), withJobId<Task>)
}

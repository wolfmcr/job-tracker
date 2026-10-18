import { collectionGroup, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { ShoppingItem, TodoItem } from '../types'

const RETRY_MS = 2000

// Listens to a subcollection across all jobs. Stays `loading` until the server
// has answered (an empty local cache isn't treated as "no items"), and
// resubscribes if the listener errors instead of silently going empty.
function useCollectionGroup<T>(name: 'shoppingItems' | 'todoItems') {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = () => {}
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    function subscribe() {
      const q = query(collectionGroup(db, name), orderBy('createdAt', 'asc'))
      unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snap) => {
          setItems(snap.docs.map(doc => {
            const jobId = doc.ref.path.split('/')[1]
            return { id: doc.id, jobId, ...doc.data() } as T
          }))
          if (!snap.metadata.fromCache || snap.docs.length > 0) setLoading(false)
        },
        (error) => {
          console.error(`[${name}] listener failed, retrying`, error)
          retryTimer = setTimeout(subscribe, RETRY_MS)
        },
      )
    }

    subscribe()
    return () => {
      clearTimeout(retryTimer)
      unsubscribe()
    }
  }, [name])

  return { items, loading }
}

export function useCombinedShoppingItems() {
  return useCollectionGroup<ShoppingItem>('shoppingItems')
}

export function useCombinedTodoItems() {
  return useCollectionGroup<TodoItem>('todoItems')
}

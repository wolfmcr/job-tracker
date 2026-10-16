import { collectionGroup, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { ShoppingItem, TodoItem } from '../types'

export function useCombinedShoppingItems() {
  const [items, setItems] = useState<ShoppingItem[]>([])

  useEffect(() => {
    const q = query(collectionGroup(db, 'shoppingItems'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => {
        const jobId = doc.ref.path.split('/')[1]
        return { id: doc.id, jobId, ...doc.data() } as ShoppingItem
      }))
    })
  }, [])

  return items
}

export function useCombinedTodoItems() {
  const [items, setItems] = useState<TodoItem[]>([])

  useEffect(() => {
    const q = query(collectionGroup(db, 'todoItems'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => {
        const jobId = doc.ref.path.split('/')[1]
        return { id: doc.id, jobId, ...doc.data() } as TodoItem
      }))
    })
  }, [])

  return items
}

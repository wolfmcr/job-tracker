import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { ShoppingItem, TodoItem } from '../types'

export function useShoppingItems(jobId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'jobs', jobId, 'shoppingItems'),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, jobId, ...doc.data() }) as ShoppingItem))
      setLoading(false)
    })
  }, [jobId])

  return { items, loading }
}

export function useTodoItems(jobId: string) {
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'jobs', jobId, 'todoItems'),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, jobId, ...doc.data() }) as TodoItem))
      setLoading(false)
    })
  }, [jobId])

  return { items, loading }
}

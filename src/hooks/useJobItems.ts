import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { ShoppingItem, Task } from '../types'

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

export function useTasks(jobId: string) {
  const [items, setItems] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'jobs', jobId, 'tasks'),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, jobId, ...doc.data() }) as Task))
      setLoading(false)
    })
  }, [jobId])

  return { items, loading }
}

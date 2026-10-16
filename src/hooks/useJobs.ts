import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Job } from '../types'

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(q, (snap) => {
      setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Job))
      setLoading(false)
    })
  }, [])

  return { jobs, loading }
}

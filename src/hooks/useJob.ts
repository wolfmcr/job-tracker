import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Job } from '../types'

export function useJob(jobId: string) {
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    return onSnapshot(doc(db, 'jobs', jobId), (snap) => {
      setJob(snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null)
    })
  }, [jobId])

  return job
}

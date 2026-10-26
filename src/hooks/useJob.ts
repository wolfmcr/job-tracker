import { doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Job } from '../types'
import { useLiveDoc, withId } from './useLive'

// job is null while loading and when the job doesn't exist
export function useJob(jobId: string) {
  const { value, loading } = useLiveDoc(`job:${jobId}`, () => doc(db, 'jobs', jobId), withId<Job>)
  return { job: value, loading }
}

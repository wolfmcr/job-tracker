import { orderBy, query, where } from 'firebase/firestore'
import { bizCollection } from '../lib/business'
import type { Job } from '../types'
import { useLiveQuery, withId } from './useLive'

function useJobList(archived: boolean) {
  const { items, loading } = useLiveQuery(
    archived ? 'jobs:archived' : 'jobs:active',
    () => query(bizCollection('jobs'), where('isArchived', '==', archived), orderBy('createdAt', 'desc')),
    withId<Job>,
  )
  return { jobs: items, loading }
}

export function useJobs() {
  return useJobList(false)
}

export function useArchivedJobs() {
  return useJobList(true)
}

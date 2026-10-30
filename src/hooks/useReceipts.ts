import { collection, orderBy, query, where } from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { db, storage } from '../lib/firebase'
import type { Receipt } from '../types'
import { useLiveQuery, withId } from './useLive'

export function useReceipts() {
  const { items, loading } = useLiveQuery(
    'receipts',
    () => query(collection(db, 'receipts'), orderBy('date', 'desc')),
    withId<Receipt>,
  )
  return { receipts: items, loading }
}

// Receipts with at least one line tagged to this job
export function useJobReceipts(jobId: string) {
  const { items, loading } = useLiveQuery(
    `receipts:${jobId}`,
    () => query(collection(db, 'receipts'), where('jobIds', 'array-contains', jobId), orderBy('date', 'desc')),
    withId<Receipt>,
  )
  return { receipts: items, loading }
}

// Download URL for a receipt photo; null while loading or if it can't be fetched
export function useReceiptPhoto(path: string | undefined) {
  const [state, setState] = useState<{ path: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!path) return
    let current = true
    getDownloadURL(ref(storage, path)).then(
      url => { if (current) setState({ path, url }) },
      error => {
        console.error('[receipts] photo not loaded', error)
        if (current) setState({ path, url: null })
      },
    )
    return () => { current = false }
  }, [path])

  return state && state.path === path ? state.url : null
}

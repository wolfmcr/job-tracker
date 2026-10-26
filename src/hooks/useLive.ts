import {
  onSnapshot,
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { showToast } from '../lib/toast'

export const RETRY_MS = [2_000, 5_000, 15_000, 30_000]
export const LOAD_FAILED = 'Couldn’t load the latest data. Retrying…'

type Listen<T> = (onValue: (value: T, settled: boolean) => void, onError: (error: FirestoreError) => void) => () => void

const NONE: never[] = []

// Shared plumbing for every live listener. `key` names what's being listened to (null = nothing yet);
// a new key starts loading again rather than showing the previous key's data. Stays loading until the
// server has answered, so an empty cache isn't mistaken for "no data". If the listener errors it
// resubscribes with backoff instead of silently going empty, and tells the user once.
function useLive<T>(key: string | null, listen: Listen<T>, empty: T) {
  const [state, setState] = useState<{ key: string; value: T; loading: boolean } | null>(null)

  useEffect(() => {
    if (key === null) return
    let unsubscribe = () => {}
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let failures = 0

    function subscribe() {
      unsubscribe = listen(
        (value, settled) => {
          failures = 0
          setState(prev => ({ key: key!, value, loading: !settled && !(prev?.key === key && !prev.loading) }))
        },
        (error) => {
          console.error(`[${key}] listener failed, retrying`, error)
          if (failures === 0) showToast(LOAD_FAILED)
          retryTimer = setTimeout(subscribe, RETRY_MS[Math.min(failures, RETRY_MS.length - 1)])
          failures++
        },
      )
    }

    subscribe()
    return () => {
      clearTimeout(retryTimer)
      unsubscribe()
    }
    // `listen` is rebuilt each render but only depends on what `key` names
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  if (key === null) return { value: empty, loading: false }
  if (state?.key !== key) return { value: empty, loading: true }
  return { value: state.value, loading: state.loading }
}

export function useLiveQuery<T>(key: string | null, makeQuery: () => Query, toItem: (doc: QueryDocumentSnapshot) => T) {
  const { value, loading } = useLive<T[]>(
    key,
    (onValue, onError) => onSnapshot(
      makeQuery(),
      { includeMetadataChanges: true },
      snap => onValue(snap.docs.map(toItem), !snap.metadata.fromCache || snap.docs.length > 0),
      onError,
    ),
    NONE,
  )
  return { items: value, loading }
}

export function useLiveDoc<T>(key: string | null, makeRef: () => DocumentReference, toValue: (doc: DocumentSnapshot) => T) {
  const { value, loading } = useLive<T | null>(
    key,
    (onValue, onError) => onSnapshot(
      makeRef(),
      { includeMetadataChanges: true },
      snap => onValue(snap.exists() ? toValue(snap) : null, !snap.metadata.fromCache || snap.exists()),
      onError,
    ),
    null,
  )
  return { value, loading }
}

export function withId<T>(doc: DocumentSnapshot) {
  return { id: doc.id, ...doc.data() } as T
}

// For docs in jobs/{jobId}/…: adds the parent job's id
export function withJobId<T>(doc: DocumentSnapshot) {
  return { id: doc.id, jobId: doc.ref.parent.parent!.id, ...doc.data() } as T
}

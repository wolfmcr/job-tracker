import { collection, getDocs, limit, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'

// Whether the signed-in account is on the allow-list in firestore.rules, found out with one small
// read. Counts as allowed until the answer comes back, so the app doesn't wait on it, and only a
// definite "permission denied" counts as no: any other failure (a slow network) leaves the app up,
// where the live listeners retry and say so.
export function useAccess(uid: string) {
  const [denied, setDenied] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    getDocs(query(collection(db, 'jobs'), limit(1))).catch((error: unknown) => {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
      if (current && code === 'permission-denied') setDenied(uid)
    })
    return () => { current = false }
  }, [uid])

  return denied !== uid
}

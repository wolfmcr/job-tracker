import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { setBusiness, type Business } from '../lib/business'
import { db } from '../lib/firebase'
import { showToast } from '../lib/toast'
import { LOAD_FAILED, RETRY_MS } from './useLive'

export type BusinessState =
  | { status: 'loading' }
  | { status: 'ready'; business: Business }
  | { status: 'no-access' }

function errorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error ? error.code : undefined
}

// Finds the signed-in account's business (users/{uid} → businesses/{id}) and sets it for the
// rest of the app, which only renders once it's ready. No user doc, no business, or a definite
// "permission denied" (a removed member) means no access; anything else, like a slow connection,
// is retried with the same backoff as the live listeners.
export function useBusiness(uid: string) {
  const [state, setState] = useState<{ uid: string; value: BusinessState } | null>(null)

  useEffect(() => {
    let current = true
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let failures = 0
    const finish = (value: BusinessState) => { if (current) setState({ uid, value }) }

    async function load() {
      try {
        const user = await getDoc(doc(db, 'users', uid))
        const businessId: unknown = user.data()?.businessId
        if (typeof businessId !== 'string') return finish({ status: 'no-access' })
        const snapshot = await getDoc(doc(db, 'businesses', businessId))
        const name: unknown = snapshot.data()?.name
        if (!snapshot.exists()) return finish({ status: 'no-access' })
        const business = { id: businessId, name: typeof name === 'string' ? name : '' }
        if (!current) return
        setBusiness(business)
        finish({ status: 'ready', business })
      } catch (error) {
        if (errorCode(error) === 'permission-denied') return finish({ status: 'no-access' })
        console.error('[business] couldn’t load, retrying', error)
        if (failures === 0) showToast(LOAD_FAILED)
        retryTimer = setTimeout(load, RETRY_MS[Math.min(failures, RETRY_MS.length - 1)])
        failures++
      }
    }

    load()
    return () => {
      current = false
      clearTimeout(retryTimer)
    }
  }, [uid])

  return state?.uid === uid ? state.value : { status: 'loading' as const }
}

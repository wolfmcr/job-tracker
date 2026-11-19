import { collection, doc } from 'firebase/firestore'
import { db } from './firebase'

export interface Business {
  id: string
  name: string
}

// The signed-in account's business. Every account belongs to exactly one (scripts/admin.mjs makes
// sure of that), so it's set once after sign-in by useBusiness, before any screen renders, and
// never changes: signing out reloads the page.
let current: Business | null = null

export function setBusiness(business: Business) {
  current = business
}

export function currentBusiness(): Business {
  if (!current) throw new Error('No business yet: data was asked for before useBusiness finished')
  return current
}

// All of a business's data lives under businesses/{id}, which is what the rules check membership against
export function bizCollection(path: string, ...pathSegments: string[]) {
  return collection(db, 'businesses', currentBusiness().id, path, ...pathSegments)
}

export function bizDoc(path: string, ...pathSegments: string[]) {
  return doc(db, 'businesses', currentBusiness().id, path, ...pathSegments)
}

// Storage path of a receipt's photo; storage.rules checks membership of the business in it
export function receiptPhotoPath(receiptId: string) {
  return `businesses/${currentBusiness().id}/receipts/${receiptId}.jpg`
}

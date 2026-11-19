import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { PROJECT_ID, STORAGE_PORT } from './rulesEnv'

// A member of the test business, so the app's own writes are checked against the real rules
export const OWNER_UID = 'Eim2A7s7g7Rntq7X2oWd3jRdMbg1'
export const BUSINESS_ID = 'biz-a'
export const BIZ = `businesses/${BUSINESS_ID}`

const FIRESTORE = `http://127.0.0.1:8088/v1/projects/${PROJECT_ID}/databases/(default)/documents`

// Same Firestore API the app uses, pointed at the emulator and signed in as the member
export function createEmulatorDb() {
  const app = initializeApp({ projectId: PROJECT_ID, storageBucket: `${PROJECT_ID}.appspot.com` }, 'emulator-tests')
  const db = getFirestore(app)
  connectFirestoreEmulator(db, '127.0.0.1', 8088, { mockUserToken: { sub: OWNER_UID } })
  const storage = getStorage(app)
  connectStorageEmulator(storage, '127.0.0.1', STORAGE_PORT, { mockUserToken: { sub: OWNER_UID } })
  return { db, storage }
}

// Writes past the rules, the way scripts/admin.mjs does in a real project ("Bearer owner" is the emulator's admin)
async function adminWrite(path: string, fields: Record<string, string>) {
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { stringValue: value }])) }
  const res = await fetch(`${FIRESTORE}/${path}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Couldn’t seed ${path}: ${await res.text()}`)
}

// Empties the emulator, leaving only the test business with OWNER_UID as its member
export async function resetEmulator() {
  await fetch(`http://127.0.0.1:8088/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' })
  await adminWrite(BIZ, { name: 'Alder Builders' })
  await adminWrite(`${BIZ}/members/${OWNER_UID}`, { email: 'owner@example.test' })
  await adminWrite(`users/${OWNER_UID}`, { businessId: BUSINESS_ID })
}

import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { PROJECT_ID } from './rulesEnv'

// Must be on the allowlist in firestore.rules, so the app's own writes are checked against the rules
export const OWNER_UID = 'Eim2A7s7g7Rntq7X2oWd3jRdMbg1'

// Same Firestore API the app uses, pointed at the emulator and signed in as the owner
export function createEmulatorDb() {
  const db = getFirestore(initializeApp({ projectId: PROJECT_ID }, 'emulator-tests'))
  connectFirestoreEmulator(db, '127.0.0.1', 8080, { mockUserToken: { sub: OWNER_UID } })
  return db
}

export async function clearEmulator() {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' })
}

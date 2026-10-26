import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { PROJECT_ID } from './rulesEnv'

export const TEST_UID = 'test-user'

// Same Firestore API the app uses, pointed at the emulator and signed in as TEST_UID
export function createEmulatorDb() {
  const db = getFirestore(initializeApp({ projectId: PROJECT_ID }, 'emulator-tests'))
  connectFirestoreEmulator(db, '127.0.0.1', 8080, { mockUserToken: { sub: TEST_UID } })
  return db
}

export async function clearEmulator() {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' })
}

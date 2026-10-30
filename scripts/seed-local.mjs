// Seeds the local emulators for `npm run dev:local`: a test login with the owner's UID
// (so the real rules apply) and a few jobs and receipts to look at.
// Local-only test account; it doesn't exist anywhere else.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

const PROJECT_ID = 'demo-job-tracker'
const OWNER_UID = 'Eim2A7s7g7Rntq7X2oWd3jRdMbg1'
export const TEST_EMAIL = 'test@example.test'
export const TEST_PASSWORD = 'local-test-only'

const res = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
  body: JSON.stringify({ localId: OWNER_UID, email: TEST_EMAIL, password: TEST_PASSWORD }),
})
if (!res.ok) throw new Error(`Couldn't create the test login: ${await res.text()}`)

const env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { host: '127.0.0.1', port: 8080 } })
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore()
  const job = (name, color) => ({ name, address: '', color, isDone: false, isArchived: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await setDoc(doc(db, 'jobs/alder'), job('Alder St', '#2563eb'))
  await setDoc(doc(db, 'jobs/oak'), job('Oak Ave', '#16a34a'))
  await setDoc(doc(db, 'jobs/shop'), job('The Shop', '#9333ea'))
  await setDoc(doc(db, 'receipts/seed1'), {
    store: 'Home Depot',
    date: '2026-10-29',
    tax: 8,
    total: 108,
    items: [
      { name: '2x4 studs (10)', amount: 60, jobId: 'alder' },
      { name: 'Drywall screws', amount: 25, jobId: 'alder' },
      { name: 'Paint roller', amount: 15, jobId: 'oak' },
    ],
    jobIds: ['alder', 'oak'],
    note: '',
    createdAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'receipts/seed2'), {
    store: 'Lowe’s',
    date: '2026-09-14',
    tax: 1.6,
    total: 21.6,
    items: [
      { name: 'Caulk', amount: 8, jobId: 'shop' },
      { name: 'Gloves', amount: 12, jobId: null },
    ],
    jobIds: ['shop'],
    note: '',
    createdAt: serverTimestamp(),
  })
})
await env.cleanup()
console.log(`Seeded. Sign in as ${TEST_EMAIL} / ${TEST_PASSWORD}`)

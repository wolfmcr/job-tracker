// Seeds the local emulators for `npm run dev:local`: two businesses, a login for each, and a few
// jobs, tasks and receipts to look at. Sign in as each in two browsers to check neither can see
// the other's data. Local-only test accounts; they don't exist anywhere else.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

const PROJECT_ID = 'demo-job-tracker'
const PASSWORD = 'local-test-only'
const BUSINESSES = [
  { id: 'alder', name: 'Alder Builders', uid: 'alder-owner', email: 'test@example.test' },
  { id: 'birch', name: 'Birch Co', uid: 'birch-owner', email: 'other@example.test' },
]

for (const { uid, email } of BUSINESSES) {
  const res = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ localId: uid, email, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Couldn't create the test login ${email}: ${await res.text()}`)
}

const env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { host: '127.0.0.1', port: 8088 } })
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore()
  const set = (path, data) => setDoc(doc(db, path), data)

  // What scripts/admin.ts add-business and add-member write
  for (const { id, name, uid, email } of BUSINESSES) {
    await set(`businesses/${id}`, { name, createdAt: serverTimestamp() })
    await set(`businesses/${id}/members/${uid}`, { email, addedAt: serverTimestamp() })
    await set(`users/${uid}`, { businessId: id })
  }

  const job = (name, color) => ({ name, address: '', color, isDone: false, isArchived: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  const task = (jobId, text) => ({ jobId, text, isDone: false, createdAt: serverTimestamp() })

  const A = 'businesses/alder'
  await set(`${A}/jobs/alder-st`, job('Alder St', '#2563eb'))
  await set(`${A}/jobs/oak`, job('Oak Ave', '#16a34a'))
  await set(`${A}/jobs/shop`, job('The Shop', '#9333ea'))
  await set(`${A}/tasks/t1`, task('alder-st', 'Frame the closet'))
  await set(`${A}/shoppingItems/s1`, { jobId: 'alder-st', qty: '10', name: '2x4 studs', isGot: false, taskId: 't1', createdAt: serverTimestamp() })
  await set(`${A}/receipts/seed1`, {
    store: 'Home Depot',
    date: '2026-10-29',
    tax: 8,
    total: 108,
    items: [
      { name: '2x4 studs (10)', amount: 60, jobId: 'alder-st' },
      { name: 'Drywall screws', amount: 25, jobId: 'alder-st' },
      { name: 'Paint roller', amount: 15, jobId: 'oak' },
    ],
    jobIds: ['alder-st', 'oak'],
    note: '',
    createdAt: serverTimestamp(),
  })
  await set(`${A}/receipts/seed2`, {
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

  const B = 'businesses/birch'
  await set(`${B}/jobs/maple`, job('Maple Rd', '#dc2626'))
  await set(`${B}/tasks/t1`, task('maple', 'Replace the deck boards'))
  await set(`${B}/shoppingItems/s1`, { jobId: 'maple', qty: '20', name: 'Deck boards', isGot: false, createdAt: serverTimestamp() })
})
await env.cleanup()
console.log(`Seeded. Sign in as ${BUSINESSES.map(b => `${b.email} (${b.name})`).join(' or ')}, password ${PASSWORD}`)

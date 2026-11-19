import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { createRulesEnv } from './test/rulesEnv'

let env: RulesTestEnvironment

// Two businesses, one member each. Alice runs A; Bob runs B and must never see A's data.
const A = 'businesses/a'
const B = 'businesses/b'

const as = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore
let alice: Firestore

beforeAll(async () => { env = await createRulesEnv() })
afterAll(() => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await seed(A, { name: 'Alder Builders' })
  await seed(`${A}/members/alice`, { email: 'alice@example.test' })
  await seed('users/alice', { businessId: 'a' })
  await seed(B, { name: 'Birch Co' })
  await seed(`${B}/members/bob`, { email: 'bob@example.test' })
  await seed('users/bob', { businessId: 'b' })
  alice = as('alice')
})

const past = Timestamp.fromMillis(1_700_000_000_000)

// Writes test data directly, as if it was already in the database (scripts/admin.mjs, or the app earlier)
async function seed(path: string, data: DocumentData) {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore() as unknown as Firestore, path), data))
}

async function remove(path: string) {
  await env.withSecurityRulesDisabled(ctx => deleteDoc(doc(ctx.firestore() as unknown as Firestore, path)))
}

const job = () => ({ name: 'Alder St', address: '', isDone: false, isArchived: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
const item = (jobId = 'j') => ({ jobId, qty: '', name: 'Primer', isGot: false, createdAt: serverTimestamp() })
const task = (jobId = 'j') => ({ jobId, text: 'Paint door', isDone: false, createdAt: serverTimestamp() })
const seededJob = { name: 'Alder St', address: '', isDone: false, isArchived: false, createdAt: past, updatedAt: past }

// One of everything in business A
async function seedBusinessA() {
  await seed(`${A}/jobs/j`, seededJob)
  await seed(`${A}/shoppingItems/i`, { ...item(), createdAt: past })
  await seed(`${A}/tasks/t`, { ...task(), createdAt: past })
  await seed(`${A}/employees/e`, { name: 'Sam', hourlyRate: 30, createdAt: past })
  await seed(`${A}/employees/e/timeEntries/x`, { date: '2026-10-20', hours: 8, rate: 30, note: '', createdAt: past })
  await seed(`${A}/employees/e/payments/p`, { date: '2026-10-20', amount: 100, note: '', createdAt: past })
  await seed(`${A}/receipts/r`, { store: 'Hardware Co', date: '2026-10-29', tax: 0, total: 1, items: [], jobIds: [], note: '', createdAt: past })
}

const docsInA = [A, `${A}/jobs/j`, `${A}/shoppingItems/i`, `${A}/tasks/t`, `${A}/employees/e`, `${A}/employees/e/timeEntries/x`, `${A}/employees/e/payments/p`, `${A}/receipts/r`]
const listsInA = [`${A}/jobs`, `${A}/shoppingItems`, `${A}/tasks`, `${A}/employees`, `${A}/employees/e/timeEntries`, `${A}/employees/e/payments`, `${A}/receipts`]

describe('each business sees only its own data', () => {
  beforeEach(seedBusinessA)

  it('a member can read all of their business, one by one and as lists', async () => {
    for (const path of docsInA) await assertSucceeds(getDoc(doc(alice, path)))
    for (const path of listsInA) await assertSucceeds(getDocs(collection(alice, path)))
    await assertSucceeds(getDocs(query(collection(alice, `${A}/tasks`), where('jobId', '==', 'j'))))
  })

  it.each([
    ['a member of another business', () => as('bob')],
    ['an account in no business', () => as('stranger')],
    ['someone signed out', () => env.unauthenticatedContext().firestore() as unknown as Firestore],
  ])('%s can’t read or write any of it', async (_, context) => {
    const db = context()
    for (const path of docsInA) {
      await assertFails(getDoc(doc(db, path)))
      await assertFails(setDoc(doc(db, path), { name: 'x' }))
      await assertFails(deleteDoc(doc(db, path)))
    }
    for (const path of listsInA) await assertFails(getDocs(collection(db, path)))
    await assertFails(getDocs(query(collection(db, `${A}/shoppingItems`), where('jobId', '==', 'j'))))
    await assertFails(addDoc(collection(db, `${A}/jobs`), job()))
  })

  it('nothing can be listed across businesses', async () => {
    for (const group of ['jobs', 'tasks', 'shoppingItems', 'receipts', 'members']) {
      await assertFails(getDocs(collectionGroup(alice, group)))
    }
    await assertFails(getDocs(collection(alice, 'businesses')))
    await assertFails(getDocs(collection(alice, 'users')))
  })

  it('a removed member loses access straight away', async () => {
    await remove(`${A}/members/alice`)
    for (const path of docsInA) await assertFails(getDoc(doc(alice, path)))
    await assertFails(addDoc(collection(alice, `${A}/jobs`), job()))
  })

  it('unknown collections are closed', async () => {
    await assertFails(setDoc(doc(alice, 'other/x'), { a: 1 }))
    await assertFails(setDoc(doc(alice, `${A}/other/x`), { a: 1 }))
    await assertFails(setDoc(doc(alice, `${A}/jobs/j/tasks/x`), { text: 'old layout' }))
  })
})

describe('membership', () => {
  it('an account can read its own user doc, and no one else’s', async () => {
    await assertSucceeds(getDoc(doc(alice, 'users/alice')))
    await assertFails(getDoc(doc(alice, 'users/bob')))
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore() as unknown as Firestore, 'users/alice')))
  })

  it('can only be changed by the admin script, never from the app', async () => {
    await assertFails(setDoc(doc(alice, `${A}/members/bob`), { email: 'bob@example.test' }))
    await assertFails(setDoc(doc(as('bob'), `${A}/members/bob`), { email: 'bob@example.test' }))
    await assertFails(deleteDoc(doc(alice, `${A}/members/alice`)))
    await assertFails(getDoc(doc(alice, `${A}/members/alice`)))
    await assertFails(setDoc(doc(alice, 'users/alice'), { businessId: 'b' }))
    await assertFails(setDoc(doc(as('stranger'), 'users/stranger'), { businessId: 'a' }))
    await assertFails(updateDoc(doc(alice, A), { name: 'Renamed' }))
    await assertFails(setDoc(doc(alice, 'businesses/new'), { name: 'Mine' }))
  })
})

describe('jobs', () => {
  it('accepts a valid new job, with or without optional fields', async () => {
    await assertSucceeds(addDoc(collection(alice, `${A}/jobs`), job()))
    await assertSucceeds(addDoc(collection(alice, `${A}/jobs`), { ...job(), color: '#ff0000', clientName: 'Pat', clientPhone: '(503) 555-1234', notes: 'Gate 1234' }))
  })

  it.each([
    ['a blank name', { name: '' }],
    ['a non-string name', { name: 5 }],
    ['an unknown field', { owner: 'me' }],
    ['a client-side createdAt', { createdAt: past }],
    ['isDone that isn’t a boolean', { isDone: 'no' }],
    ['very long notes', { notes: 'x'.repeat(10001) }],
  ])('rejects a new job with %s', async (_, override) => {
    await assertFails(addDoc(collection(alice, `${A}/jobs`), { ...job(), ...override }))
  })

  it('rejects a new job missing required fields', async () => {
    const { address: _address, ...noAddress } = job()
    await assertFails(addDoc(collection(alice, `${A}/jobs`), noAddress))
  })

  it('edits must bump updatedAt and only touch job fields', async () => {
    await seed(`${A}/jobs/j`, seededJob)
    await assertSucceeds(updateDoc(doc(alice, `${A}/jobs/j`), { notes: 'x', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice, `${A}/jobs/j`), { notes: 'y' }))
    await assertFails(updateDoc(doc(alice, `${A}/jobs/j`), { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice, `${A}/jobs/j`), { name: '', updatedAt: serverTimestamp() }))
  })

  it('jobs can’t be deleted (they’re archived instead)', async () => {
    await seed(`${A}/jobs/j`, seededJob)
    await assertFails(deleteDoc(doc(alice, `${A}/jobs/j`)))
  })
})

describe('shopping items', () => {
  beforeEach(async () => {
    await seed(`${A}/jobs/j`, seededJob)
    await seed(`${B}/jobs/bj`, seededJob)
  })

  it('accepts valid items, with a task link and priority', async () => {
    await assertSucceeds(addDoc(collection(alice, `${A}/shoppingItems`), item()))
    await assertSucceeds(addDoc(collection(alice, `${A}/shoppingItems`), { ...item(), qty: '2', taskId: 't', priority: 2 }))
  })

  it.each([
    ['no job', { jobId: undefined }],
    ['a job that doesn’t exist', { jobId: 'nope' }],
    ['another business’s job', { jobId: 'bj' }],
    ['a blank name', { name: '' }],
    ['priority out of range', { priority: 3 }],
    ['a fractional priority', { priority: 1.5 }],
    ['an unknown field', { jobName: 'Alder St' }],
  ])('rejects %s', async (_, override) => {
    const data: DocumentData = { ...item(), ...override }
    if (data.jobId === undefined) delete data.jobId
    await assertFails(addDoc(collection(alice, `${A}/shoppingItems`), data))
  })

  it('can be checked off, unlinked from a task, and deleted, but not moved to another job', async () => {
    await seed(`${A}/jobs/k`, seededJob)
    await seed(`${A}/shoppingItems/i`, { jobId: 'j', qty: '', name: 'Primer', isGot: false, taskId: 't', createdAt: past })
    await assertSucceeds(updateDoc(doc(alice, `${A}/shoppingItems/i`), { isGot: true }))
    await assertSucceeds(updateDoc(doc(alice, `${A}/shoppingItems/i`), { taskId: deleteField() }))
    await assertFails(updateDoc(doc(alice, `${A}/shoppingItems/i`), { jobId: 'k' }))
    await assertFails(updateDoc(doc(alice, `${A}/shoppingItems/i`), { createdAt: serverTimestamp() }))
    await assertSucceeds(deleteDoc(doc(alice, `${A}/shoppingItems/i`)))
  })
})

describe('tasks', () => {
  beforeEach(async () => {
    await seed(`${A}/jobs/j`, seededJob)
    await seed(`${B}/jobs/bj`, seededJob)
  })

  it('accepts a full task', async () => {
    await assertSucceeds(addDoc(collection(alice, `${A}/tasks`), { ...task(), bullets: ['Two coats'], dueDate: '2026-10-30', priority: 1 }))
  })

  it.each([
    ['a job that doesn’t exist', { jobId: 'nope' }],
    ['another business’s job', { jobId: 'bj' }],
    ['blank text', { text: '' }],
    ['a malformed due date', { dueDate: '10/30/2026' }],
    ['bullets that aren’t a list', { bullets: 'Two coats' }],
    ['an unknown field', { details: 'old style' }],
  ])('rejects %s', async (_, override) => {
    await assertFails(addDoc(collection(alice, `${A}/tasks`), { ...task(), ...override }))
  })

  it('can be completed and un-completed, but not moved to another job', async () => {
    await seed(`${A}/jobs/k`, seededJob)
    await seed(`${A}/tasks/t`, { jobId: 'j', text: 'Paint door', isDone: false, createdAt: past })
    await assertSucceeds(updateDoc(doc(alice, `${A}/tasks/t`), { isDone: true, completedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(alice, `${A}/tasks/t`), { isDone: false, completedAt: deleteField() }))
    await assertFails(updateDoc(doc(alice, `${A}/tasks/t`), { jobId: 'k' }))
  })

  it('older tasks with leftover fields can still be edited', async () => {
    await seed(`${A}/tasks/t`, { jobId: 'j', text: 'Paint door', details: 'from the To-Do days', isDone: false, createdAt: past })
    await assertSucceeds(updateDoc(doc(alice, `${A}/tasks/t`), { text: 'Paint front door', dueDate: deleteField() }))
  })
})

// Rules may only look up so many documents per request; these are the app's biggest writes
describe('large writes stay within the rules’ limits', () => {
  const ITEMS = 25

  beforeEach(async () => {
    await seed(`${A}/jobs/j`, seededJob)
    await seed(`${A}/tasks/t`, { jobId: 'j', text: 'Paint door', isDone: false, createdAt: past })
    for (let i = 0; i < ITEMS; i++) await seed(`${A}/shoppingItems/i${i}`, { jobId: 'j', qty: '', name: `Item ${i}`, isGot: false, taskId: 't', createdAt: past })
  })

  it('deleting a task with all its shopping in one batch', async () => {
    const batch = writeBatch(alice)
    batch.delete(doc(alice, `${A}/tasks/t`))
    for (let i = 0; i < ITEMS; i++) batch.delete(doc(alice, `${A}/shoppingItems/i${i}`))
    await assertSucceeds(batch.commit())
  })

  it('deleting a task and unlinking its shopping in one transaction', async () => {
    await assertSucceeds(runTransaction(alice, async transaction => {
      const items = await Promise.all(Array.from({ length: ITEMS }, (_, i) => transaction.get(doc(alice, `${A}/shoppingItems/i${i}`))))
      transaction.delete(doc(alice, `${A}/tasks/t`))
      for (const snap of items) transaction.update(snap.ref, { taskId: deleteField() })
    }))
  })

  it('logging a timed session (an entry plus clearing the timer)', async () => {
    await seed(`${A}/employees/e`, { name: 'Sam', hourlyRate: 30, createdAt: past, timer: { startedAt: past, pausedAt: past, pausedMs: 0 } })
    const batch = writeBatch(alice)
    batch.set(doc(collection(alice, `${A}/employees/e/timeEntries`)), { date: '2026-10-20', hours: 8, rate: 30, note: '', createdAt: serverTimestamp() })
    batch.update(doc(alice, `${A}/employees/e`), { timer: deleteField() })
    await assertSucceeds(batch.commit())
  })
})

describe('employees and the ledger', () => {
  const E = `${A}/employees/e`
  beforeEach(() => seed(E, { name: 'Sam', hourlyRate: 30, createdAt: past }))

  it('employee needs a name and a non-negative rate, and can’t be deleted', async () => {
    await assertSucceeds(addDoc(collection(alice, `${A}/employees`), { name: 'Sam', hourlyRate: 0, createdAt: serverTimestamp() }))
    await assertFails(addDoc(collection(alice, `${A}/employees`), { name: 'Sam', hourlyRate: -1, createdAt: serverTimestamp() }))
    await assertFails(addDoc(collection(alice, `${A}/employees`), { name: '', hourlyRate: 30, createdAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(alice, E), { hourlyRate: 35 }))
    await assertFails(deleteDoc(doc(alice, E)))
  })

  it('employee can hold a valid timer, and only that besides name and rate', async () => {
    const timer = { startedAt: past, pausedAt: null, pausedMs: 0 }
    await assertSucceeds(updateDoc(doc(alice, E), { timer }))
    await assertSucceeds(updateDoc(doc(alice, E), { timer: { ...timer, pausedAt: past, pausedMs: 60_000 } }))
    await assertSucceeds(updateDoc(doc(alice, E), { timer: deleteField() }))
    await assertFails(updateDoc(doc(alice, E), { timer: { ...timer, pausedMs: -1 } }))
    await assertFails(updateDoc(doc(alice, E), { timer: { ...timer, startedAt: '07:30' } }))
    await assertFails(updateDoc(doc(alice, E), { timer: { startedAt: past, pausedMs: 0 } }))
    await assertFails(updateDoc(doc(alice, E), { timer: { ...timer, jobId: 'j' } }))
    await assertFails(updateDoc(doc(alice, E), { timer: { ...timer, startedAt: Timestamp.fromMillis(Date.now() + 3_600_000) } }))
    await assertFails(updateDoc(doc(alice, E), { createdAt: Timestamp.fromMillis(0), timer }))
  })

  it('time entries need a date and positive hours, and keep their rate', async () => {
    const entry = { date: '2026-10-20', hours: 7.5, rate: 30, note: '', createdAt: serverTimestamp() }
    await assertSucceeds(addDoc(collection(alice, `${E}/timeEntries`), entry))
    await assertFails(addDoc(collection(alice, `${E}/timeEntries`), { ...entry, hours: 0 }))
    await assertFails(addDoc(collection(alice, `${E}/timeEntries`), { ...entry, date: 'yesterday' }))
    await assertFails(addDoc(collection(alice, `${E}/timeEntries`), { ...entry, hours: '7' }))

    await seed(`${E}/timeEntries/x`, { ...entry, createdAt: past })
    await assertSucceeds(updateDoc(doc(alice, `${E}/timeEntries/x`), { hours: 8, note: 'Paint' }))
    await assertFails(updateDoc(doc(alice, `${E}/timeEntries/x`), { rate: 40 }))
    await assertSucceeds(deleteDoc(doc(alice, `${E}/timeEntries/x`)))
  })

  it('payments need a positive amount', async () => {
    const payment = { date: '2026-10-20', amount: 250, note: 'Cash', createdAt: serverTimestamp() }
    await assertSucceeds(addDoc(collection(alice, `${E}/payments`), payment))
    await assertFails(addDoc(collection(alice, `${E}/payments`), { ...payment, amount: 0 }))
    await assertFails(addDoc(collection(alice, `${E}/payments`), { ...payment, amount: -5 }))
  })
})

describe('receipts', () => {
  const receipt = () => ({
    store: 'Hardware Co',
    date: '2026-10-29',
    tax: 8,
    total: 108,
    items: [{ name: 'Studs', amount: 60, jobId: 'a' }, { name: 'Roller', amount: 40, jobId: null }],
    jobIds: ['a'],
    note: '',
    createdAt: serverTimestamp(),
  })

  it('accepts a receipt as printed, with or without a photo', async () => {
    await assertSucceeds(setDoc(doc(alice, `${A}/receipts/r1`), { ...receipt(), photoPath: `${A}/receipts/r1.jpg` }))
    await assertSucceeds(setDoc(doc(alice, `${A}/receipts/r2`), receipt()))
  })

  it('accepts negative amounts, for returns', async () => {
    await assertSucceeds(setDoc(doc(alice, `${A}/receipts/r`), { ...receipt(), tax: -0.8, total: -10.8, items: [{ name: 'Caulk', amount: -10, jobId: 'a' }] }))
  })

  it.each([
    ['a blank store', { store: '' }],
    ['a bad date', { date: '10/29/2026' }],
    ['a total as text', { total: '108' }],
    ['items that aren’t a list', { items: 'Studs' }],
    ['over 100 items', { items: Array.from({ length: 101 }, () => ({ name: 'x', amount: 1, jobId: null })) }],
    ['another receipt’s photo', { photoPath: `${A}/receipts/other.jpg` }],
    ['another business’s photo', { photoPath: `${B}/receipts/r.jpg` }],
    ['a photo in the old place', { photoPath: 'receipts/r.jpg' }],
    ['an unknown field', { billed: true }],
  ])('rejects %s', async (_, change) => {
    await assertFails(setDoc(doc(alice, `${A}/receipts/r`), { ...receipt(), ...change }))
  })

  it('can be edited, re-tagged and deleted, but createdAt stays', async () => {
    await seed(`${A}/receipts/r`, { ...receipt(), createdAt: past })
    await assertSucceeds(updateDoc(doc(alice, `${A}/receipts/r`), { items: [{ name: 'Studs', amount: 60, jobId: 'b' }], jobIds: ['b'] }))
    await assertSucceeds(updateDoc(doc(alice, `${A}/receipts/r`), { photoPath: `${A}/receipts/r.jpg` }))
    await assertFails(updateDoc(doc(alice, `${A}/receipts/r`), { createdAt: serverTimestamp() }))
    await assertSucceeds(deleteDoc(doc(alice, `${A}/receipts/r`)))
  })
})

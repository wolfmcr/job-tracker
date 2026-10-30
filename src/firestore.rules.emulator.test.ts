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
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { OWNER_UID } from './test/emulatorDb'
import { createRulesEnv } from './test/rulesEnv'

let env: RulesTestEnvironment
let owner: Firestore

beforeAll(async () => { env = await createRulesEnv() })
afterAll(() => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  owner = env.authenticatedContext(OWNER_UID).firestore() as unknown as Firestore
})

const past = Timestamp.fromMillis(1_700_000_000_000)

// Writes test data directly, as if it was already in the database
async function seed(path: string, data: DocumentData) {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore() as unknown as Firestore, path), data))
}

const job = () => ({ name: 'Alder St', address: '', isDone: false, isArchived: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
const item = () => ({ qty: '', name: 'Primer', isGot: false, createdAt: serverTimestamp() })
const task = () => ({ text: 'Paint door', isDone: false, createdAt: serverTimestamp() })
const seededJob = { name: 'Alder St', address: '', isDone: false, isArchived: false, createdAt: past, updatedAt: past }

describe('who can get in', () => {
  const paths = ['jobs/j', 'jobs/j/shoppingItems/i', 'jobs/j/tasks/t', 'employees/e', 'employees/e/timeEntries/x', 'employees/e/payments/p', 'receipts/r']

  it.each([
    ['signed out', () => env.unauthenticatedContext()],
    ['another account', () => env.authenticatedContext('someone-else')],
  ])('%s can’t read or write anything', async (_, context) => {
    const db = context().firestore() as unknown as Firestore
    for (const path of paths) {
      await assertFails(getDoc(doc(db, path)))
      await assertFails(setDoc(doc(db, path), { name: 'x' }))
    }
    await assertFails(getDocs(collectionGroup(db, 'shoppingItems')))
    await assertFails(getDocs(collectionGroup(db, 'tasks')))
  })

  it('the owner can read everything, including across all jobs', async () => {
    for (const path of paths) await assertSucceeds(getDoc(doc(owner, path)))
    await assertSucceeds(getDocs(collectionGroup(owner, 'shoppingItems')))
    await assertSucceeds(getDocs(collectionGroup(owner, 'tasks')))
  })

  it('unknown collections are closed', async () => {
    await assertFails(setDoc(doc(owner, 'other/x'), { a: 1 }))
    await assertFails(setDoc(doc(owner, 'jobs/j/todoItems/x'), { text: 'old' }))
  })
})

describe('jobs', () => {
  it('accepts a valid new job, with or without optional fields', async () => {
    await assertSucceeds(addDoc(collection(owner, 'jobs'), job()))
    await assertSucceeds(addDoc(collection(owner, 'jobs'), { ...job(), color: '#ff0000', clientName: 'Pat', clientPhone: '(503) 555-1234', notes: 'Gate 1234' }))
  })

  it.each([
    ['a blank name', { name: '' }],
    ['a non-string name', { name: 5 }],
    ['an unknown field', { owner: 'me' }],
    ['a client-side createdAt', { createdAt: past }],
    ['isDone that isn’t a boolean', { isDone: 'no' }],
    ['very long notes', { notes: 'x'.repeat(10001) }],
  ])('rejects a new job with %s', async (_, override) => {
    await assertFails(addDoc(collection(owner, 'jobs'), { ...job(), ...override }))
  })

  it('rejects a new job missing required fields', async () => {
    const { address: _address, ...noAddress } = job()
    await assertFails(addDoc(collection(owner, 'jobs'), noAddress))
  })

  it('edits must bump updatedAt and only touch job fields', async () => {
    await seed('jobs/j', seededJob)
    await assertSucceeds(updateDoc(doc(owner, 'jobs/j'), { notes: 'x', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(owner, 'jobs/j'), { notes: 'y' }))
    await assertFails(updateDoc(doc(owner, 'jobs/j'), { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(owner, 'jobs/j'), { name: '', updatedAt: serverTimestamp() }))
  })

  it('jobs can’t be deleted (they’re archived instead)', async () => {
    await seed('jobs/j', seededJob)
    await assertFails(deleteDoc(doc(owner, 'jobs/j')))
  })
})

describe('shopping items', () => {
  beforeEach(() => seed('jobs/j', seededJob))

  it('accepts valid items, with a task link and priority', async () => {
    await assertSucceeds(addDoc(collection(owner, 'jobs/j/shoppingItems'), item()))
    await assertSucceeds(addDoc(collection(owner, 'jobs/j/shoppingItems'), { ...item(), qty: '2', taskId: 't', priority: 2 }))
  })

  it.each([
    ['a blank name', { name: '' }],
    ['priority out of range', { priority: 3 }],
    ['a fractional priority', { priority: 1.5 }],
    ['an unknown field', { jobName: 'Alder St' }],
  ])('rejects %s', async (_, override) => {
    await assertFails(addDoc(collection(owner, 'jobs/j/shoppingItems'), { ...item(), ...override }))
  })

  it('can be checked off, unlinked from a task, and deleted', async () => {
    await seed('jobs/j/shoppingItems/i', { qty: '', name: 'Primer', isGot: false, taskId: 't', createdAt: past })
    await assertSucceeds(updateDoc(doc(owner, 'jobs/j/shoppingItems/i'), { isGot: true }))
    await assertSucceeds(updateDoc(doc(owner, 'jobs/j/shoppingItems/i'), { taskId: deleteField() }))
    await assertFails(updateDoc(doc(owner, 'jobs/j/shoppingItems/i'), { createdAt: serverTimestamp() }))
    await assertSucceeds(deleteDoc(doc(owner, 'jobs/j/shoppingItems/i')))
  })
})

describe('tasks', () => {
  beforeEach(() => seed('jobs/j', seededJob))

  it('accepts a full task', async () => {
    await assertSucceeds(addDoc(collection(owner, 'jobs/j/tasks'), { ...task(), bullets: ['Two coats'], dueDate: '2026-10-30', priority: 1 }))
  })

  it.each([
    ['blank text', { text: '' }],
    ['a malformed due date', { dueDate: '10/30/2026' }],
    ['bullets that aren’t a list', { bullets: 'Two coats' }],
    ['an unknown field', { details: 'old style' }],
  ])('rejects %s', async (_, override) => {
    await assertFails(addDoc(collection(owner, 'jobs/j/tasks'), { ...task(), ...override }))
  })

  it('can be completed and un-completed', async () => {
    await seed('jobs/j/tasks/t', { text: 'Paint door', isDone: false, createdAt: past })
    await assertSucceeds(updateDoc(doc(owner, 'jobs/j/tasks/t'), { isDone: true, completedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(owner, 'jobs/j/tasks/t'), { isDone: false, completedAt: deleteField() }))
  })

  it('older tasks with leftover fields can still be edited', async () => {
    await seed('jobs/j/tasks/t', { text: 'Paint door', details: 'from the To-Do days', isDone: false, createdAt: past })
    await assertSucceeds(updateDoc(doc(owner, 'jobs/j/tasks/t'), { text: 'Paint front door', dueDate: deleteField() }))
  })
})

describe('employees and the ledger', () => {
  beforeEach(() => seed('employees/e', { name: 'Sam', hourlyRate: 30, createdAt: past }))

  it('employee needs a name and a non-negative rate, and can’t be deleted', async () => {
    await assertSucceeds(addDoc(collection(owner, 'employees'), { name: 'Sam', hourlyRate: 0, createdAt: serverTimestamp() }))
    await assertFails(addDoc(collection(owner, 'employees'), { name: 'Sam', hourlyRate: -1, createdAt: serverTimestamp() }))
    await assertFails(addDoc(collection(owner, 'employees'), { name: '', hourlyRate: 30, createdAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(owner, 'employees/e'), { hourlyRate: 35 }))
    await assertFails(deleteDoc(doc(owner, 'employees/e')))
  })

  it('time entries need a date and positive hours, and keep their rate', async () => {
    const entry = { date: '2026-10-20', hours: 7.5, rate: 30, note: '', createdAt: serverTimestamp() }
    await assertSucceeds(addDoc(collection(owner, 'employees/e/timeEntries'), entry))
    await assertFails(addDoc(collection(owner, 'employees/e/timeEntries'), { ...entry, hours: 0 }))
    await assertFails(addDoc(collection(owner, 'employees/e/timeEntries'), { ...entry, date: 'yesterday' }))
    await assertFails(addDoc(collection(owner, 'employees/e/timeEntries'), { ...entry, hours: '7' }))

    await seed('employees/e/timeEntries/x', { ...entry, createdAt: past })
    await assertSucceeds(updateDoc(doc(owner, 'employees/e/timeEntries/x'), { hours: 8, note: 'Paint' }))
    await assertFails(updateDoc(doc(owner, 'employees/e/timeEntries/x'), { rate: 40 }))
    await assertSucceeds(deleteDoc(doc(owner, 'employees/e/timeEntries/x')))
  })

  it('payments need a positive amount', async () => {
    const payment = { date: '2026-10-20', amount: 250, note: 'Cash', createdAt: serverTimestamp() }
    await assertSucceeds(addDoc(collection(owner, 'employees/e/payments'), payment))
    await assertFails(addDoc(collection(owner, 'employees/e/payments'), { ...payment, amount: 0 }))
    await assertFails(addDoc(collection(owner, 'employees/e/payments'), { ...payment, amount: -5 }))
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
    await assertSucceeds(setDoc(doc(owner, 'receipts/r1'), { ...receipt(), photoPath: 'receipts/r1.jpg' }))
    await assertSucceeds(setDoc(doc(owner, 'receipts/r2'), receipt()))
  })

  it('accepts negative amounts, for returns', async () => {
    await assertSucceeds(setDoc(doc(owner, 'receipts/r'), { ...receipt(), tax: -0.8, total: -10.8, items: [{ name: 'Caulk', amount: -10, jobId: 'a' }] }))
  })

  it.each([
    ['a blank store', { store: '' }],
    ['a bad date', { date: '10/29/2026' }],
    ['a total as text', { total: '108' }],
    ['items that aren’t a list', { items: 'Studs' }],
    ['over 100 items', { items: Array.from({ length: 101 }, () => ({ name: 'x', amount: 1, jobId: null })) }],
    ['another receipt’s photo', { photoPath: 'receipts/other.jpg' }],
    ['an unknown field', { billed: true }],
  ])('rejects %s', async (_, change) => {
    await assertFails(setDoc(doc(owner, 'receipts/r'), { ...receipt(), ...change }))
  })

  it('can be edited, re-tagged and deleted, but createdAt stays', async () => {
    await seed('receipts/r', { ...receipt(), createdAt: past })
    await assertSucceeds(updateDoc(doc(owner, 'receipts/r'), { items: [{ name: 'Studs', amount: 60, jobId: 'b' }], jobIds: ['b'] }))
    await assertSucceeds(updateDoc(doc(owner, 'receipts/r'), { photoPath: 'receipts/r.jpg' }))
    await assertFails(updateDoc(doc(owner, 'receipts/r'), { createdAt: serverTimestamp() }))
    await assertSucceeds(deleteDoc(doc(owner, 'receipts/r')))
  })
})

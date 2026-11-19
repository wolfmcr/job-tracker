import { assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { collection, getDocs, type Firestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { addBusiness, addMember } from '../scripts/members.ts'
import { importLive, type Project } from '../scripts/migrate.ts'
import { createRulesEnv, PROJECT_ID } from './test/rulesEnv'

// The emulators run one project, so it's both the live project and the one copied into here.
// That's fine: the old layout is at the top level and the new one under businesses/.
const admin = initializeApp({ projectId: PROJECT_ID, storageBucket: `${PROJECT_ID}.appspot.com` }, 'migrate-tests')
const db = getFirestore(admin)
const bucket = getStorage(admin).bucket()
const auth = getAuth(admin)
const project: Project = { db, bucket }

let env: RulesTestEnvironment
beforeAll(async () => { env = await createRulesEnv() })
afterAll(() => env.cleanup())

const created = Timestamp.fromMillis(1_700_000_000_000)
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9])
let businessId: string
let uid: string

// The live project as it is today
async function seedOldLayout() {
  await db.doc('jobs/alder').set({ name: 'Alder St', address: '1 Alder St', color: '#ff0000', isDone: false, isArchived: false, createdAt: created, updatedAt: created })
  await db.doc('jobs/alder/tasks/t1').set({ text: 'Frame closet', details: 'from the To-Do days', isDone: true, completedAt: created, createdAt: created })
  await db.doc('jobs/alder/shoppingItems/s1').set({ qty: '10', name: 'Studs', isGot: false, taskId: 't1', createdAt: created })
  await db.doc('employees/sam').set({ name: 'Sam', hourlyRate: 30, createdAt: created, timer: { startedAt: created, pausedAt: null, pausedMs: 0 } })
  await db.doc('employees/sam/timeEntries/e1').set({ date: '2026-10-20', hours: 8, rate: 30, note: '', createdAt: created })
  await db.doc('employees/sam/payments/p1').set({ date: '2026-10-21', amount: 240, note: 'Cash', createdAt: created })
  const receipt = { store: 'Hardware Co', date: '2026-10-29', tax: 0, total: 60, items: [{ name: 'Studs', amount: 60, jobId: 'alder' }], jobIds: ['alder'], note: '', createdAt: created }
  await db.doc('receipts/withPhoto').set({ ...receipt, photoPath: 'receipts/withPhoto.jpg' })
  await bucket.file('receipts/withPhoto.jpg').save(jpeg, { contentType: 'image/jpeg' })
  await db.doc('receipts/photoGone').set({ ...receipt, photoPath: 'receipts/photoGone.jpg' })
  await db.doc('receipts/typedIn').set(receipt)
}

beforeEach(async () => {
  await env.clearFirestore()
  await env.clearStorage()
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' })
  await seedOldLayout()
  businessId = await addBusiness(db, 'Alder Builders')
  ;({ uid } = await addMember(db, auth, businessId, 'alice@example.test'))
})

const B = () => `businesses/${businessId}`
const get = async (path: string) => (await db.doc(path).get()).data()

describe('import-live', () => {
  it('a dry run counts everything and writes nothing', async () => {
    const counts = await importLive(project, project, businessId, { dryRun: true })
    expect(counts).toEqual({ jobs: 1, tasks: 1, shoppingItems: 1, employees: 1, timeEntries: 1, payments: 1, receipts: 3, photos: 1, missingPhotos: 1 })
    expect((await db.collection(`${B()}/jobs`).get()).size).toBe(0)
    expect((await bucket.file(`${B()}/receipts/withPhoto.jpg`).exists())[0]).toBe(false)
  })

  it('copies everything into the business in the new layout, keeping IDs and timestamps', async () => {
    await importLive(project, project, businessId)
    expect(await get(`${B()}/jobs/alder`)).toMatchObject({ name: 'Alder St', color: '#ff0000', createdAt: created })
    // Tasks and shopping move out from under the job and say which job they're for
    expect(await get(`${B()}/tasks/t1`)).toMatchObject({ jobId: 'alder', text: 'Frame closet', isDone: true, completedAt: created })
    expect(await get(`${B()}/shoppingItems/s1`)).toMatchObject({ jobId: 'alder', name: 'Studs', taskId: 't1' })
    expect(await get(`${B()}/employees/sam`)).toMatchObject({ hourlyRate: 30, timer: { startedAt: created, pausedAt: null, pausedMs: 0 } })
    expect(await get(`${B()}/employees/sam/timeEntries/e1`)).toMatchObject({ hours: 8, rate: 30 })
    expect(await get(`${B()}/employees/sam/payments/p1`)).toMatchObject({ amount: 240 })
    expect(await get(`${B()}/receipts/withPhoto`)).toMatchObject({ photoPath: `${B()}/receipts/withPhoto.jpg` })
    expect((await bucket.file(`${B()}/receipts/withPhoto.jpg`).exists())[0]).toBe(true)
    // A receipt whose photo was already gone comes over without one
    expect(await get(`${B()}/receipts/photoGone`)).not.toHaveProperty('photoPath')
    expect(await get(`${B()}/receipts/typedIn`)).not.toHaveProperty('photoPath')
  })

  it('leaves the old layout exactly as it was', async () => {
    const before = await get('jobs/alder/tasks/t1')
    await importLive(project, project, businessId)
    expect(await get('jobs/alder/tasks/t1')).toEqual(before)
    expect(await get('receipts/withPhoto')).toMatchObject({ photoPath: 'receipts/withPhoto.jpg' })
    expect((await bucket.file('receipts/withPhoto.jpg').exists())[0]).toBe(true)
  })

  it('the business’s member can then read all of it through the real rules', async () => {
    await importLive(project, project, businessId)
    const member = env.authenticatedContext(uid)
    const memberDb = member.firestore() as unknown as Firestore
    for (const list of ['jobs', 'tasks', 'shoppingItems', 'employees', 'employees/sam/timeEntries', 'employees/sam/payments', 'receipts']) {
      const snapshot = await assertSucceeds(getDocs(collection(memberDb, `${B()}/${list}`)))
      expect(snapshot.size).toBeGreaterThan(0)
    }
    await assertSucceeds(member.storage(`gs://${bucket.name}`).ref(`${B()}/receipts/withPhoto.jpg`).getDownloadURL())
  })

  it('running it again updates rather than duplicates', async () => {
    await importLive(project, project, businessId)
    await db.doc('jobs/alder').update({ notes: 'Gate 1234' })
    await importLive(project, project, businessId)
    expect((await db.collection(`${B()}/jobs`).get()).size).toBe(1)
    expect((await db.collection(`${B()}/tasks`).get()).size).toBe(1)
    expect(await get(`${B()}/jobs/alder`)).toMatchObject({ notes: 'Gate 1234' })
  })

  it('stops before writing anything if a document doesn’t look right', async () => {
    await db.doc('jobs/broken').set({ address: '', isDone: false, isArchived: false, createdAt: created, updatedAt: created })
    await expect(importLive(project, project, businessId)).rejects.toThrow(/jobs\/broken is missing name/)
    expect((await db.collection(`${B()}/jobs`).get()).size).toBe(0)
    expect((await bucket.file(`${B()}/receipts/withPhoto.jpg`).exists())[0]).toBe(false)
  })

  it('won’t copy into a business that doesn’t exist', async () => {
    await expect(importLive(project, project, 'nope')).rejects.toThrow(/no business/)
  })
})

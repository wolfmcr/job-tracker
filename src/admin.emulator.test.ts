import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { doc, getDoc, type Firestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { addBusiness, addMember, listMembers, removeMember } from '../scripts/members.ts'
import { createRulesEnv, PROJECT_ID } from './test/rulesEnv'

// The Admin SDK finds the emulators from the variables `firebase emulators:exec` sets
const admin = initializeApp({ projectId: PROJECT_ID }, 'admin-tests')
const db = getFirestore(admin)
const auth = getAuth(admin)

let env: RulesTestEnvironment
beforeAll(async () => { env = await createRulesEnv() })
afterAll(() => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' })
})

// What the app would get, signed in as this account, with the real rules
const canReadBusiness = (uid: string, businessId: string) =>
  getDoc(doc(env.authenticatedContext(uid).firestore() as unknown as Firestore, `businesses/${businessId}`))

describe('admin script', () => {
  it('adds a business', async () => {
    const id = await addBusiness(db, 'Alder Builders')
    expect((await db.doc(`businesses/${id}`).get()).get('name')).toBe('Alder Builders')
  })

  it('adding a member creates their login, lets them in, and gives a link to set a password', async () => {
    const id = await addBusiness(db, 'Alder Builders')
    const { uid, resetLink } = await addMember(db, auth, id, 'alice@example.test')
    expect(resetLink).toMatch(/^https?:\/\//)
    expect((await auth.getUser(uid)).email).toBe('alice@example.test')
    expect((await db.doc(`users/${uid}`).get()).data()).toEqual({ businessId: id })
    expect(await listMembers(db, id)).toEqual([{ uid, email: 'alice@example.test' }])
    await assertSucceeds(canReadBusiness(uid, id))
  })

  it('a member of one business gets nothing of another', async () => {
    const a = await addBusiness(db, 'Alder Builders')
    const b = await addBusiness(db, 'Birch Co')
    const { uid } = await addMember(db, auth, a, 'alice@example.test')
    await assertFails(canReadBusiness(uid, b))
  })

  it('won’t put an account in a second business', async () => {
    const a = await addBusiness(db, 'Alder Builders')
    const b = await addBusiness(db, 'Birch Co')
    const { uid } = await addMember(db, auth, a, 'alice@example.test')
    await expect(addMember(db, auth, b, 'alice@example.test')).rejects.toThrow(/already belongs/)
    expect((await db.doc(`users/${uid}`).get()).data()).toEqual({ businessId: a })
    expect(await listMembers(db, b)).toEqual([])
  })

  it('adding the same member twice is harmless', async () => {
    const id = await addBusiness(db, 'Alder Builders')
    const first = await addMember(db, auth, id, 'alice@example.test')
    const second = await addMember(db, auth, id, 'alice@example.test')
    expect(second.uid).toBe(first.uid)
    expect(await listMembers(db, id)).toHaveLength(1)
  })

  it('won’t add anyone to a business that doesn’t exist', async () => {
    await expect(addMember(db, auth, 'nope', 'alice@example.test')).rejects.toThrow(/no business/)
  })

  it('removing a member takes away access and turns off the login; adding them back undoes it', async () => {
    const id = await addBusiness(db, 'Alder Builders')
    const { uid } = await addMember(db, auth, id, 'alice@example.test')
    await removeMember(db, auth, id, 'alice@example.test')
    expect((await db.doc(`users/${uid}`).get()).exists).toBe(false)
    expect(await listMembers(db, id)).toEqual([])
    expect((await auth.getUser(uid)).disabled).toBe(true)
    await assertFails(canReadBusiness(uid, id))

    await addMember(db, auth, id, 'alice@example.test')
    expect((await auth.getUser(uid)).disabled).toBe(false)
    await assertSucceeds(canReadBusiness(uid, id))
  })

  it('won’t remove someone from a business they’re not in', async () => {
    const a = await addBusiness(db, 'Alder Builders')
    const b = await addBusiness(db, 'Birch Co')
    await addMember(db, auth, a, 'alice@example.test')
    await expect(removeMember(db, auth, b, 'alice@example.test')).rejects.toThrow(/isn’t a member/)
  })
})

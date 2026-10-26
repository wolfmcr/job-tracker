import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { createRulesEnv } from './test/rulesEnv'

let env: RulesTestEnvironment

beforeAll(async () => { env = await createRulesEnv() })
afterAll(() => env.cleanup())
beforeEach(() => env.clearFirestore())

describe('firestore rules', () => {
  it('denies signed-out users', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(db.collection('jobs').get())
    await assertFails(db.collection('jobs').add({ name: 'x' }))
  })

  it('allows a signed-in user', async () => {
    const db = env.authenticatedContext('someone').firestore()
    await assertSucceeds(db.collection('jobs').get())
  })
})

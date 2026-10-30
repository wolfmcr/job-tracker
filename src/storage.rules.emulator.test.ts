import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { OWNER_UID } from './test/emulatorDb'
import { createRulesEnv } from './test/rulesEnv'

let env: RulesTestEnvironment

beforeAll(async () => { env = await createRulesEnv() })
afterAll(() => env.cleanup())
beforeEach(() => env.clearStorage())

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])

function put(context: ReturnType<RulesTestEnvironment['authenticatedContext']>, path: string, bytes = jpeg, contentType = 'image/jpeg') {
  return context.storage().ref(path).put(bytes, { contentType }).then(snapshot => snapshot)
}

describe('receipt photos', () => {
  it('the owner can upload, read and delete a receipt photo', async () => {
    const owner = env.authenticatedContext(OWNER_UID)
    await assertSucceeds(put(owner, 'receipts/abc123.jpg'))
    await assertSucceeds(owner.storage().ref('receipts/abc123.jpg').getDownloadURL())
    await assertSucceeds(owner.storage().ref('receipts/abc123.jpg').delete())
  })

  it('nobody else can read or write', async () => {
    await env.withSecurityRulesDisabled(async ctx => { await ctx.storage().ref('receipts/abc123.jpg').put(jpeg, { contentType: 'image/jpeg' }) })
    for (const context of [env.unauthenticatedContext(), env.authenticatedContext('someone-else')]) {
      await assertFails(context.storage().ref('receipts/abc123.jpg').getDownloadURL())
      await assertFails(put(context, 'receipts/xyz.jpg'))
    }
  })

  it('only JPEGs under 5MB, named after a receipt, in receipts/', async () => {
    const owner = env.authenticatedContext(OWNER_UID)
    await assertFails(put(owner, 'receipts/abc123.png', jpeg, 'image/png'))
    await assertFails(put(owner, 'receipts/abc123.jpg', jpeg, 'text/html'))
    await assertFails(put(owner, 'receipts/../abc.jpg'))
    await assertFails(put(owner, 'other/abc123.jpg'))
    await assertFails(put(owner, 'receipts/abc123.jpg', new Uint8Array(5 * 1024 * 1024)))
  })
})

describe('allowed accounts', () => {
  it('match between the Firestore and Storage rules', () => {
    const uids = (file: string) => readFileSync(file, 'utf8').match(/request\.auth\.uid in \[([^\]]*)\]/)![1].match(/'[^']+'/g)
    expect(uids('storage.rules')).toEqual(uids('firestore.rules'))
  })
})

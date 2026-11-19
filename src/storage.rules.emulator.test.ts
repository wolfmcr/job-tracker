import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, setDoc, type DocumentData, type Firestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { createRulesEnv } from './test/rulesEnv'

let env: RulesTestEnvironment

// storage.rules looks membership up in Firestore, so both emulators take part in these
beforeAll(async () => { env = await createRulesEnv() })
afterAll(() => env.cleanup())
beforeEach(async () => {
  await env.clearStorage()
  await env.clearFirestore()
  await seed('businesses/a/members/alice', { email: 'alice@example.test' })
  await seed('businesses/b/members/bob', { email: 'bob@example.test' })
})

async function seed(path: string, data: DocumentData) {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore() as unknown as Firestore, path), data))
}

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
const PHOTO = 'businesses/a/receipts/abc123.jpg'

function put(context: ReturnType<RulesTestEnvironment['authenticatedContext']>, path: string, bytes = jpeg, contentType = 'image/jpeg') {
  return context.storage().ref(path).put(bytes, { contentType }).then(snapshot => snapshot)
}

describe('receipt photos', () => {
  it('a member can upload, read and delete their business’s receipt photos', async () => {
    const alice = env.authenticatedContext('alice')
    await assertSucceeds(put(alice, PHOTO))
    await assertSucceeds(alice.storage().ref(PHOTO).getDownloadURL())
    await assertSucceeds(alice.storage().ref(PHOTO).delete())
  })

  it('another business, an outsider or someone signed out can’t read or write them', async () => {
    await env.withSecurityRulesDisabled(async ctx => { await ctx.storage().ref(PHOTO).put(jpeg, { contentType: 'image/jpeg' }) })
    for (const context of [env.authenticatedContext('bob'), env.authenticatedContext('stranger'), env.unauthenticatedContext()]) {
      await assertFails(context.storage().ref(PHOTO).getDownloadURL())
      await assertFails(context.storage().ref(PHOTO).delete())
      await assertFails(put(context, 'businesses/a/receipts/xyz.jpg'))
    }
  })

  it('a removed member loses access straight away', async () => {
    const alice = env.authenticatedContext('alice')
    await assertSucceeds(put(alice, PHOTO))
    await env.withSecurityRulesDisabled(ctx => deleteDoc(doc(ctx.firestore() as unknown as Firestore, 'businesses/a/members/alice')))
    await assertFails(alice.storage().ref(PHOTO).getDownloadURL())
  })

  it('only JPEGs under 5MB, named after a receipt, in the business’s receipts folder', async () => {
    const alice = env.authenticatedContext('alice')
    await assertFails(put(alice, 'businesses/a/receipts/abc123.png', jpeg, 'image/png'))
    await assertFails(put(alice, PHOTO, jpeg, 'text/html'))
    await assertFails(put(alice, 'businesses/a/receipts/../abc.jpg'))
    await assertFails(put(alice, 'businesses/a/other/abc123.jpg'))
    await assertFails(put(alice, 'receipts/abc123.jpg'))
    await assertFails(put(alice, PHOTO, new Uint8Array(5 * 1024 * 1024)))
  })
})

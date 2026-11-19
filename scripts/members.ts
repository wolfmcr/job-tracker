// Businesses and their members, managed with the Admin SDK (which firestore.rules doesn't apply to).
// Used by scripts/admin.ts; kept apart so the emulator tests can run the same code.
import { randomBytes } from 'node:crypto'
import type { Auth } from 'firebase-admin/auth'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'

function errorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error ? error.code : undefined
}

export async function addBusiness(db: Firestore, name: string) {
  const ref = db.collection('businesses').doc()
  await ref.create({ name, createdAt: FieldValue.serverTimestamp() })
  return ref.id
}

// Creates the login if there isn't one (with a random password nobody knows; the person sets
// their own from the reset link), then makes them a member. Every account belongs to one
// business at most, since the app loads exactly one.
export async function addMember(db: Firestore, auth: Auth, businessId: string, email: string) {
  if (!(await db.doc(`businesses/${businessId}`).get()).exists) throw new Error(`There’s no business ${businessId}`)

  let user
  try {
    user = await auth.getUserByEmail(email)
  } catch (error) {
    if (errorCode(error) !== 'auth/user-not-found') throw error
    user = await auth.createUser({ email, password: randomBytes(24).toString('base64url') })
  }

  const userRef = db.doc(`users/${user.uid}`)
  await db.runTransaction(async transaction => {
    const current: unknown = (await transaction.get(userRef)).get('businessId')
    if (current && current !== businessId) {
      throw new Error(`${email} already belongs to business ${current}. Remove them there first.`)
    }
    transaction.set(db.doc(`businesses/${businessId}/members/${user.uid}`), { email, addedAt: FieldValue.serverTimestamp() })
    transaction.set(userRef, { businessId })
  })
  // Someone removed earlier and now added back
  if (user.disabled) await auth.updateUser(user.uid, { disabled: false })

  return { uid: user.uid, resetLink: await auth.generatePasswordResetLink(email) }
}

// Takes away access at once (the rules check membership on every request) and turns the login off
export async function removeMember(db: Firestore, auth: Auth, businessId: string, email: string) {
  const user = await auth.getUserByEmail(email)
  const userRef = db.doc(`users/${user.uid}`)
  await db.runTransaction(async transaction => {
    if ((await transaction.get(userRef)).get('businessId') !== businessId) {
      throw new Error(`${email} isn’t a member of business ${businessId}`)
    }
    transaction.delete(db.doc(`businesses/${businessId}/members/${user.uid}`))
    transaction.delete(userRef)
  })
  await auth.updateUser(user.uid, { disabled: true })
  await auth.revokeRefreshTokens(user.uid)
}

export async function listBusinesses(db: Firestore) {
  const snapshot = await db.collection('businesses').get()
  return snapshot.docs.map(doc => ({ id: doc.id, name: String(doc.get('name') ?? '') }))
}

export async function listMembers(db: Firestore, businessId: string) {
  const snapshot = await db.collection(`businesses/${businessId}/members`).get()
  return snapshot.docs.map(doc => ({ uid: doc.id, email: String(doc.get('email') ?? '') }))
}

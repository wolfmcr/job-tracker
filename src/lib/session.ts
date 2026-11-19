import { signOut } from 'firebase/auth'
import { auth } from './firebase'

// A full reload leaves nothing of the old account behind: no live listeners, no business, no state
export async function signOutAndReload() {
  await signOut(auth)
  window.location.reload()
}

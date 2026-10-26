import { showToast } from '../lib/toast'

// Long enough for a slow connection; a write still pending after this almost certainly isn't getting through
export const SAVE_TIMEOUT_MS = 15_000

export const SAVE_FAILED = 'Couldn’t save that change. Please try again.'
export const SAVE_SLOW = 'Can’t reach the server. Your last change may not be saved.'

// Every Firestore write goes through here. Changes show on screen straight away (Firestore applies
// them locally first), so callers don't wait; if the server rejects the write or never confirms it,
// the user gets told instead of the change quietly disappearing. Resolves to whether it saved.
export function write(operation: Promise<unknown>): Promise<boolean> {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      showToast(SAVE_SLOW)
      resolve(false)
    }, SAVE_TIMEOUT_MS)
    operation.then(
      () => {
        clearTimeout(timer)
        resolve(true)
      },
      (error: unknown) => {
        clearTimeout(timer)
        console.error('[write] failed', error)
        showToast(SAVE_FAILED)
        resolve(false)
      },
    )
  })
}

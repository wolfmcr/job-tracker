import type { Timestamp } from 'firebase/firestore'

// Enough of a Firestore Timestamp for code that only reads it
export function ts(millis: number) {
  return { toMillis: () => millis, toDate: () => new Date(millis) } as Timestamp
}

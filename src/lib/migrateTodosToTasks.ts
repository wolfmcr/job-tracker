import { collectionGroup, doc, getDocsFromServer, limit, query, writeBatch } from 'firebase/firestore'
import { db } from './firebase'

const BATCH_SIZE = 400

// Old free-text details → bullets: one per line, dropping any "-", "*", "•" or "1." prefix
function detailsToBullets(details: unknown) {
  if (typeof details !== 'string') return []
  return details
    .split('\n')
    .map(line => line.replace(/^\s*([-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
}

// One-off: copies jobs/*/todoItems into jobs/*/tasks (same ids), converting details to bullets.
// Skips once any task exists, so it runs at most once. The old todoItems are left as a backup.
// Remove this (and the todoItems rules/indexes) once they've been deleted.
export async function migrateTodosToTasks() {
  const existing = await getDocsFromServer(query(collectionGroup(db, 'tasks'), limit(1)))
  if (!existing.empty) return

  const old = await getDocsFromServer(collectionGroup(db, 'todoItems'))
  if (old.empty) return

  for (let i = 0; i < old.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    for (const snap of old.docs.slice(i, i + BATCH_SIZE)) {
      const { details, ...rest } = snap.data()
      const jobId = snap.ref.path.split('/')[1]
      const bullets = detailsToBullets(details)
      batch.set(doc(db, 'jobs', jobId, 'tasks', snap.id), bullets.length > 0 ? { ...rest, bullets } : rest)
    }
    await batch.commit()
  }
  console.info(`[migrateTodosToTasks] copied ${old.size} todoItems to tasks`)
}

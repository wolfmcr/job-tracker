// Copies the live project's data, in the original single-owner layout (jobs, employees and receipts
// at the top level, tasks and shopping under each job, photos in receipts/), into one business's
// place in the new layout (businesses/{id}/...) in the beta project. It only reads from the live
// project, never changes or deletes anything there, so the live app keeps working as it is.
//
// Document IDs are kept, so running it again updates what's there instead of duplicating it.
// Documents deleted from the old layout after a run aren't deleted from the new one, so run it
// for the last time just before switching over.
import type { DocumentData, Firestore } from 'firebase-admin/firestore'
import type { getStorage } from 'firebase-admin/storage'

type Bucket = ReturnType<ReturnType<typeof getStorage>['bucket']>

export interface Project {
  db: Firestore
  bucket: Bucket
}

export interface MigrationCounts {
  jobs: number
  tasks: number
  shoppingItems: number
  employees: number
  timeEntries: number
  payments: number
  receipts: number
  photos: number
  // Receipts whose photo was already gone from Storage; they come over without one, as the app shows them now
  missingPhotos: number
}

// Just enough of each shape that a document the rules would reject stops the run before anything
// is written, since the Admin SDK writes past the rules
const REQUIRED: Record<string, string[]> = {
  jobs: ['name', 'address', 'isDone', 'isArchived', 'createdAt', 'updatedAt'],
  tasks: ['jobId', 'text', 'isDone', 'createdAt'],
  shoppingItems: ['jobId', 'qty', 'name', 'isGot', 'createdAt'],
  employees: ['name', 'hourlyRate', 'createdAt'],
  timeEntries: ['date', 'hours', 'rate', 'note', 'createdAt'],
  payments: ['date', 'amount', 'note', 'createdAt'],
  receipts: ['store', 'date', 'tax', 'total', 'items', 'jobIds', 'note', 'createdAt'],
}

function check(kind: string, path: string, data: DocumentData) {
  const missing = REQUIRED[kind].filter(field => !(field in data))
  if (missing.length > 0) throw new Error(`${path} is missing ${missing.join(', ')}; nothing was written`)
}

const oldPhotoPath = (receiptId: string) => `receipts/${receiptId}.jpg`

export async function importLive(from: Project, into: Project, businessId: string, { dryRun = false } = {}) {
  if (!(await into.db.doc(`businesses/${businessId}`).get()).exists) throw new Error(`There’s no business ${businessId}`)
  const db = from.db
  const to = (path: string) => `businesses/${businessId}/${path}`

  // Read and check everything first, so a bad document stops the run before any write
  const writes: { path: string; data: DocumentData }[] = []
  const photos: { from: string; to: string }[] = []
  const counts: MigrationCounts = { jobs: 0, tasks: 0, shoppingItems: 0, employees: 0, timeEntries: 0, payments: 0, receipts: 0, photos: 0, missingPhotos: 0 }
  const add = (kind: keyof typeof REQUIRED & keyof MigrationCounts, path: string, data: DocumentData) => {
    check(kind, path, data)
    writes.push({ path, data })
    counts[kind]++
  }

  for (const job of (await db.collection('jobs').get()).docs) {
    add('jobs', to(`jobs/${job.id}`), job.data())
    // Tasks and shopping move out from under their job, carrying its ID instead
    for (const task of (await job.ref.collection('tasks').get()).docs) {
      add('tasks', to(`tasks/${task.id}`), { ...task.data(), jobId: job.id })
    }
    for (const item of (await job.ref.collection('shoppingItems').get()).docs) {
      add('shoppingItems', to(`shoppingItems/${item.id}`), { ...item.data(), jobId: job.id })
    }
  }

  for (const employee of (await db.collection('employees').get()).docs) {
    add('employees', to(`employees/${employee.id}`), employee.data())
    for (const entry of (await employee.ref.collection('timeEntries').get()).docs) {
      add('timeEntries', to(`employees/${employee.id}/timeEntries/${entry.id}`), entry.data())
    }
    for (const payment of (await employee.ref.collection('payments').get()).docs) {
      add('payments', to(`employees/${employee.id}/payments/${payment.id}`), payment.data())
    }
  }

  for (const receipt of (await db.collection('receipts').get()).docs) {
    const { photoPath, ...data } = receipt.data()
    if (photoPath !== undefined && photoPath !== oldPhotoPath(receipt.id)) {
      throw new Error(`receipts/${receipt.id} has an unexpected photoPath ${photoPath}; nothing was written`)
    }
    const newPhotoPath = to(`receipts/${receipt.id}.jpg`)
    const hasPhoto = photoPath !== undefined && (await from.bucket.file(photoPath).exists())[0]
    if (photoPath !== undefined && !hasPhoto) counts.missingPhotos++
    add('receipts', to(`receipts/${receipt.id}`), hasPhoto ? { ...data, photoPath: newPhotoPath } : data)
    if (hasPhoto) {
      photos.push({ from: photoPath, to: newPhotoPath })
      counts.photos++
    }
  }

  if (dryRun) return counts

  // Photos first, so no receipt in the new layout ever points at a photo that isn't there yet
  for (const photo of photos) {
    const [bytes] = await from.bucket.file(photo.from).download()
    await into.bucket.file(photo.to).save(bytes, { contentType: 'image/jpeg' })
  }

  const writer = into.db.bulkWriter()
  for (const { path, data } of writes) void writer.set(into.db.doc(path), data)
  await writer.close()

  return counts
}

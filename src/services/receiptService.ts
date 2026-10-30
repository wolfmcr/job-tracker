import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { deleteObject, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { receiptJobIds } from '../lib/receipts'
import type { Receipt } from '../types'
import { write } from './write'

export type ReceiptFields = Pick<Receipt, 'store' | 'date' | 'tax' | 'total' | 'items' | 'note'>

// The ID is picked before saving so the photo can be uploaded under it first
export function newReceiptId() {
  return doc(collection(db, 'receipts')).id
}

export function receiptPhotoPath(receiptId: string) {
  return `receipts/${receiptId}.jpg`
}

// Resolves to the photo's path, or null if it didn't upload (the user has been told)
export async function uploadReceiptPhoto(receiptId: string, photo: Blob) {
  const path = receiptPhotoPath(receiptId)
  return (await write(uploadBytes(ref(storage, path), photo, { contentType: 'image/jpeg' }))) ? path : null
}

export function addReceipt(receiptId: string, fields: ReceiptFields, photoPath: string | null) {
  return write(setDoc(doc(db, 'receipts', receiptId), {
    ...fields,
    jobIds: receiptJobIds(fields.items),
    ...(photoPath ? { photoPath } : {}),
    createdAt: serverTimestamp(),
  }))
}

export function updateReceipt(receiptId: string, fields: ReceiptFields) {
  return write(updateDoc(doc(db, 'receipts', receiptId), { ...fields, jobIds: receiptJobIds(fields.items) }))
}

export async function deleteReceipt(receipt: Pick<Receipt, 'id' | 'photoPath'>) {
  const deleted = await write(deleteDoc(doc(db, 'receipts', receipt.id)))
  // A photo left behind is harmless, so this one doesn't bother the user
  if (deleted && receipt.photoPath) {
    await deleteObject(ref(storage, receipt.photoPath)).catch(error => console.error('[receipts] photo not deleted', error))
  }
  return deleted
}

// For a photo uploaded for a receipt that then wasn't saved
export function discardReceiptPhoto(path: string) {
  deleteObject(ref(storage, path)).catch(error => console.error('[receipts] photo not discarded', error))
}

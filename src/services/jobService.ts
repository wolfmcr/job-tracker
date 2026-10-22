import { addDoc, collection, deleteDoc, deleteField, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Job, ShoppingItem, Task } from '../types'

export type JobFields = Pick<Job, 'name' | 'address' | 'color' | 'clientName' | 'clientPhone' | 'notes'>

export async function addJob(fields: JobFields) {
  await addDoc(collection(db, 'jobs'), {
    ...fields,
    isDone: false,
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateJob(jobId: string, fields: Partial<JobFields>) {
  await updateDoc(doc(db, 'jobs', jobId), {
    ...fields,
    updatedAt: serverTimestamp(),
  })
}

export async function toggleJobDone(jobId: string, isDone: boolean) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isDone,
    updatedAt: serverTimestamp(),
  })
}

export async function archiveJob(jobId: string) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isArchived: true,
    updatedAt: serverTimestamp(),
  })
}

export async function restoreJob(jobId: string) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isArchived: false,
    isDone: false,
    updatedAt: serverTimestamp(),
  })
}

export async function completeJob(jobId: string) {
  await updateDoc(doc(db, 'jobs', jobId), {
    isDone: true,
    isArchived: true,
    updatedAt: serverTimestamp(),
  })
}

export type ShoppingItemFields = Pick<ShoppingItem, 'qty' | 'name' | 'priority'>

export async function addShoppingItem(jobId: string, fields: ShoppingItemFields, taskId?: string) {
  await addDoc(collection(db, 'jobs', jobId, 'shoppingItems'), {
    ...fields,
    ...(taskId && { taskId }),
    isGot: false,
    createdAt: serverTimestamp(),
  })
}

export async function toggleShoppingItem(jobId: string, itemId: string, isGot: boolean) {
  await updateDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId), { isGot })
}

export async function updateShoppingItem(jobId: string, itemId: string, fields: ShoppingItemFields) {
  await updateDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId), fields)
}

export async function deleteShoppingItem(jobId: string, itemId: string) {
  await deleteDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId))
}

export type TaskFields = Pick<Task, 'text' | 'bullets' | 'priority'> & { dueDate: string } // '' = no due date

export async function addTask(jobId: string, { dueDate, ...fields }: TaskFields) {
  await addDoc(collection(db, 'jobs', jobId, 'tasks'), {
    ...fields,
    ...(dueDate && { dueDate }),
    isDone: false,
    createdAt: serverTimestamp(),
  })
}

export async function toggleTask(jobId: string, taskId: string, isDone: boolean) {
  await updateDoc(doc(db, 'jobs', jobId, 'tasks', taskId), {
    isDone,
    completedAt: isDone ? serverTimestamp() : deleteField(),
  })
}

export async function updateTask(jobId: string, taskId: string, { dueDate, ...fields }: TaskFields) {
  await updateDoc(doc(db, 'jobs', jobId, 'tasks', taskId), {
    ...fields,
    dueDate: dueDate || deleteField(),
  })
}

// The task's shopping items are either deleted with it or kept on the job's list without the task link
export async function deleteTask(jobId: string, taskId: string, shoppingItemIds: string[], deleteShopping: boolean) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'jobs', jobId, 'tasks', taskId))
  for (const itemId of shoppingItemIds) {
    const ref = doc(db, 'jobs', jobId, 'shoppingItems', itemId)
    if (deleteShopping) batch.delete(ref)
    else batch.update(ref, { taskId: deleteField() })
  }
  await batch.commit()
}

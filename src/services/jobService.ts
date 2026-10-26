import { addDoc, collection, deleteDoc, deleteField, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { write } from './write'
import type { Job, ShoppingItem, Task } from '../types'

export type JobFields = Pick<Job, 'name' | 'address' | 'color' | 'clientName' | 'clientPhone' | 'notes'>

export function addJob(fields: JobFields) {
  return write(addDoc(collection(db, 'jobs'), {
    ...fields,
    isDone: false,
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
}

export function updateJob(jobId: string, fields: Partial<JobFields>) {
  return write(updateDoc(doc(db, 'jobs', jobId), {
    ...fields,
    updatedAt: serverTimestamp(),
  }))
}

export function toggleJobDone(jobId: string, isDone: boolean) {
  return write(updateDoc(doc(db, 'jobs', jobId), {
    isDone,
    updatedAt: serverTimestamp(),
  }))
}

export function archiveJob(jobId: string) {
  return write(updateDoc(doc(db, 'jobs', jobId), {
    isArchived: true,
    updatedAt: serverTimestamp(),
  }))
}

export function restoreJob(jobId: string) {
  return write(updateDoc(doc(db, 'jobs', jobId), {
    isArchived: false,
    isDone: false,
    updatedAt: serverTimestamp(),
  }))
}

export function completeJob(jobId: string) {
  return write(updateDoc(doc(db, 'jobs', jobId), {
    isDone: true,
    isArchived: true,
    updatedAt: serverTimestamp(),
  }))
}

export type ShoppingItemFields = Pick<ShoppingItem, 'qty' | 'name' | 'priority'>

export function addShoppingItem(jobId: string, fields: ShoppingItemFields, taskId?: string) {
  return write(addDoc(collection(db, 'jobs', jobId, 'shoppingItems'), {
    ...fields,
    ...(taskId && { taskId }),
    isGot: false,
    createdAt: serverTimestamp(),
  }))
}

export function toggleShoppingItem(jobId: string, itemId: string, isGot: boolean) {
  return write(updateDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId), { isGot }))
}

export function updateShoppingItem(jobId: string, itemId: string, fields: ShoppingItemFields) {
  return write(updateDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId), fields))
}

export function deleteShoppingItem(jobId: string, itemId: string) {
  return write(deleteDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId)))
}

export type TaskFields = Pick<Task, 'text' | 'bullets' | 'priority'> & { dueDate: string } // '' = no due date

export function addTask(jobId: string, { dueDate, ...fields }: TaskFields) {
  return write(addDoc(collection(db, 'jobs', jobId, 'tasks'), {
    ...fields,
    ...(dueDate && { dueDate }),
    isDone: false,
    createdAt: serverTimestamp(),
  }))
}

export function toggleTask(jobId: string, taskId: string, isDone: boolean) {
  return write(updateDoc(doc(db, 'jobs', jobId, 'tasks', taskId), {
    isDone,
    completedAt: isDone ? serverTimestamp() : deleteField(),
  }))
}

export function updateTask(jobId: string, taskId: string, { dueDate, ...fields }: TaskFields) {
  return write(updateDoc(doc(db, 'jobs', jobId, 'tasks', taskId), {
    ...fields,
    dueDate: dueDate || deleteField(),
  }))
}

// The task's shopping items are either deleted with it or kept on the job's list without the task link
export function deleteTask(jobId: string, taskId: string, shoppingItemIds: string[], deleteShopping: boolean) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'jobs', jobId, 'tasks', taskId))
  for (const itemId of shoppingItemIds) {
    const ref = doc(db, 'jobs', jobId, 'shoppingItems', itemId)
    if (deleteShopping) batch.delete(ref)
    else batch.update(ref, { taskId: deleteField() })
  }
  return write(batch.commit())
}

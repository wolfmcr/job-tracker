import { addDoc, deleteDoc, deleteField, runTransaction, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { bizCollection, bizDoc } from '../lib/business'
import { db } from '../lib/firebase'
import { write } from './write'
import type { Job, ShoppingItem, Task } from '../types'

export type JobFields = Pick<Job, 'name' | 'address' | 'color' | 'clientName' | 'clientPhone' | 'notes'>

export function addJob(fields: JobFields) {
  return write(addDoc(bizCollection('jobs'), {
    ...fields,
    isDone: false,
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }))
}

export function updateJob(jobId: string, fields: Partial<JobFields>) {
  return write(updateDoc(bizDoc('jobs', jobId), {
    ...fields,
    updatedAt: serverTimestamp(),
  }))
}

export function toggleJobDone(jobId: string, isDone: boolean) {
  return write(updateDoc(bizDoc('jobs', jobId), {
    isDone,
    updatedAt: serverTimestamp(),
  }))
}

export function archiveJob(jobId: string) {
  return write(updateDoc(bizDoc('jobs', jobId), {
    isArchived: true,
    updatedAt: serverTimestamp(),
  }))
}

export function restoreJob(jobId: string) {
  return write(updateDoc(bizDoc('jobs', jobId), {
    isArchived: false,
    isDone: false,
    updatedAt: serverTimestamp(),
  }))
}

export function completeJob(jobId: string) {
  return write(updateDoc(bizDoc('jobs', jobId), {
    isDone: true,
    isArchived: true,
    updatedAt: serverTimestamp(),
  }))
}

// Shopping items and tasks live in the business's own collections, each naming its job
export type ShoppingItemFields = Pick<ShoppingItem, 'qty' | 'name' | 'priority'>

export function addShoppingItem(jobId: string, fields: ShoppingItemFields, taskId?: string) {
  return write(addDoc(bizCollection('shoppingItems'), {
    ...fields,
    jobId,
    ...(taskId && { taskId }),
    isGot: false,
    createdAt: serverTimestamp(),
  }))
}

export function toggleShoppingItem(itemId: string, isGot: boolean) {
  return write(updateDoc(bizDoc('shoppingItems', itemId), { isGot }))
}

export function updateShoppingItem(itemId: string, fields: ShoppingItemFields) {
  return write(updateDoc(bizDoc('shoppingItems', itemId), fields))
}

export function deleteShoppingItem(itemId: string) {
  return write(deleteDoc(bizDoc('shoppingItems', itemId)))
}

export type TaskFields = Pick<Task, 'text' | 'bullets' | 'priority'> & { dueDate: string } // '' = no due date

export function addTask(jobId: string, { dueDate, ...fields }: TaskFields) {
  return write(addDoc(bizCollection('tasks'), {
    ...fields,
    jobId,
    ...(dueDate && { dueDate }),
    isDone: false,
    createdAt: serverTimestamp(),
  }))
}

export function toggleTask(taskId: string, isDone: boolean) {
  return write(updateDoc(bizDoc('tasks', taskId), {
    isDone,
    completedAt: isDone ? serverTimestamp() : deleteField(),
  }))
}

export function updateTask(taskId: string, { dueDate, ...fields }: TaskFields) {
  return write(updateDoc(bizDoc('tasks', taskId), {
    ...fields,
    dueDate: dueDate || deleteField(),
  }))
}

// The task's shopping items are either deleted with it or kept on the job's list without the task link
export function deleteTask(taskId: string, shoppingItemIds: string[], deleteShopping: boolean) {
  const taskRef = bizDoc('tasks', taskId)
  const itemRefs = shoppingItemIds.map(itemId => bizDoc('shoppingItems', itemId))
  if (deleteShopping) {
    // Deleting a document that's already gone is fine, so a batch will do
    const batch = writeBatch(db)
    batch.delete(taskRef)
    for (const ref of itemRefs) batch.delete(ref)
    return write(batch.commit())
  }
  // Unlinking an item deleted elsewhere since the list was shown would fail the whole delete,
  // so check which still exist first and skip the rest
  return write(runTransaction(db, async transaction => {
    const items = await Promise.all(itemRefs.map(ref => transaction.get(ref)))
    transaction.delete(taskRef)
    for (const item of items) if (item.exists()) transaction.update(item.ref, { taskId: deleteField() })
  }))
}

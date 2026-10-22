import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Job, Task } from '../types'

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

export async function addShoppingItem(jobId: string, qty: string, name: string) {
  await addDoc(collection(db, 'jobs', jobId, 'shoppingItems'), {
    qty,
    name,
    isGot: false,
    createdAt: serverTimestamp(),
  })
}

export async function toggleShoppingItem(jobId: string, itemId: string, isGot: boolean) {
  await updateDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId), { isGot })
}

export async function setShoppingItemPriority(jobId: string, itemId: string, priority: number) {
  await updateDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId), { priority })
}

export async function updateShoppingItem(jobId: string, itemId: string, qty: string, name: string) {
  await updateDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId), { qty, name })
}

export async function deleteShoppingItem(jobId: string, itemId: string) {
  await deleteDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId))
}

export type TaskFields = Pick<Task, 'text' | 'bullets' | 'priority'>

export async function addTask(jobId: string, fields: TaskFields) {
  await addDoc(collection(db, 'jobs', jobId, 'tasks'), {
    ...fields,
    isDone: false,
    createdAt: serverTimestamp(),
  })
}

export async function toggleTask(jobId: string, taskId: string, isDone: boolean) {
  await updateDoc(doc(db, 'jobs', jobId, 'tasks', taskId), { isDone })
}

export async function setTaskPriority(jobId: string, taskId: string, priority: number) {
  await updateDoc(doc(db, 'jobs', jobId, 'tasks', taskId), { priority })
}

export async function updateTask(jobId: string, taskId: string, fields: TaskFields) {
  await updateDoc(doc(db, 'jobs', jobId, 'tasks', taskId), fields)
}

export async function deleteTask(jobId: string, taskId: string) {
  await deleteDoc(doc(db, 'jobs', jobId, 'tasks', taskId))
}

import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function addJob(name: string, address: string, color: string) {
  await addDoc(collection(db, 'jobs'), {
    name,
    address,
    color,
    isDone: false,
    isArchived: false,
    createdAt: serverTimestamp(),
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

export async function deleteShoppingItem(jobId: string, itemId: string) {
  const { deleteDoc } = await import('firebase/firestore')
  await deleteDoc(doc(db, 'jobs', jobId, 'shoppingItems', itemId))
}

export async function addTodoItem(jobId: string, text: string) {
  await addDoc(collection(db, 'jobs', jobId, 'todoItems'), {
    text,
    isDone: false,
    createdAt: serverTimestamp(),
  })
}

export async function toggleTodoItem(jobId: string, itemId: string, isDone: boolean) {
  await updateDoc(doc(db, 'jobs', jobId, 'todoItems', itemId), { isDone })
}

export async function deleteTodoItem(jobId: string, itemId: string) {
  const { deleteDoc } = await import('firebase/firestore')
  await deleteDoc(doc(db, 'jobs', jobId, 'todoItems', itemId))
}

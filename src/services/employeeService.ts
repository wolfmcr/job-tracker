import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function addEmployee(name: string, hourlyRate: number) {
  await addDoc(collection(db, 'employees'), {
    name,
    hourlyRate,
    createdAt: serverTimestamp(),
  })
}

export async function updateEmployee(employeeId: string, name: string, hourlyRate: number) {
  await updateDoc(doc(db, 'employees', employeeId), { name, hourlyRate })
}

export async function addTimeEntry(employeeId: string, date: string, hours: number, rate: number, note: string) {
  await addDoc(collection(db, 'employees', employeeId, 'timeEntries'), {
    date,
    hours,
    rate,
    note,
    createdAt: serverTimestamp(),
  })
}

export async function updateTimeEntry(employeeId: string, entryId: string, date: string, hours: number, note: string) {
  await updateDoc(doc(db, 'employees', employeeId, 'timeEntries', entryId), { date, hours, note })
}

export async function deleteTimeEntry(employeeId: string, entryId: string) {
  await deleteDoc(doc(db, 'employees', employeeId, 'timeEntries', entryId))
}

export async function addPayment(employeeId: string, date: string, amount: number, note: string) {
  await addDoc(collection(db, 'employees', employeeId, 'payments'), {
    date,
    amount,
    note,
    createdAt: serverTimestamp(),
  })
}

export async function updatePayment(employeeId: string, paymentId: string, date: string, amount: number, note: string) {
  await updateDoc(doc(db, 'employees', employeeId, 'payments', paymentId), { date, amount, note })
}

export async function deletePayment(employeeId: string, paymentId: string) {
  await deleteDoc(doc(db, 'employees', employeeId, 'payments', paymentId))
}

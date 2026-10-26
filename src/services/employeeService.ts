import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { write } from './write'

export function addEmployee(name: string, hourlyRate: number) {
  return write(addDoc(collection(db, 'employees'), {
    name,
    hourlyRate,
    createdAt: serverTimestamp(),
  }))
}

export function updateEmployee(employeeId: string, name: string, hourlyRate: number) {
  return write(updateDoc(doc(db, 'employees', employeeId), { name, hourlyRate }))
}

export function addTimeEntry(employeeId: string, date: string, hours: number, rate: number, note: string) {
  return write(addDoc(collection(db, 'employees', employeeId, 'timeEntries'), {
    date,
    hours,
    rate,
    note,
    createdAt: serverTimestamp(),
  }))
}

export function updateTimeEntry(employeeId: string, entryId: string, date: string, hours: number, note: string) {
  return write(updateDoc(doc(db, 'employees', employeeId, 'timeEntries', entryId), { date, hours, note }))
}

export function deleteTimeEntry(employeeId: string, entryId: string) {
  return write(deleteDoc(doc(db, 'employees', employeeId, 'timeEntries', entryId)))
}

export function addPayment(employeeId: string, date: string, amount: number, note: string) {
  return write(addDoc(collection(db, 'employees', employeeId, 'payments'), {
    date,
    amount,
    note,
    createdAt: serverTimestamp(),
  }))
}

export function updatePayment(employeeId: string, paymentId: string, date: string, amount: number, note: string) {
  return write(updateDoc(doc(db, 'employees', employeeId, 'payments', paymentId), { date, amount, note }))
}

export function deletePayment(employeeId: string, paymentId: string) {
  return write(deleteDoc(doc(db, 'employees', employeeId, 'payments', paymentId)))
}

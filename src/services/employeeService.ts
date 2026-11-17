import { addDoc, collection, deleteDoc, deleteField, doc, serverTimestamp, Timestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { pausedMsAt } from '../lib/timer'
import { db } from '../lib/firebase'
import type { Timer } from '../types'
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

// The timer's times come from this device's clock, like the rest of the session maths
function setTimer(employeeId: string, timer: Timer) {
  return write(updateDoc(doc(db, 'employees', employeeId), { timer }))
}

export function startTimer(employeeId: string) {
  return setTimer(employeeId, { startedAt: Timestamp.now(), pausedAt: null, pausedMs: 0 })
}

export function pauseTimer(employeeId: string, timer: Timer) {
  if (timer.pausedAt) return Promise.resolve(true)
  return setTimer(employeeId, { ...timer, pausedAt: Timestamp.now() })
}

export function resumeTimer(employeeId: string, timer: Timer) {
  return setTimer(employeeId, { ...timer, pausedAt: null, pausedMs: pausedMsAt(timer, Date.now()) })
}

export function setTimerStart(employeeId: string, timer: Timer, startMs: number) {
  return setTimer(employeeId, { ...timer, startedAt: Timestamp.fromMillis(startMs) })
}

export function discardTimer(employeeId: string) {
  return write(updateDoc(doc(db, 'employees', employeeId), { timer: deleteField() }))
}

// Logs the session and clears the timer together, so it's never logged twice or lost
export function logTimerSession(employeeId: string, date: string, hours: number, rate: number, note: string) {
  const batch = writeBatch(db)
  batch.set(doc(collection(db, 'employees', employeeId, 'timeEntries')), {
    date,
    hours,
    rate,
    note,
    createdAt: serverTimestamp(),
  })
  batch.update(doc(db, 'employees', employeeId), { timer: deleteField() })
  return write(batch.commit())
}

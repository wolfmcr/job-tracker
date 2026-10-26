import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearEmulator } from '../test/emulatorDb'
import {
  addEmployee,
  addPayment,
  addTimeEntry,
  deletePayment,
  deleteTimeEntry,
  updateEmployee,
  updatePayment,
  updateTimeEntry,
} from './employeeService'

vi.mock('../lib/firebase', async () => {
  const { createEmulatorDb } = await import('../test/emulatorDb')
  return { db: createEmulatorDb(), auth: {} }
})

const { db } = await import('../lib/firebase')

async function onlyId(path: string) {
  const snap = await getDocs(collection(db, path))
  expect(snap.docs).toHaveLength(1)
  return snap.docs[0].id
}

async function data(path: string) {
  return (await getDoc(doc(db, path))).data()
}

beforeEach(clearEmulator)

describe('employee service', () => {
  it('adds and updates an employee', async () => {
    await addEmployee('Sam', 30)
    const id = await onlyId('employees')
    await updateEmployee(id, 'Sam R', 35)
    expect(await data(`employees/${id}`)).toMatchObject({ name: 'Sam R', hourlyRate: 35 })
  })

  it('time entries keep the rate they were logged at', async () => {
    await addEmployee('Sam', 30)
    const employeeId = await onlyId('employees')
    await addTimeEntry(employeeId, '2026-10-20', 7.5, 30, 'Prep')
    const entryId = await onlyId(`employees/${employeeId}/timeEntries`)
    await updateEmployee(employeeId, 'Sam', 40)
    await updateTimeEntry(employeeId, entryId, '2026-10-21', 8, 'Prep + paint')
    expect(await data(`employees/${employeeId}/timeEntries/${entryId}`)).toMatchObject({ date: '2026-10-21', hours: 8, rate: 30, note: 'Prep + paint' })
    await deleteTimeEntry(employeeId, entryId)
    expect(await data(`employees/${employeeId}/timeEntries/${entryId}`)).toBeUndefined()
  })

  it('adds, updates and deletes payments', async () => {
    await addEmployee('Sam', 30)
    const employeeId = await onlyId('employees')
    await addPayment(employeeId, '2026-10-20', 250, 'Cash')
    const paymentId = await onlyId(`employees/${employeeId}/payments`)
    await updatePayment(employeeId, paymentId, '2026-10-21', 300, 'Venmo')
    expect(await data(`employees/${employeeId}/payments/${paymentId}`)).toMatchObject({ date: '2026-10-21', amount: 300, note: 'Venmo' })
    await deletePayment(employeeId, paymentId)
    expect(await data(`employees/${employeeId}/payments/${paymentId}`)).toBeUndefined()
  })
})

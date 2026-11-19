import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Timer } from '../types'
import { setBusiness } from '../lib/business'
import { BIZ, BUSINESS_ID, resetEmulator } from '../test/emulatorDb'
import {
  addEmployee,
  addPayment,
  addTimeEntry,
  deletePayment,
  deleteTimeEntry,
  discardTimer,
  logTimerSession,
  pauseTimer,
  resumeTimer,
  setTimerStart,
  startTimer,
  updateEmployee,
  updatePayment,
  updateTimeEntry,
} from './employeeService'

vi.mock('../lib/firebase', async () => {
  const { createEmulatorDb } = await import('../test/emulatorDb')
  return { ...createEmulatorDb(), auth: {} }
})

const { db } = await import('../lib/firebase')
setBusiness({ id: BUSINESS_ID, name: 'Alder Builders' })

async function onlyId(path: string) {
  const snap = await getDocs(collection(db, path))
  expect(snap.docs).toHaveLength(1)
  return snap.docs[0].id
}

async function data(path: string) {
  return (await getDoc(doc(db, path))).data()
}

beforeEach(resetEmulator)

describe('employee service', () => {
  it('adds and updates an employee', async () => {
    await addEmployee('Sam', 30)
    const id = await onlyId(`${BIZ}/employees`)
    await updateEmployee(id, 'Sam R', 35)
    expect(await data(`${BIZ}/employees/${id}`)).toMatchObject({ name: 'Sam R', hourlyRate: 35 })
  })

  it('time entries keep the rate they were logged at', async () => {
    await addEmployee('Sam', 30)
    const employeeId = await onlyId(`${BIZ}/employees`)
    await addTimeEntry(employeeId, '2026-10-20', 7.5, 30, 'Prep')
    const entryId = await onlyId(`${BIZ}/employees/${employeeId}/timeEntries`)
    await updateEmployee(employeeId, 'Sam', 40)
    await updateTimeEntry(employeeId, entryId, '2026-10-21', 8, 'Prep + paint')
    expect(await data(`${BIZ}/employees/${employeeId}/timeEntries/${entryId}`)).toMatchObject({ date: '2026-10-21', hours: 8, rate: 30, note: 'Prep + paint' })
    await deleteTimeEntry(employeeId, entryId)
    expect(await data(`${BIZ}/employees/${employeeId}/timeEntries/${entryId}`)).toBeUndefined()
  })

  it('adds, updates and deletes payments', async () => {
    await addEmployee('Sam', 30)
    const employeeId = await onlyId(`${BIZ}/employees`)
    await addPayment(employeeId, '2026-10-20', 250, 'Cash')
    const paymentId = await onlyId(`${BIZ}/employees/${employeeId}/payments`)
    await updatePayment(employeeId, paymentId, '2026-10-21', 300, 'Venmo')
    expect(await data(`${BIZ}/employees/${employeeId}/payments/${paymentId}`)).toMatchObject({ date: '2026-10-21', amount: 300, note: 'Venmo' })
    await deletePayment(employeeId, paymentId)
    expect(await data(`${BIZ}/employees/${employeeId}/payments/${paymentId}`)).toBeUndefined()
  })

  it('starts, pauses, resumes and corrects the timer', async () => {
    await addEmployee('Sam', 30)
    const id = await onlyId(`${BIZ}/employees`)
    const timer = async () => (await data(`${BIZ}/employees/${id}`))!.timer as Timer

    await startTimer(id)
    const started = await timer()
    expect(started).toMatchObject({ pausedAt: null, pausedMs: 0 })
    expect(Math.abs(started.startedAt.toMillis() - Date.now())).toBeLessThan(5_000)

    await pauseTimer(id, started)
    expect((await timer()).pausedAt).not.toBeNull()
    await resumeTimer(id, await timer())
    expect(await timer()).toMatchObject({ pausedAt: null })

    const earlier = Date.now() - 3_600_000
    await setTimerStart(id, await timer(), earlier)
    expect((await timer()).startedAt.toMillis()).toBe(earlier)

    await discardTimer(id)
    expect(await data(`${BIZ}/employees/${id}`)).not.toHaveProperty('timer')
  })

  it('logs a timed session and clears the timer in one go', async () => {
    await addEmployee('Sam', 30)
    const id = await onlyId(`${BIZ}/employees`)
    await startTimer(id)
    expect(await logTimerSession(id, '2026-11-16', 7.75, 30, 'Framing')).toBe(true)
    const entryId = await onlyId(`${BIZ}/employees/${id}/timeEntries`)
    expect(await data(`${BIZ}/employees/${id}/timeEntries/${entryId}`)).toMatchObject({ date: '2026-11-16', hours: 7.75, rate: 30, note: 'Framing' })
    expect(await data(`${BIZ}/employees/${id}`)).not.toHaveProperty('timer')
  })
})

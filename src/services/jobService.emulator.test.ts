import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setBusiness } from '../lib/business'
import { BIZ, BUSINESS_ID, resetEmulator } from '../test/emulatorDb'
import {
  addJob,
  addShoppingItem,
  addTask,
  archiveJob,
  completeJob,
  deleteShoppingItem,
  deleteTask,
  restoreJob,
  toggleJobDone,
  toggleShoppingItem,
  toggleTask,
  updateJob,
  updateShoppingItem,
  updateTask,
} from './jobService'

vi.mock('../lib/firebase', async () => {
  const { createEmulatorDb } = await import('../test/emulatorDb')
  return { ...createEmulatorDb(), auth: {} }
})

const { db } = await import('../lib/firebase')
setBusiness({ id: BUSINESS_ID, name: 'Alder Builders' })

async function data(path: string) {
  return (await getDoc(doc(db, path))).data()
}

async function only(path: string) {
  const snap = await getDocs(collection(db, path))
  expect(snap.docs).toHaveLength(1)
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Record<string, unknown> & { id: string }
}

async function newJob() {
  await addJob({ name: 'Alder St', address: '1 Alder St', color: '#ff0000', clientName: 'Pat', clientPhone: '(503) 555-1234' })
  return (await only(`${BIZ}/jobs`)).id
}

beforeEach(resetEmulator)

describe('jobs', () => {
  it('addJob stores the fields as an active job with timestamps', async () => {
    await newJob()
    const job = await only(`${BIZ}/jobs`)
    expect(job).toMatchObject({ name: 'Alder St', address: '1 Alder St', color: '#ff0000', clientName: 'Pat', isDone: false, isArchived: false })
    expect(job.createdAt).toBeInstanceOf(Timestamp)
    expect(job.updatedAt).toBeInstanceOf(Timestamp)
  })

  it('updateJob changes only the given fields and bumps updatedAt', async () => {
    const id = await newJob()
    const before = (await data(`${BIZ}/jobs/${id}`))!
    await new Promise(r => setTimeout(r, 5))
    await updateJob(id, { notes: 'Gate code 1234' })
    const after = (await data(`${BIZ}/jobs/${id}`))!
    expect(after).toMatchObject({ name: 'Alder St', notes: 'Gate code 1234' })
    expect(after.updatedAt.toMillis()).toBeGreaterThan(before.updatedAt.toMillis())
    expect(after.createdAt).toEqual(before.createdAt)
  })

  it('complete, archive and restore set the right flags', async () => {
    const id = await newJob()
    await completeJob(id)
    expect(await data(`${BIZ}/jobs/${id}`)).toMatchObject({ isDone: true, isArchived: true })
    await restoreJob(id)
    expect(await data(`${BIZ}/jobs/${id}`)).toMatchObject({ isDone: false, isArchived: false })
    await archiveJob(id)
    expect(await data(`${BIZ}/jobs/${id}`)).toMatchObject({ isDone: false, isArchived: true })
    await toggleJobDone(id, true)
    expect(await data(`${BIZ}/jobs/${id}`)).toMatchObject({ isDone: true, isArchived: true })
  })
})

describe('failed writes', () => {
  it('resolve false instead of throwing when the rules reject them', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const id = await newJob()
    await expect(updateJob(id, { name: '' })).resolves.toBe(false)
    expect(await data(`${BIZ}/jobs/${id}`)).toMatchObject({ name: 'Alder St' })
    vi.restoreAllMocks()
  })

  it('resolve true when they save', async () => {
    const id = await newJob()
    await expect(toggleJobDone(id, true)).resolves.toBe(true)
  })
})

describe('shopping items', () => {
  it('addShoppingItem only stores taskId when given', async () => {
    const jobId = await newJob()
    await addShoppingItem(jobId, { qty: '2', name: 'Primer', priority: 1 })
    const item = await only(`${BIZ}/shoppingItems`)
    expect(item).toMatchObject({ jobId, qty: '2', name: 'Primer', priority: 1, isGot: false })
    expect(item).not.toHaveProperty('taskId')
    expect(item.createdAt).toBeInstanceOf(Timestamp)

    await deleteShoppingItem(item.id)
    await addShoppingItem(jobId, { qty: '', name: 'Tape' }, 'task-1')
    expect(await only(`${BIZ}/shoppingItems`)).toMatchObject({ name: 'Tape', taskId: 'task-1' })
  })

  it('toggle, update and delete', async () => {
    const jobId = await newJob()
    await addShoppingItem(jobId, { qty: '', name: 'Primer' })
    const { id } = await only(`${BIZ}/shoppingItems`)
    await toggleShoppingItem(id, true)
    expect(await data(`${BIZ}/shoppingItems/${id}`)).toMatchObject({ isGot: true })
    await updateShoppingItem(id, { qty: '3', name: 'Primer (grey)', priority: 2 })
    expect(await data(`${BIZ}/shoppingItems/${id}`)).toMatchObject({ qty: '3', name: 'Primer (grey)', priority: 2, isGot: true })
    await deleteShoppingItem(id)
    expect(await data(`${BIZ}/shoppingItems/${id}`)).toBeUndefined()
  })
})

describe('tasks', () => {
  it('addTask leaves out an empty due date', async () => {
    const jobId = await newJob()
    await addTask(jobId, { text: 'Sand trim', bullets: ['120 grit'], priority: 0, dueDate: '' })
    const task = await only(`${BIZ}/tasks`)
    expect(task).toMatchObject({ jobId, text: 'Sand trim', bullets: ['120 grit'], isDone: false })
    expect(task).not.toHaveProperty('dueDate')
  })

  it('updateTask sets and clears the due date', async () => {
    const jobId = await newJob()
    await addTask(jobId, { text: 'Sand trim', priority: 0, dueDate: '2026-10-30' })
    const { id } = await only(`${BIZ}/tasks`)
    expect(await data(`${BIZ}/tasks/${id}`)).toMatchObject({ dueDate: '2026-10-30' })
    await updateTask(id, { text: 'Sand all trim', priority: 1, dueDate: '' })
    const task = (await data(`${BIZ}/tasks/${id}`))!
    expect(task).toMatchObject({ text: 'Sand all trim', priority: 1 })
    expect(task).not.toHaveProperty('dueDate')
  })

  it('toggleTask records completedAt and removes it when un-done', async () => {
    const jobId = await newJob()
    await addTask(jobId, { text: 'Sand trim', priority: 0, dueDate: '' })
    const { id } = await only(`${BIZ}/tasks`)
    await toggleTask(id, true)
    const done = (await data(`${BIZ}/tasks/${id}`))!
    expect(done.isDone).toBe(true)
    expect(done.completedAt).toBeInstanceOf(Timestamp)
    await toggleTask(id, false)
    const undone = (await data(`${BIZ}/tasks/${id}`))!
    expect(undone.isDone).toBe(false)
    expect(undone).not.toHaveProperty('completedAt')
  })

  async function taskWithShopping() {
    const jobId = await newJob()
    await addTask(jobId, { text: 'Paint door', priority: 0, dueDate: '' })
    const { id: taskId } = await only(`${BIZ}/tasks`)
    await addShoppingItem(jobId, { qty: '', name: 'Paint' }, taskId)
    await addShoppingItem(jobId, { qty: '', name: 'Brush' }, taskId)
    await addShoppingItem(jobId, { qty: '', name: 'Unrelated' })
    const items = (await getDocs(collection(db, `${BIZ}/shoppingItems`))).docs
    const taskItemIds = items.filter(d => d.data().taskId === taskId).map(d => d.id)
    return { jobId, taskId, taskItemIds }
  }

  it('deleteTask can delete the task’s shopping items with it', async () => {
    const { taskId, taskItemIds } = await taskWithShopping()
    await deleteTask(taskId, taskItemIds, true)
    expect(await data(`${BIZ}/tasks/${taskId}`)).toBeUndefined()
    const left = (await getDocs(collection(db, `${BIZ}/shoppingItems`))).docs.map(d => d.data().name)
    expect(left).toEqual(['Unrelated'])
  })

  it('deleteTask can keep the shopping items on the job list, unlinked', async () => {
    const { taskId, taskItemIds } = await taskWithShopping()
    await deleteTask(taskId, taskItemIds, false)
    expect(await data(`${BIZ}/tasks/${taskId}`)).toBeUndefined()
    const items = (await getDocs(collection(db, `${BIZ}/shoppingItems`))).docs.map(d => d.data())
    expect(items.map(i => i.name).sort()).toEqual(['Brush', 'Paint', 'Unrelated'])
    expect(items.every(i => !('taskId' in i))).toBe(true)
  })

  it('deleteTask still deletes the task when one of its items was already deleted elsewhere', async () => {
    const { taskId, taskItemIds } = await taskWithShopping()
    await deleteShoppingItem(taskItemIds[0])
    await expect(deleteTask(taskId, taskItemIds, false)).resolves.toBe(true)
    expect(await data(`${BIZ}/tasks/${taskId}`)).toBeUndefined()
    const items = (await getDocs(collection(db, `${BIZ}/shoppingItems`))).docs.map(d => d.data())
    expect(items).toHaveLength(2)
    expect(items.every(i => !('taskId' in i))).toBe(true)
  })
})

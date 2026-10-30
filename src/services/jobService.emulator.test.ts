import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearEmulator } from '../test/emulatorDb'
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
  return (await only('jobs')).id
}

beforeEach(clearEmulator)

describe('jobs', () => {
  it('addJob stores the fields as an active job with timestamps', async () => {
    await newJob()
    const job = await only('jobs')
    expect(job).toMatchObject({ name: 'Alder St', address: '1 Alder St', color: '#ff0000', clientName: 'Pat', isDone: false, isArchived: false })
    expect(job.createdAt).toBeInstanceOf(Timestamp)
    expect(job.updatedAt).toBeInstanceOf(Timestamp)
  })

  it('updateJob changes only the given fields and bumps updatedAt', async () => {
    const id = await newJob()
    const before = (await data(`jobs/${id}`))!
    await new Promise(r => setTimeout(r, 5))
    await updateJob(id, { notes: 'Gate code 1234' })
    const after = (await data(`jobs/${id}`))!
    expect(after).toMatchObject({ name: 'Alder St', notes: 'Gate code 1234' })
    expect(after.updatedAt.toMillis()).toBeGreaterThan(before.updatedAt.toMillis())
    expect(after.createdAt).toEqual(before.createdAt)
  })

  it('complete, archive and restore set the right flags', async () => {
    const id = await newJob()
    await completeJob(id)
    expect(await data(`jobs/${id}`)).toMatchObject({ isDone: true, isArchived: true })
    await restoreJob(id)
    expect(await data(`jobs/${id}`)).toMatchObject({ isDone: false, isArchived: false })
    await archiveJob(id)
    expect(await data(`jobs/${id}`)).toMatchObject({ isDone: false, isArchived: true })
    await toggleJobDone(id, true)
    expect(await data(`jobs/${id}`)).toMatchObject({ isDone: true, isArchived: true })
  })
})

describe('failed writes', () => {
  it('resolve false instead of throwing when the rules reject them', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const id = await newJob()
    await expect(updateJob(id, { name: '' })).resolves.toBe(false)
    expect(await data(`jobs/${id}`)).toMatchObject({ name: 'Alder St' })
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
    const item = await only(`jobs/${jobId}/shoppingItems`)
    expect(item).toMatchObject({ qty: '2', name: 'Primer', priority: 1, isGot: false })
    expect(item).not.toHaveProperty('taskId')
    expect(item.createdAt).toBeInstanceOf(Timestamp)

    await deleteShoppingItem(jobId, item.id)
    await addShoppingItem(jobId, { qty: '', name: 'Tape' }, 'task-1')
    expect(await only(`jobs/${jobId}/shoppingItems`)).toMatchObject({ name: 'Tape', taskId: 'task-1' })
  })

  it('toggle, update and delete', async () => {
    const jobId = await newJob()
    await addShoppingItem(jobId, { qty: '', name: 'Primer' })
    const { id } = await only(`jobs/${jobId}/shoppingItems`)
    await toggleShoppingItem(jobId, id, true)
    expect(await data(`jobs/${jobId}/shoppingItems/${id}`)).toMatchObject({ isGot: true })
    await updateShoppingItem(jobId, id, { qty: '3', name: 'Primer (grey)', priority: 2 })
    expect(await data(`jobs/${jobId}/shoppingItems/${id}`)).toMatchObject({ qty: '3', name: 'Primer (grey)', priority: 2, isGot: true })
    await deleteShoppingItem(jobId, id)
    expect(await data(`jobs/${jobId}/shoppingItems/${id}`)).toBeUndefined()
  })
})

describe('tasks', () => {
  it('addTask leaves out an empty due date', async () => {
    const jobId = await newJob()
    await addTask(jobId, { text: 'Sand trim', bullets: ['120 grit'], priority: 0, dueDate: '' })
    const task = await only(`jobs/${jobId}/tasks`)
    expect(task).toMatchObject({ text: 'Sand trim', bullets: ['120 grit'], isDone: false })
    expect(task).not.toHaveProperty('dueDate')
  })

  it('updateTask sets and clears the due date', async () => {
    const jobId = await newJob()
    await addTask(jobId, { text: 'Sand trim', priority: 0, dueDate: '2026-10-30' })
    const { id } = await only(`jobs/${jobId}/tasks`)
    expect(await data(`jobs/${jobId}/tasks/${id}`)).toMatchObject({ dueDate: '2026-10-30' })
    await updateTask(jobId, id, { text: 'Sand all trim', priority: 1, dueDate: '' })
    const task = (await data(`jobs/${jobId}/tasks/${id}`))!
    expect(task).toMatchObject({ text: 'Sand all trim', priority: 1 })
    expect(task).not.toHaveProperty('dueDate')
  })

  it('toggleTask records completedAt and removes it when un-done', async () => {
    const jobId = await newJob()
    await addTask(jobId, { text: 'Sand trim', priority: 0, dueDate: '' })
    const { id } = await only(`jobs/${jobId}/tasks`)
    await toggleTask(jobId, id, true)
    const done = (await data(`jobs/${jobId}/tasks/${id}`))!
    expect(done.isDone).toBe(true)
    expect(done.completedAt).toBeInstanceOf(Timestamp)
    await toggleTask(jobId, id, false)
    const undone = (await data(`jobs/${jobId}/tasks/${id}`))!
    expect(undone.isDone).toBe(false)
    expect(undone).not.toHaveProperty('completedAt')
  })

  async function taskWithShopping() {
    const jobId = await newJob()
    await addTask(jobId, { text: 'Paint door', priority: 0, dueDate: '' })
    const { id: taskId } = await only(`jobs/${jobId}/tasks`)
    await addShoppingItem(jobId, { qty: '', name: 'Paint' }, taskId)
    await addShoppingItem(jobId, { qty: '', name: 'Brush' }, taskId)
    await addShoppingItem(jobId, { qty: '', name: 'Unrelated' })
    const items = (await getDocs(collection(db, `jobs/${jobId}/shoppingItems`))).docs
    const taskItemIds = items.filter(d => d.data().taskId === taskId).map(d => d.id)
    return { jobId, taskId, taskItemIds }
  }

  it('deleteTask can delete the task’s shopping items with it', async () => {
    const { jobId, taskId, taskItemIds } = await taskWithShopping()
    await deleteTask(jobId, taskId, taskItemIds, true)
    expect(await data(`jobs/${jobId}/tasks/${taskId}`)).toBeUndefined()
    const left = (await getDocs(collection(db, `jobs/${jobId}/shoppingItems`))).docs.map(d => d.data().name)
    expect(left).toEqual(['Unrelated'])
  })

  it('deleteTask can keep the shopping items on the job list, unlinked', async () => {
    const { jobId, taskId, taskItemIds } = await taskWithShopping()
    await deleteTask(jobId, taskId, taskItemIds, false)
    expect(await data(`jobs/${jobId}/tasks/${taskId}`)).toBeUndefined()
    const items = (await getDocs(collection(db, `jobs/${jobId}/shoppingItems`))).docs.map(d => d.data())
    expect(items.map(i => i.name).sort()).toEqual(['Brush', 'Paint', 'Unrelated'])
    expect(items.every(i => !('taskId' in i))).toBe(true)
  })
})

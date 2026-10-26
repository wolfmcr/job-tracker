import type { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { ts } from '../test/timestamp'
import { createdMillis, sortByCompleted, sortItems } from './sortItems'

interface Item {
  id: string
  jobId: string
  priority?: number
  dueDate?: string
  createdAt: Timestamp | null
}

const item = (id: string, fields: Partial<Item> = {}): Item => ({ id, jobId: 'a', createdAt: ts(Number(id.replace(/\D/g, '')) || 0), ...fields })
const ids = (items: { id: string }[]) => items.map(i => i.id)
const names: Record<string, string> = { a: 'Alder St', b: 'Birch Ave', c: 'Cedar Ct' }
const jobName = (jobId: string) => names[jobId] ?? ''

describe('createdMillis', () => {
  it('treats a pending server timestamp as newest', () => {
    expect(createdMillis({ createdAt: null })).toBe(Infinity)
    expect(createdMillis({ createdAt: ts(5) })).toBe(5)
  })
})

describe('sortItems', () => {
  it('does not mutate the input', () => {
    const items = [item('i2'), item('i1')]
    sortItems(items, 'added', 'asc', jobName)
    expect(ids(items)).toEqual(['i2', 'i1'])
  })

  it('priority desc: highest first, ties oldest first, missing priority as 0', () => {
    const items = [item('i1'), item('i2', { priority: 2 }), item('i3', { priority: 1 }), item('i4', { priority: 2 })]
    expect(ids(sortItems(items, 'priority', 'desc', jobName))).toEqual(['i2', 'i4', 'i3', 'i1'])
  })

  it('priority asc: lowest first, ties still oldest first', () => {
    const items = [item('i1', { priority: 2 }), item('i2'), item('i3', { priority: 2 })]
    expect(ids(sortItems(items, 'priority', 'asc', jobName))).toEqual(['i2', 'i1', 'i3'])
  })

  it('job: by job name, then high priority, then oldest', () => {
    const items = [
      item('i1', { jobId: 'b' }),
      item('i2', { jobId: 'a' }),
      item('i3', { jobId: 'b', priority: 1 }),
      item('i4', { jobId: 'a' }),
    ]
    expect(ids(sortItems(items, 'job', 'asc', jobName))).toEqual(['i2', 'i4', 'i3', 'i1'])
    expect(ids(sortItems(items, 'job', 'desc', jobName))).toEqual(['i3', 'i1', 'i2', 'i4'])
  })

  it('added: oldest first, pending writes last; desc reverses', () => {
    const items = [item('i2'), item('pending', { createdAt: null }), item('i1')]
    expect(ids(sortItems(items, 'added', 'asc', jobName))).toEqual(['i1', 'i2', 'pending'])
    expect(ids(sortItems(items, 'added', 'desc', jobName))).toEqual(['pending', 'i2', 'i1'])
  })

  it('due: soonest first, undated at the bottom in both directions', () => {
    const items = [
      item('i1'),
      item('i2', { dueDate: '2026-11-01' }),
      item('i3', { dueDate: '2026-10-25' }),
      item('i4', { priority: 2 }),
    ]
    expect(ids(sortItems(items, 'due', 'asc', jobName))).toEqual(['i3', 'i2', 'i4', 'i1'])
    expect(ids(sortItems(items, 'due', 'desc', jobName))).toEqual(['i2', 'i3', 'i4', 'i1'])
  })

  it('due: same date falls back to priority then oldest', () => {
    const items = [item('i1', { dueDate: '2026-10-25' }), item('i2', { dueDate: '2026-10-25', priority: 1 })]
    expect(ids(sortItems(items, 'due', 'asc', jobName))).toEqual(['i2', 'i1'])
  })
})

describe('sortByCompleted', () => {
  it('most recently completed first; missing completedAt oldest, pending newest', () => {
    const items = [
      { id: 'old', completedAt: undefined, createdAt: ts(1) },
      { id: 'mid', completedAt: ts(50), createdAt: ts(2) },
      { id: 'pending', completedAt: null, createdAt: ts(3) },
      { id: 'late', completedAt: ts(90), createdAt: ts(4) },
    ]
    expect(ids(sortByCompleted(items))).toEqual(['pending', 'late', 'mid', 'old'])
  })

  it('ties fall back to newest created first', () => {
    const items = [
      { id: 'a', completedAt: ts(5), createdAt: ts(1) },
      { id: 'b', completedAt: ts(5), createdAt: ts(2) },
    ]
    expect(ids(sortByCompleted(items))).toEqual(['b', 'a'])
  })
})

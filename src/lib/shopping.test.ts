import { describe, expect, it } from 'vitest'
import { ts } from '../test/timestamp'
import type { ShoppingItem } from '../types'
import { groupShoppingByTask } from './shopping'

const item = (id: string, taskId?: string): ShoppingItem => ({ id, jobId: 'j', qty: '', name: id, taskId, isGot: false, createdAt: ts(0) })

describe('groupShoppingByTask', () => {
  it("groups items by task, keeping their order, and skips items without a task", () => {
    const forTask = groupShoppingByTask([item('a', 't1'), item('b'), item('c', 't2'), item('d', 't1')])
    expect(forTask('t1').map(i => i.id)).toEqual(['a', 'd'])
    expect(forTask('t2').map(i => i.id)).toEqual(['c'])
  })

  it('returns the same empty array for tasks with no items (stable for React deps)', () => {
    const forTask = groupShoppingByTask([])
    expect(forTask('x')).toEqual([])
    expect(forTask('x')).toBe(forTask('y'))
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ts } from '../test/timestamp'
import type { Receipt, ReceiptItem } from '../types'
import { itemsMismatch, jobExpenses, normalizeReading, receiptJobIds, taxByJob, unassignedCount } from './receipts'

const item = (amount: number, jobId: string | null, name = 'Thing'): ReceiptItem => ({ name, amount, jobId })

describe('receiptJobIds', () => {
  it('lists each job once and skips items with no job', () => {
    expect(receiptJobIds([item(1, 'a'), item(2, null), item(3, 'b'), item(4, 'a')])).toEqual(['a', 'b'])
    expect(receiptJobIds([])).toEqual([])
  })
})

describe('taxByJob', () => {
  it('gives a single job all the tax', () => {
    expect(taxByJob([item(10, 'a'), item(5, 'a')], 1.2)).toEqual(new Map([['a', 1.2]]))
  })

  it('splits tax in proportion to each job’s lines', () => {
    const tax = taxByJob([item(60, 'a'), item(25, 'a'), item(15, 'b')], 8)
    expect(tax.get('a')).toBe(6.8)
    expect(tax.get('b')).toBe(1.2)
  })

  it('keeps the unassigned lines’ part separate', () => {
    const tax = taxByJob([item(30, 'a'), item(10, null)], 4)
    expect(tax.get('a')).toBe(3)
    expect(tax.get(null)).toBe(1)
  })

  it('rounds to cents and still adds up to the tax exactly', () => {
    const values = [...taxByJob([item(1, 'a'), item(1, 'b'), item(1, 'c')], 1).values()]
    expect(values.sort()).toEqual([0.33, 0.33, 0.34])
  })

  it('works for returns, where everything is negative', () => {
    const tax = taxByJob([item(-60, 'a'), item(-40, 'b')], -8)
    expect(tax.get('a')).toBe(-4.8)
    expect(tax.get('b')).toBe(-3.2)
  })

  it('is empty when there are no lines to split by', () => {
    expect(taxByJob([], 2).size).toBe(0)
    expect(taxByJob([item(5, 'a'), item(-5, 'b')], 1).size).toBe(0)
  })
})

describe('jobExpenses', () => {
  const receipt = (id: string, date: string, items: ReceiptItem[], tax: number): Receipt => ({
    id, store: 'Store ' + id, date, tax, total: 0, items, jobIds: receiptJobIds(items), note: '', createdAt: ts(0),
  })

  it('lists only the job’s lines, grouped by receipt, newest first, with their tax', () => {
    const receipts = [
      receipt('r1', '2026-10-20', [item(60, 'a', 'Studs'), item(40, 'b', 'Roller')], 8),
      receipt('r2', '2026-10-29', [item(10, 'a', 'Caulk')], 0.8),
      receipt('r3', '2026-10-25', [item(5, 'b')], 0.4),
    ]
    const { groups, total } = jobExpenses(receipts, 'a')
    expect(groups.map(g => g.receipt.id)).toEqual(['r2', 'r1'])
    expect(groups[1].items.map(i => i.name)).toEqual(['Studs'])
    expect(groups[1]).toMatchObject({ tax: 4.8, total: 64.8 })
    expect(groups[0]).toMatchObject({ tax: 0.8, total: 10.8 })
    expect(total).toBe(75.6)
  })

  it('is empty for a job with no lines', () => {
    expect(jobExpenses([receipt('r1', '2026-10-20', [item(5, 'b')], 0)], 'a')).toEqual({ groups: [], total: 0 })
  })
})

describe('unassignedCount', () => {
  it('counts lines with no job', () => {
    expect(unassignedCount({ items: [item(1, null), item(2, 'a'), item(3, null)] })).toBe(2)
  })
})

describe('itemsMismatch', () => {
  it('is false when items and tax add up to the total', () => {
    expect(itemsMismatch([item(0.1, 'a'), item(0.2, 'a')], 0.03, 0.33)).toBe(false)
  })

  it('is true when they don’t', () => {
    expect(itemsMismatch([item(10, 'a')], 1, 12)).toBe(true)
  })

  it('is false with no items, when there’s nothing to compare', () => {
    expect(itemsMismatch([], 0, 12)).toBe(false)
  })
})

describe('normalizeReading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 30, 12))
  })
  afterEach(() => vi.useRealTimers())

  it('keeps a good reading as it is', () => {
    const reading = { store: 'Hardware Co', date: '2026-10-29', tax: 1.2, total: 21.2, items: [{ name: 'Screws', amount: 20 }] }
    expect(normalizeReading(reading)).toEqual(reading)
  })

  it('turns money written as text into numbers, rounded to cents', () => {
    const r = normalizeReading({ store: 'X', tax: '$0.5', total: '1,234.50', items: [{ name: 'Lumber', amount: '$12.999' }] })
    expect(r.total).toBe(1234.5)
    expect(r.tax).toBe(0.5)
    expect(r.items).toEqual([{ name: 'Lumber', amount: 13 }])
  })

  it('drops items without a name or amount', () => {
    const r = normalizeReading({ items: [{ name: ' ', amount: 1 }, { name: 'Tape', amount: 'free' }, null, 'junk', { name: 'Caulk', amount: 4 }] })
    expect(r.items).toEqual([{ name: 'Caulk', amount: 4 }])
  })

  it('uses today for a missing, malformed or future date', () => {
    for (const date of [undefined, '10/29/2026', '2026-11-05', '1999-12-31']) {
      expect(normalizeReading({ date }).date).toBe('2026-10-30')
    }
  })

  it('gives an empty draft for garbage', () => {
    for (const raw of [null, 'text', 42, [], { items: 'nope', tax: 'n/a', total: Infinity }]) {
      expect(normalizeReading(raw)).toEqual({ store: '', date: '2026-10-30', tax: 0, total: 0, items: [] })
    }
  })

  it('keeps negative amounts, for returns', () => {
    expect(normalizeReading({ tax: -0.8, total: '-10.80', items: [{ name: 'Caulk', amount: -10 }] })).toMatchObject({ tax: -0.8, total: -10.8, items: [{ name: 'Caulk', amount: -10 }] })
  })

  it('caps long text and huge lists', () => {
    const r = normalizeReading({ store: 'x'.repeat(500), items: Array.from({ length: 150 }, () => ({ name: 'y'.repeat(300), amount: 1 })) })
    expect(r.store).toHaveLength(200)
    expect(r.items).toHaveLength(100)
    expect(r.items[0].name).toHaveLength(200)
  })
})

import { describe, expect, it } from 'vitest'
import { ts } from '../test/timestamp'
import type { Payment, TimeEntry } from '../types'
import { buildBuckets, compactMoney, ledgerRows, niceMax, PERIOD_COUNT, periodStart, summarizeLedger } from './ledger'

const hours = (id: string, date: string, h: number, rate: number, created = 0): TimeEntry => ({ id, date, hours: h, rate, note: '', createdAt: ts(created) })
const payment = (id: string, date: string, amount: number, created = 0): Payment => ({ id, date, amount, note: '', createdAt: ts(created) })

const NOW = new Date(2026, 9, 22, 15) // Thu Oct 22 2026

describe('periodStart', () => {
  it('weeks start on Monday', () => {
    expect(periodStart(new Date(2026, 9, 22), 'week')).toEqual(new Date(2026, 9, 19))
    expect(periodStart(new Date(2026, 9, 25), 'week')).toEqual(new Date(2026, 9, 19)) // Sunday
    expect(periodStart(new Date(2026, 9, 19), 'week')).toEqual(new Date(2026, 9, 19))
  })

  it('months start on the 1st', () => {
    expect(periodStart(new Date(2026, 9, 22, 18), 'month')).toEqual(new Date(2026, 9, 1))
  })
})

describe('buildBuckets', () => {
  it('makes one bucket per period, oldest first, ending with the current one', () => {
    const weeks = buildBuckets([], [], 'week', NOW)
    expect(weeks).toHaveLength(PERIOD_COUNT.week)
    expect(weeks.at(-1)!.key).toBe(new Date(2026, 9, 19).toDateString())
    expect(weeks.at(-2)!.key).toBe(new Date(2026, 9, 12).toDateString())

    const months = buildBuckets([], [], 'month', NOW)
    expect(months).toHaveLength(PERIOD_COUNT.month)
    expect(months[0].key).toBe(new Date(2025, 10, 1).toDateString())
    expect(months.at(-1)!.rangeLabel).toBe('October 2026')
  })

  it('adds hours, earnings at the logged rate, and payments to the right period', () => {
    const entries = [hours('a', '2026-10-19', 4, 30), hours('b', '2026-10-25', 2, 40), hours('c', '2026-10-18', 1, 30)]
    const weeks = buildBuckets(entries, [payment('p', '2026-10-20', 100)], 'week', NOW)
    expect(weeks.at(-1)).toMatchObject({ hours: 6, earned: 200, paid: 100 })
    expect(weeks.at(-2)).toMatchObject({ hours: 1, earned: 30, paid: 0 })
  })

  it('ignores entries outside the shown range', () => {
    const weeks = buildBuckets([hours('old', '2025-01-01', 8, 30), hours('future', '2026-11-30', 8, 30)], [], 'week', NOW)
    expect(weeks.reduce((sum, b) => sum + b.hours, 0)).toBe(0)
  })
})

describe('niceMax', () => {
  it('rounds up to a 1/2/5 step, with a floor for empty charts', () => {
    expect(niceMax(0)).toBe(100)
    expect(niceMax(120)).toBe(200)
    expect(niceMax(450)).toBe(500)
    expect(niceMax(1000)).toBe(1000)
    expect(niceMax(1001)).toBe(2000)
    expect(niceMax(7)).toBe(10)
  })
})

describe('compactMoney', () => {
  it('shortens thousands', () => {
    expect(compactMoney(0)).toBe('$0')
    expect(compactMoney(999)).toBe('$999')
    expect(compactMoney(1000)).toBe('$1k')
    expect(compactMoney(1500)).toBe('$1.5k')
  })
})

describe('summarizeLedger', () => {
  it('uses each entry’s own rate, so rate changes don’t rewrite history', () => {
    const s = summarizeLedger([hours('a', '2026-10-01', 10, 20), hours('b', '2026-10-02', 5, 30)], [payment('p', '2026-10-03', 150)], 30)
    expect(s).toEqual({ totalHours: 15, earned: 350, paid: 150, owed: 200, owedHours: 200 / 30 })
  })

  it('owedHours is negative when paid ahead and 0 with no rate', () => {
    expect(summarizeLedger([hours('a', '2026-10-01', 1, 30)], [payment('p', '2026-10-01', 90)], 30).owedHours).toBe(-2)
    expect(summarizeLedger([hours('a', '2026-10-01', 1, 30)], [], 0).owedHours).toBe(0)
  })

  it('is all zeros with no history', () => {
    expect(summarizeLedger([], [], 30)).toEqual({ totalHours: 0, earned: 0, paid: 0, owed: 0, owedHours: 0 })
  })
})

describe('ledgerRows', () => {
  it('newest date first, then most recently added, pending writes on top', () => {
    const pending = { ...payment('pending', '2026-10-02', 5), createdAt: null } as unknown as Payment
    const rows = ledgerRows(
      [hours('h1', '2026-10-01', 1, 30, 10), hours('h2', '2026-10-02', 1, 30, 20)],
      [payment('p1', '2026-10-02', 50, 30), pending],
    )
    expect(rows.map(r => `${r.kind}:${r.entry.id}`)).toEqual(['payment:pending', 'payment:p1', 'hours:h2', 'hours:h1'])
  })
})

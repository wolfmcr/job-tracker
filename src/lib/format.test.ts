import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanBullets, describeDueDate, formatDate, formatHours, formatMoney, formatPhone, parseISODate, todayISO } from './format'

describe('formatMoney', () => {
  it('formats US dollars with cents and separators', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50')
    expect(formatMoney(0)).toBe('$0.00')
    expect(formatMoney(-5)).toBe('-$5.00')
  })
})

describe('formatHours', () => {
  it('pluralises and trims to two decimals', () => {
    expect(formatHours(1)).toBe('1 hr')
    expect(formatHours(0)).toBe('0 hrs')
    expect(formatHours(7.5)).toBe('7.5 hrs')
    expect(formatHours(2 / 3)).toBe('0.67 hrs')
  })
})

describe('dates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 22, 23, 30)) // Thu Oct 22 2026, 11:30pm local
  })
  afterEach(() => vi.useRealTimers())

  it('todayISO uses the local date, not UTC', () => {
    expect(todayISO()).toBe('2026-10-22')
  })

  it('todayISO zero-pads month and day', () => {
    vi.setSystemTime(new Date(2026, 0, 5, 9))
    expect(todayISO()).toBe('2026-01-05')
  })

  it('parseISODate gives local midnight', () => {
    const d = parseISODate('2026-03-08')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 8, 0])
  })

  it('formatDate shows weekday, month and day', () => {
    expect(formatDate('2026-10-22')).toBe('Thu, Oct 22')
  })

  it('describeDueDate labels today, tomorrow, later and overdue', () => {
    expect(describeDueDate('2026-10-22')).toEqual({ label: 'Due today', tone: 'today' })
    expect(describeDueDate('2026-10-23')).toEqual({ label: 'Due tomorrow', tone: 'upcoming' })
    expect(describeDueDate('2026-10-30')).toEqual({ label: 'Due Fri, Oct 30', tone: 'upcoming' })
    expect(describeDueDate('2026-10-21')).toEqual({ label: 'Overdue · Wed, Oct 21', tone: 'overdue' })
  })

  it('describeDueDate counts days correctly across a DST change', () => {
    vi.setSystemTime(new Date(2026, 10, 1, 12)) // Nov 1 2026, clocks go back
    expect(describeDueDate('2026-11-02').label).toBe('Due tomorrow')
    vi.setSystemTime(new Date(2026, 2, 8, 12)) // Mar 8 2026, clocks go forward
    expect(describeDueDate('2026-03-09').label).toBe('Due tomorrow')
    expect(describeDueDate('2026-03-07').tone).toBe('overdue')
  })
})

describe('cleanBullets', () => {
  it('trims and drops blank bullets', () => {
    expect(cleanBullets(['  sand  ', '', '   ', 'prime'])).toEqual(['sand', 'prime'])
  })
})

describe('formatPhone', () => {
  it('formats a 10-digit number', () => {
    expect(formatPhone('5035551234')).toBe('(503) 555-1234')
  })

  it('formats progressively while typing', () => {
    expect(formatPhone('')).toBe('')
    expect(formatPhone('5')).toBe('(5')
    expect(formatPhone('503')).toBe('(503')
    expect(formatPhone('5035')).toBe('(503) 5')
    expect(formatPhone('503555')).toBe('(503) 555')
    expect(formatPhone('5035551')).toBe('(503) 555-1')
  })

  it('is stable when reformatting its own output', () => {
    expect(formatPhone('(503) 555-1234')).toBe('(503) 555-1234')
  })

  it('drops a leading US country code', () => {
    expect(formatPhone('15035551234')).toBe('(503) 555-1234')
    expect(formatPhone('+1 503 555 1234')).toBe('(503) 555-1234')
  })

  it('leaves international and over-long numbers as typed', () => {
    expect(formatPhone('+44 20 7946 0958')).toBe('+44 20 7946 0958')
    expect(formatPhone('503555123456')).toBe('503555123456')
  })
})

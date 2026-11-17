import { describe, expect, it } from 'vitest'
import { ts } from '../test/timestamp'
import type { Timer } from '../types'
import { canStartAt, elapsedMs, formatElapsed, isStale, pausedMsAt, sessionDate, sessionHours } from './timer'

const MIN = 60_000
const HOUR = 60 * MIN
const start = new Date(2026, 10, 16, 7, 30).getTime()
const timer = (fields: Partial<Timer> = {}): Timer => ({ startedAt: ts(start), pausedAt: null, pausedMs: 0, ...fields })

describe('elapsedMs', () => {
  it('counts from the start while running', () => {
    expect(elapsedMs(timer(), start + 2 * HOUR)).toBe(2 * HOUR)
  })

  it('takes off earlier pauses', () => {
    expect(elapsedMs(timer({ pausedMs: 30 * MIN }), start + 2 * HOUR)).toBe(90 * MIN)
  })

  it('stands still while paused', () => {
    const paused = timer({ pausedAt: ts(start + HOUR), pausedMs: 10 * MIN })
    expect(elapsedMs(paused, start + 5 * HOUR)).toBe(50 * MIN)
  })

  it('is never negative, even if the clock is behind', () => {
    expect(elapsedMs(timer(), start - MIN)).toBe(0)
  })
})

describe('pausedMsAt', () => {
  it('adds the current pause up to now', () => {
    expect(pausedMsAt(timer({ pausedAt: ts(start + HOUR), pausedMs: 10 * MIN }), start + HOUR + 30 * MIN)).toBe(40 * MIN)
  })

  it('is just the earlier pauses while running', () => {
    expect(pausedMsAt(timer({ pausedMs: 10 * MIN }), start + 5 * HOUR)).toBe(10 * MIN)
  })
})

describe('sessionHours', () => {
  it('rounds to the nearest 15 minutes', () => {
    expect(sessionHours(7 * HOUR + 52 * MIN)).toBe(7.75)
    expect(sessionHours(7 * HOUR + 53 * MIN)).toBe(8)
    expect(sessionHours(8 * HOUR + 7 * MIN)).toBe(8)
  })

  it('logs at least a quarter hour', () => {
    expect(sessionHours(0)).toBe(0.25)
    expect(sessionHours(5 * MIN)).toBe(0.25)
  })
})

describe('sessionDate', () => {
  it('is the day it started, even past midnight', () => {
    expect(sessionDate(timer({ startedAt: ts(new Date(2026, 10, 16, 22).getTime()) }))).toBe('2026-11-16')
  })
})

describe('isStale', () => {
  it('is true after 12 hours since the start, paused or not', () => {
    expect(isStale(timer(), start + 12 * HOUR)).toBe(false)
    expect(isStale(timer(), start + 12 * HOUR + MIN)).toBe(true)
    expect(isStale(timer({ pausedAt: ts(start + HOUR) }), start + 13 * HOUR)).toBe(true)
  })
})

describe('canStartAt', () => {
  const now = start + 2 * HOUR

  it('allows an earlier start', () => {
    expect(canStartAt(timer(), start - HOUR, now)).toBe(true)
  })

  it('refuses a start in the future', () => {
    expect(canStartAt(timer(), now + MIN, now)).toBe(false)
  })

  it('refuses a start that leaves less than no time, given the pauses', () => {
    const paused = timer({ pausedAt: ts(start + HOUR), pausedMs: 20 * MIN })
    expect(canStartAt(paused, start + 40 * MIN, now)).toBe(true)
    expect(canStartAt(paused, start + 41 * MIN, now)).toBe(false)
  })

  it('refuses a missing time', () => {
    expect(canStartAt(timer(), NaN, now)).toBe(false)
  })
})

describe('formatElapsed', () => {
  it('shows hours, minutes and seconds', () => {
    expect(formatElapsed(0)).toBe('0:00:00')
    expect(formatElapsed(HOUR + 5 * MIN + 9_999)).toBe('1:05:09')
    expect(formatElapsed(13 * HOUR)).toBe('13:00:00')
  })
})

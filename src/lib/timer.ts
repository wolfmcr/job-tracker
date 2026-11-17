import type { Timer } from '../types'
import { toISODate } from './format'

export const STALE_MS = 12 * 60 * 60 * 1000

// Time worked so far: since the start, less pauses (including the current one)
export function elapsedMs(timer: Timer, now: number) {
  const end = timer.pausedAt?.toMillis() ?? now
  return Math.max(0, end - timer.startedAt.toMillis() - timer.pausedMs)
}

// Pauses so far, counting the current one up to now (for resuming)
export function pausedMsAt(timer: Timer, now: number) {
  return timer.pausedMs + (timer.pausedAt ? Math.max(0, now - timer.pausedAt.toMillis()) : 0)
}

// Hours to log, to the nearest 15 minutes; never 0, since a 0-hour entry can't be saved
export function sessionHours(ms: number) {
  return Math.max(0.25, Math.round(ms / 900_000) / 4)
}

// The day the session started, which is the day it's logged on
export function sessionDate(timer: Timer) {
  return toISODate(timer.startedAt.toDate())
}

// Running for more than 12 hours since it started, so probably forgotten
export function isStale(timer: Timer, now: number) {
  return now - timer.startedAt.toMillis() > STALE_MS
}

// A corrected start time can't be in the future or leave less than no time worked
export function canStartAt(timer: Timer, startMs: number, now: number) {
  const end = timer.pausedAt?.toMillis() ?? now
  return Number.isFinite(startMs) && startMs <= now && end - startMs - timer.pausedMs >= 0
}

// 1:05:09
export function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

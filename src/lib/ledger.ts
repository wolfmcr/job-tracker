import type { Payment, TimeEntry } from '../types'
import { parseISODate } from './format'

export type Range = 'week' | 'month'

export const PERIOD_COUNT: Record<Range, number> = { week: 26, month: 12 }

export interface Bucket {
  key: string
  label: string
  rangeLabel: string
  hours: number
  earned: number
  paid: number
}

// Start of the period containing `date` (weeks start Monday)
export function periodStart(date: Date, range: Range) {
  if (range === 'month') return new Date(date.getFullYear(), date.getMonth(), 1)
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

function shiftPeriod(start: Date, range: Range, by: number) {
  return range === 'month'
    ? new Date(start.getFullYear(), start.getMonth() + by, 1)
    : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * by)
}

export function buildBuckets(timeEntries: TimeEntry[], payments: Payment[], range: Range, now = new Date()): Bucket[] {
  const current = periodStart(now, range)
  const buckets: Bucket[] = []
  for (let i = PERIOD_COUNT[range] - 1; i >= 0; i--) {
    const start = shiftPeriod(current, range, -i)
    const end = new Date(shiftPeriod(start, range, 1).getTime() - 1)
    buckets.push({
      key: start.toDateString(),
      label: range === 'month'
        ? start.toLocaleDateString(undefined, { month: 'short' })
        : start.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
      rangeLabel: range === 'month'
        ? start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      hours: 0,
      earned: 0,
      paid: 0,
    })
  }
  const byKey = new Map(buckets.map(b => [b.key, b]))
  for (const e of timeEntries) {
    const bucket = byKey.get(periodStart(parseISODate(e.date), range).toDateString())
    if (!bucket) continue
    bucket.hours += e.hours
    bucket.earned += e.hours * e.rate
  }
  for (const p of payments) {
    const bucket = byKey.get(periodStart(parseISODate(p.date), range).toDateString())
    if (bucket) bucket.paid += p.amount
  }
  return buckets
}

// Round the axis max up to a 1/2/5 step so gridlines land on clean numbers
export function niceMax(value: number) {
  if (value <= 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 5, 10].find(s => s * magnitude >= value) ?? 10
  return step * magnitude
}

export function compactMoney(amount: number) {
  return amount >= 1000 ? `$${Number((amount / 1000).toFixed(1))}k` : `$${amount}`
}

// All-time totals. owedHours is negative when paid ahead, and 0 with no rate set.
export function summarizeLedger(timeEntries: TimeEntry[], payments: Payment[], hourlyRate: number) {
  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0)
  const earned = timeEntries.reduce((sum, e) => sum + e.hours * e.rate, 0)
  const paid = payments.reduce((sum, p) => sum + p.amount, 0)
  const owed = earned - paid
  const owedHours = hourlyRate > 0 ? owed / hourlyRate : 0
  return { totalHours, earned, paid, owed, owedHours }
}

export type LedgerRow =
  | { kind: 'hours'; entry: TimeEntry }
  | { kind: 'payment'; entry: Payment }

// History list: newest date first, then most recently added (pending writes first)
export function ledgerRows(timeEntries: TimeEntry[], payments: Payment[]): LedgerRow[] {
  const all: LedgerRow[] = [
    ...timeEntries.map(entry => ({ kind: 'hours' as const, entry })),
    ...payments.map(entry => ({ kind: 'payment' as const, entry })),
  ]
  return all.sort((a, b) =>
    b.entry.date.localeCompare(a.entry.date)
    || (b.entry.createdAt?.toMillis?.() ?? Infinity) - (a.entry.createdAt?.toMillis?.() ?? Infinity),
  )
}

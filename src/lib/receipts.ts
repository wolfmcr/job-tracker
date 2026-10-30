import type { Receipt, ReceiptItem } from '../types'
import { todayISO } from './format'

export const MAX_ITEMS = 100
export const MAX_AMOUNT = 1_000_000

// Receipts are saved exactly as printed. Everything here is worked out on screen from that,
// so how tax is shared between jobs can change without touching saved data.

const cents = (dollars: number) => Math.round(dollars * 100)

export function receiptJobIds(items: ReceiptItem[]) {
  return [...new Set(items.map(i => i.jobId).filter((id): id is string => id !== null))]
}

// The receipt's tax split between jobs in proportion to their lines, in whole cents that add up
// exactly to the tax. The null key is the unassigned lines' part.
export function taxByJob(items: ReceiptItem[], tax: number): Map<string | null, number> {
  const lineCents = new Map<string | null, number>()
  for (const item of items) lineCents.set(item.jobId, (lineCents.get(item.jobId) ?? 0) + cents(item.amount))
  const sum = [...lineCents.values()].reduce((a, b) => a + b, 0)
  if (sum === 0) return new Map()

  // Largest remainder, on the tax's size; the sign goes back on at the end (returns have negative tax)
  const taxCents = Math.abs(cents(tax))
  const shares = [...lineCents].map(([key, c]) => {
    const exact = (taxCents * c) / sum
    return { key, exact, share: Math.floor(exact) }
  })
  let left = taxCents - shares.reduce((a, s) => a + s.share, 0)
  for (const s of [...shares].sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)))) {
    if (left <= 0) break
    s.share += 1
    left -= 1
  }
  const sign = tax < 0 ? -1 : 1
  return new Map(shares.map(s => [s.key, (sign * s.share) / 100 || 0]))
}

export interface JobReceiptGroup {
  receipt: Receipt
  items: ReceiptItem[]
  tax: number
  total: number
}

// A job's lines, grouped by receipt (newest first), each with its share of that receipt's tax
export function jobExpenses(receipts: Receipt[], jobId: string) {
  const groups: JobReceiptGroup[] = receipts
    .map(receipt => {
      const items = receipt.items.filter(i => i.jobId === jobId)
      const tax = taxByJob(receipt.items, receipt.tax).get(jobId) ?? 0
      return { receipt, items, tax, total: (items.reduce((a, i) => a + cents(i.amount), 0) + cents(tax)) / 100 }
    })
    .filter(g => g.items.length > 0)
    .sort((a, b) => b.receipt.date.localeCompare(a.receipt.date))
  return { groups, total: groups.reduce((a, g) => a + cents(g.total), 0) / 100 }
}

export function unassignedCount(receipt: Pick<Receipt, 'items'>) {
  return receipt.items.filter(i => i.jobId === null).length
}

// True when the lines plus tax don't add up to the total (a misread or a missed line)
export function itemsMismatch(items: ReceiptItem[], tax: number, total: number) {
  const sum = items.reduce((a, i) => a + cents(i.amount), 0)
  return items.length > 0 && sum + cents(tax) !== cents(total)
}

export interface ReceiptReading {
  store: string
  date: string
  tax: number
  total: number
  items: { name: string; amount: number }[]
}

function toMoney(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[$,\s]/g, '')) : NaN
  if (!Number.isFinite(n) || Math.abs(n) > MAX_AMOUNT) return null
  return cents(n) / 100
}

function toText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function toDate(value: unknown) {
  const today = todayISO()
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '2000-01-01' && value <= today
    ? value
    : today
}

// Whatever the model sent back, as a draft that's safe to put in the form
export function normalizeReading(raw: unknown): ReceiptReading {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const items = (Array.isArray(r.items) ? r.items : [])
    .map(i => (i && typeof i === 'object' ? i : {}) as Record<string, unknown>)
    .map(i => ({ name: toText(i.name, 200), amount: toMoney(i.amount) }))
    .filter((i): i is { name: string; amount: number } => i.name !== '' && i.amount !== null)
    .slice(0, MAX_ITEMS)
  return {
    store: toText(r.store, 200),
    date: toDate(r.date),
    tax: toMoney(r.tax) ?? 0,
    total: toMoney(r.total) ?? 0,
    items,
  }
}

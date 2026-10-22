import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SortPills } from '../ui/SortPills'
import { formatHours, formatMoney } from '../../lib/format'
import type { Payment, TimeEntry } from '../../types'

const EARNED_COLOR = '#3b82f6'
const PAID_COLOR = '#16a34a'
const PERIOD_COUNT = 8

type Range = 'week' | 'month'

interface Bucket {
  key: string
  label: string
  rangeLabel: string
  hours: number
  earned: number
  paid: number
}

function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Start of the period containing `date` (weeks start Monday)
function periodStart(date: Date, range: Range) {
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

function buildBuckets(timeEntries: TimeEntry[], payments: Payment[], range: Range): Bucket[] {
  const current = periodStart(new Date(), range)
  const buckets: Bucket[] = []
  for (let i = PERIOD_COUNT - 1; i >= 0; i--) {
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
    const bucket = byKey.get(periodStart(parseISO(e.date), range).toDateString())
    if (!bucket) continue
    bucket.hours += e.hours
    bucket.earned += e.hours * e.rate
  }
  for (const p of payments) {
    const bucket = byKey.get(periodStart(parseISO(p.date), range).toDateString())
    if (bucket) bucket.paid += p.amount
  }
  return buckets
}

function compactMoney(amount: number) {
  return amount >= 1000 ? `$${Number((amount / 1000).toFixed(1))}k` : `$${amount}`
}

interface Props {
  timeEntries: TimeEntry[]
  payments: Payment[]
}

export function LedgerChart({ timeEntries, payments }: Props) {
  const [range, setRange] = useState<Range>('week')
  const [selected, setSelected] = useState<number>(PERIOD_COUNT - 1)
  const buckets = useMemo(() => buildBuckets(timeEntries, payments, range), [timeEntries, payments, range])

  const detail = buckets[selected]

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-gray-100 shadow-sm bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <SortPills
          options={[{ key: 'week', label: 'Weekly' }, { key: 'month', label: 'Monthly' }]}
          active={range}
          onChange={key => {
            setRange(key as Range)
            setSelected(PERIOD_COUNT - 1)
          }}
        />
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: EARNED_COLOR }} />Earned</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PAID_COLOR }} />Paid</span>
        </div>
      </div>

      <div className="h-40" aria-label={`Earned and paid per ${range}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            barGap={2}
            onClick={state => {
              const index = Number(state.activeTooltipIndex)
              if (!Number.isNaN(index)) setSelected(index)
            }}
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} interval={0} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={compactMoney} width={40} tickCount={3} />
            <Tooltip cursor={{ fill: '#f9fafb' }} content={() => null} />
            <Bar dataKey="earned" name="Earned" fill={EARNED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false}>
              {buckets.map((b, i) => <Cell key={b.key} fillOpacity={i === selected ? 1 : 0.55} />)}
            </Bar>
            <Bar dataKey="paid" name="Paid" fill={PAID_COLOR} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false}>
              {buckets.map((b, i) => <Cell key={b.key} fillOpacity={i === selected ? 1 : 0.55} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">{detail.rangeLabel}</p>
        <div className="flex gap-4 mt-1 text-sm">
          <span className="text-gray-800 font-semibold">{formatHours(detail.hours)}</span>
          <span className="text-gray-500">Earned <span className="text-gray-800 font-semibold">{formatMoney(detail.earned)}</span></span>
          <span className="text-gray-500">Paid <span className="text-gray-800 font-semibold">{formatMoney(detail.paid)}</span></span>
        </div>
      </div>
    </div>
  )
}

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { SortPills } from '../ui/SortPills'
import { formatHours, formatMoney } from '../../lib/format'
import { buildBuckets, compactMoney, niceMax, PERIOD_COUNT, type Range } from '../../lib/ledger'
import type { Payment, TimeEntry } from '../../types'

const EARNED_COLOR = '#3b82f6'
const PAID_COLOR = '#16a34a'
const Y_AXIS_WIDTH = 34
const COLUMN_WIDTH = 52
const CHART_HEIGHT = 144
const CHART_TOP = 4

interface Props {
  timeEntries: TimeEntry[]
  payments: Payment[]
}

export function LedgerChart({ timeEntries, payments }: Props) {
  const [range, setRange] = useState<Range>('week')
  const [selected, setSelected] = useState<number>(PERIOD_COUNT.week - 1)
  const buckets = useMemo(() => buildBuckets(timeEntries, payments, range), [timeEntries, payments, range])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Start scrolled to the most recent period
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [range])

  const max = niceMax(Math.max(...buckets.map(b => Math.max(b.earned, b.paid))))
  const ticks = [0, max / 2, max]
  const plotWidth = buckets.length * COLUMN_WIDTH
  const detail = buckets[selected]

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-gray-100 shadow-sm bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <SortPills
          options={[{ key: 'week', label: 'Weekly' }, { key: 'month', label: 'Monthly' }]}
          active={range}
          onChange={key => {
            setRange(key as Range)
            setSelected(PERIOD_COUNT[key as Range] - 1)
          }}
        />
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: EARNED_COLOR }} />Earned</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PAID_COLOR }} />Paid</span>
        </div>
      </div>

      <div className="flex">
        {/* Fixed y-axis labels; the bars and period labels scroll beside them */}
        <div className="relative shrink-0" style={{ width: Y_AXIS_WIDTH, height: CHART_HEIGHT }}>
          {ticks.map(tick => (
            <span
              key={tick}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] text-gray-400"
              style={{ top: CHART_TOP + (1 - tick / max) * (CHART_HEIGHT - CHART_TOP) }}
            >
              {compactMoney(tick)}
            </span>
          ))}
        </div>

        <div ref={scrollRef} className="flex-1 min-w-0 overflow-x-auto [scrollbar-width:none]">
          <BarChart
            width={plotWidth}
            height={CHART_HEIGHT}
            data={buckets}
            margin={{ top: CHART_TOP, right: 0, bottom: 0, left: 0 }}
            barGap={2}
            accessibilityLayer={false}
            aria-label={`Earned and paid per ${range}`}
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, max]} ticks={ticks} />
            <Bar dataKey="earned" name="Earned" fill={EARNED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false}>
              {buckets.map((b, i) => <Cell key={b.key} fillOpacity={i === selected ? 1 : 0.55} />)}
            </Bar>
            <Bar dataKey="paid" name="Paid" fill={PAID_COLOR} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false}>
              {buckets.map((b, i) => <Cell key={b.key} fillOpacity={i === selected ? 1 : 0.55} />)}
            </Bar>
          </BarChart>

          {/* Period labels double as the selector, one per bar column */}
          <div className="flex" style={{ width: plotWidth }}>
            {buckets.map((b, i) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setSelected(i)}
                className="h-10 flex items-center justify-center shrink-0"
                style={{ width: COLUMN_WIDTH }}
              >
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                    i === selected ? 'bg-gray-900 text-white' : 'text-gray-400'
                  }`}
                >
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-gray-100">
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

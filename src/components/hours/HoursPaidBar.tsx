import { formatHours } from '../../lib/format'

const PAID_COLOR = '#16a34a'
const OWED_COLOR = '#93c5fd'

interface Props {
  worked: number
  owedHours: number // negative when paid ahead
}

// All-time hours worked, split into the part that's been paid for and the part still owed
export function HoursPaidBar({ worked, owedHours }: Props) {
  const owed = Math.max(0, Math.min(worked, owedHours))
  const paid = worked - owed
  const paidPercent = worked > 0 ? (paid / worked) * 100 : 100

  return (
    <div className="mt-3">
      <div
        className="flex h-3 gap-0.5 rounded-full overflow-hidden bg-gray-200"
        role="img"
        aria-label={`${formatHours(paid)} paid of ${formatHours(worked)} worked`}
      >
        {paid > 0 && <div style={{ width: `${paidPercent}%`, backgroundColor: PAID_COLOR }} />}
        {owed > 0 && <div className="flex-1" style={{ backgroundColor: OWED_COLOR }} />}
      </div>
      <div className="flex justify-between mt-2 text-sm">
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PAID_COLOR }} />
          Paid <span className="text-gray-800 font-semibold">{formatHours(paid)}</span>
        </span>
        {owed > 0 && (
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: OWED_COLOR }} />
            Owed <span className="text-gray-800 font-semibold">{formatHours(owed)}</span>
          </span>
        )}
      </div>
    </div>
  )
}

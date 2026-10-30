import { ImageIcon, ReceiptIcon } from 'lucide-react'
import { useState } from 'react'
import { ReceiptSheet } from '../components/receipts/ReceiptSheet'
import { EmptyState } from '../components/ui/EmptyState'
import { FAB } from '../components/ui/FAB'
import { JobBadge } from '../components/ui/JobBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SectionHeader } from '../components/ui/SectionHeader'
import { DEFAULT_JOB_COLOR } from '../constants/colors'
import { useArchivedJobs, useJobs } from '../hooks/useJobs'
import { useReceipts } from '../hooks/useReceipts'
import { formatDate, formatMoney, parseISODate } from '../lib/format'
import { unassignedCount } from '../lib/receipts'
import type { Receipt } from '../types'

// Receipts by month, newest first (they arrive sorted by date)
function byMonth(receipts: Receipt[]) {
  const months: { key: string; label: string; total: number; receipts: Receipt[] }[] = []
  for (const receipt of receipts) {
    const key = receipt.date.slice(0, 7)
    let month = months.at(-1)
    if (month?.key !== key) {
      const label = parseISODate(receipt.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      month = { key, label, total: 0, receipts: [] }
      months.push(month)
    }
    month.receipts.push(receipt)
    month.total = Math.round((month.total + receipt.total) * 100) / 100
  }
  return months
}

export function ExpensesScreen() {
  const { receipts, loading } = useReceipts()
  const { jobs } = useJobs()
  const { jobs: archivedJobs } = useArchivedJobs()
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<Receipt | null>(null)

  if (loading) return <LoadingSpinner />

  const allJobs = [...jobs, ...archivedJobs]
  const months = byMonth(receipts)

  return (
    <div className="pb-24">
      <ScreenHeader title="Expenses" />
      {months.length === 0 && <EmptyState icon={<ReceiptIcon size={40} />} message="No receipts yet. Tap + to add one." />}
      {months.map(month => (
        <div key={month.key}>
          <SectionHeader title={month.label} action={<span className="text-sm font-semibold text-gray-700">{formatMoney(month.total)}</span>} />
          {month.receipts.map(receipt => {
            const unassigned = unassignedCount(receipt)
            return (
              <button
                key={receipt.id}
                type="button"
                onClick={() => setOpen(receipt)}
                className="w-full text-left px-4 py-3 border-b border-gray-100 active:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium text-gray-900 min-w-0">
                    <span className="truncate">{receipt.store}</span>
                    {receipt.photoPath && <ImageIcon size={14} className="text-gray-400 shrink-0" aria-label="Has photo" />}
                  </span>
                  <span className="font-semibold text-gray-900 shrink-0">{formatMoney(receipt.total)}</span>
                </div>
                <p className="text-xs text-gray-400">{formatDate(receipt.date)}</p>
                <div className="flex flex-wrap gap-1">
                  {receipt.jobIds.map(jobId => {
                    const job = allJobs.find(j => j.id === jobId)
                    return job ? <JobBadge key={jobId} name={job.name} color={job.color || DEFAULT_JOB_COLOR} /> : null
                  })}
                  {unassigned > 0 && (
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 bg-amber-50 text-amber-700">
                      {unassigned} unassigned
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ))}
      <FAB onClick={() => setAdding(true)} label="Add receipt" />
      {adding && <ReceiptSheet onClose={() => setAdding(false)} />}
      {open && <ReceiptSheet receipt={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

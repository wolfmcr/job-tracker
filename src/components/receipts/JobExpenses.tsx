import { ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { useJobReceipts, useReceiptPhoto } from '../../hooks/useReceipts'
import { formatDate, formatMoney } from '../../lib/format'
import { jobExpenses } from '../../lib/receipts'
import type { Receipt } from '../../types'
import { SectionHeader } from '../ui/SectionHeader'
import { PhotoViewer } from './PhotoViewer'
import { ReceiptSheet } from './ReceiptSheet'

interface Props {
  jobId: string
  color: string
  readOnly: boolean
}

// The job's own lines from each receipt, with their share of that receipt's tax.
// Receipts are added on the Expenses tab; here they can be opened to check or fix.
export function JobExpenses({ jobId, color, readOnly }: Props) {
  const { receipts } = useJobReceipts(jobId)
  const [open, setOpen] = useState<Receipt | null>(null)
  const { groups, total } = jobExpenses(receipts, jobId)

  if (groups.length === 0) return null

  return (
    <div className="mt-4">
      <SectionHeader title="Expenses" color={color} action={<span className="text-sm font-semibold text-gray-700">{formatMoney(total)}</span>} />
      {groups.map(({ receipt, items, tax, total: groupTotal }) => (
        <button
          key={receipt.id}
          type="button"
          onClick={() => setOpen(receipt)}
          disabled={readOnly && !receipt.photoPath}
          className="w-full text-left px-4 py-3 border-b border-gray-100 active:bg-gray-50"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 min-w-0">
              <span className="truncate">{receipt.store}</span>
              {receipt.photoPath && <ImageIcon size={14} className="text-gray-400 shrink-0" aria-label="Has photo" />}
            </span>
            <span className="text-xs text-gray-400 shrink-0">{formatDate(receipt.date)}</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between gap-2 text-sm text-gray-600">
              <span className="truncate">{item.name}</span>
              <span className="shrink-0">{formatMoney(item.amount)}</span>
            </div>
          ))}
          {tax !== 0 && (
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax</span>
              <span>{formatMoney(tax)}</span>
            </div>
          )}
          <div className="flex justify-end text-sm font-medium text-gray-800 mt-0.5">{formatMoney(groupTotal)}</div>
        </button>
      ))}
      {open && (readOnly
        ? <ReadOnlyPhoto receipt={open} onClose={() => setOpen(null)} />
        : <ReceiptSheet receipt={open} onClose={() => setOpen(null)} />)}
    </div>
  )
}

// Archived jobs can't be edited, but their receipts can still be looked at
function ReadOnlyPhoto({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const url = useReceiptPhoto(receipt.photoPath)
  return url ? <PhotoViewer src={url} onClose={onClose} /> : null
}

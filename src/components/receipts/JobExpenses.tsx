import { ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { useJobReceipts, useReceiptPhoto } from '../../hooks/useReceipts'
import { formatDate, formatMoney } from '../../lib/format'
import { jobExpenses } from '../../lib/receipts'
import type { Receipt } from '../../types'
import { SectionHeader } from '../ui/SectionHeader'
import { PhotoViewer } from './PhotoViewer'
import { ReceiptSheet } from './ReceiptSheet'
import { ReceiptThumb } from './ReceiptThumb'

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
      <div className="flex flex-col gap-3 px-4 pt-3">
        {groups.map(({ receipt, items, tax, total: groupTotal }) => (
          <div key={receipt.id} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setOpen(receipt)}
              disabled={readOnly && !receipt.photoPath}
              className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-gray-50"
            >
              <ReceiptThumb photoPath={receipt.photoPath} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{receipt.store}</p>
                <p className="text-sm text-gray-500">{formatDate(receipt.date)} · {items.length} {items.length === 1 ? 'item' : 'items'}</p>
              </div>
              <span className="font-semibold text-gray-900 tabular-nums shrink-0">{formatMoney(groupTotal)}</span>
              <ChevronRightIcon size={16} className="text-gray-300 shrink-0 -mr-1" />
            </button>
            <div className="px-4 pb-3 pt-2 border-t border-gray-100 flex flex-col gap-1">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm text-gray-700">
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 tabular-nums">{formatMoney(item.amount)}</span>
                </div>
              ))}
              {tax !== 0 && (
                <div className="flex justify-between gap-3 text-sm text-gray-400">
                  <span>Tax</span>
                  <span className="tabular-nums">{formatMoney(tax)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
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

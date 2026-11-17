import { CameraIcon, LoaderIcon, PencilIcon, PlusIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import { useJobs } from '../../hooks/useJobs'
import { useReceiptPhoto } from '../../hooks/useReceipts'
import { formatDate, formatMoney, todayISO } from '../../lib/format'
import { shrinkImage } from '../../lib/image'
import { itemsMismatch, MAX_ITEMS, taxByJob } from '../../lib/receipts'
import { showToast } from '../../lib/toast'
import {
  addReceipt,
  deleteReceipt,
  discardReceiptPhoto,
  newReceiptId,
  updateReceipt,
  uploadReceiptPhoto,
} from '../../services/receiptService'
import { readReceipt } from '../../services/receiptReader'
import type { Job, Receipt, ReceiptItem } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { DeleteButton } from '../ui/DeleteButton'
import { Field } from '../ui/Field'
import { SubmitButton } from '../ui/SubmitButton'
import { PhotoViewer } from './PhotoViewer'

interface Props {
  // Present when editing a saved receipt
  receipt?: Receipt
  onClose: () => void
}

interface Line {
  key: number
  name: string
  printed?: string
  amount: string
  jobId: string | null
}

interface NewPhoto {
  url: string // local preview
  upload: Promise<string | null> // resolves to the Storage path, or null if it didn't upload
}

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

// Saved amounts shown the way they're written on a receipt
const moneyText = (n: number | undefined) => (n === undefined ? '' : n.toFixed(2))

let nextKey = 0
const toLine = (item: ReceiptItem): Line => ({ key: nextKey++, name: item.name, printed: item.printed, amount: moneyText(item.amount), jobId: item.jobId })
const blankLine = (): Line => ({ key: nextKey++, name: '', amount: '', jobId: null })

// Blank is null; anything else must be a number, kept to whole cents
function parseMoney(text: string): number | null | undefined {
  if (text.trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined
}

const jobColor = (job: Job | undefined) => (job ? job.color || DEFAULT_JOB_COLOR : undefined)

// Mounted only while open, so each receipt starts from a clean form.
// The form is built around tagging: items are a plain list you tick, then put on a job from the
// bar at the bottom. Store, date and totals sit in a summary line; everything is still editable.
export function ReceiptSheet({ receipt, onClose }: Props) {
  const { jobs } = useJobs()
  const [receiptId] = useState(() => receipt?.id ?? newReceiptId())
  const [stage, setStage] = useState<'pick' | 'reading' | 'form'>(receipt ? 'form' : 'pick')
  const [photo, setPhoto] = useState<NewPhoto | null>(null)
  const [viewing, setViewing] = useState(false)
  const savedPhotoUrl = useReceiptPhoto(receipt?.photoPath)
  const photoUrl = photo?.url ?? savedPhotoUrl

  const [store, setStore] = useState(receipt?.store ?? '')
  const [date, setDate] = useState(receipt?.date ?? todayISO())
  const [tax, setTax] = useState(moneyText(receipt?.tax))
  const [total, setTotal] = useState(moneyText(receipt?.total))
  const [note, setNote] = useState(receipt?.note ?? '')
  const [lines, setLines] = useState<Line[]>(() => (receipt ? receipt.items.map(toLine) : []))
  // Details open when there's nothing read yet (typed in, or the photo couldn't be read)
  const [detailsOpen, setDetailsOpen] = useState(!receipt)
  const [editing, setEditing] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())

  // A photo uploaded for a receipt that's then cancelled shouldn't be left in Storage
  const keepPhoto = useRef(false)
  useEffect(() => {
    if (!photo) return
    return () => {
      URL.revokeObjectURL(photo.url)
      if (!keepPhoto.current) photo.upload.then(path => path && discardReceiptPhoto(path))
    }
  }, [photo])

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    let small: Blob
    try {
      small = await shrinkImage(file)
    } catch (error) {
      console.error('[receipts] photo not opened', error)
      showToast('Couldn’t open that photo. Try another, or type the receipt in.')
      return
    }
    // Upload while it's being read, so saving doesn't wait on it
    setPhoto({ url: URL.createObjectURL(small), upload: uploadReceiptPhoto(receiptId, small) })
    setStage('reading')
    const reading = await readReceipt(small)
    if (reading) {
      setStore(reading.store)
      setDate(reading.date)
      setTax(reading.tax ? moneyText(reading.tax) : '')
      setTotal(reading.total ? moneyText(reading.total) : '')
      setLines(reading.items.map(item => toLine({ ...item, jobId: null })))
      setDetailsOpen(false)
    } else {
      showToast('Couldn’t read that receipt. Please fill it in.')
    }
    setStage('form')
  }

  function addLine() {
    const line = blankLine()
    setLines(prev => [...prev, line])
    setEditing(line.key)
  }

  function updateLine(key: number, fields: Partial<Line>) {
    setLines(prev => prev.map(l => (l.key === key ? { ...l, ...fields } : l)))
  }

  function removeLine(key: number) {
    setLines(prev => prev.filter(l => l.key !== key))
    setEditing(null)
  }

  function toggleSelected(key: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function putSelectedOn(jobId: string | null) {
    setLines(prev => prev.map(l => (selected.has(l.key) ? { ...l, jobId } : l)))
    setSelected(new Set())
  }

  // Lines left completely blank are ignored; any other line needs a name and an amount
  const filled = lines.filter(l => l.name.trim() !== '' || l.amount.trim() !== '')
  const items: ReceiptItem[] = filled.map(l => ({ name: l.name.trim(), ...(l.printed && { printed: l.printed }), amount: parseMoney(l.amount) ?? NaN, jobId: l.jobId }))
  const linesValid = items.every(i => i.name !== '' && Number.isFinite(i.amount))
  const taxValue = parseMoney(tax)
  const totalValue = parseMoney(total)
  const valid = store.trim() !== '' && !!date && typeof totalValue === 'number' && taxValue !== undefined && linesValid
  const numbersValid = typeof totalValue === 'number' && taxValue !== undefined && linesValid
  const itemsSum = items.reduce((a, i) => a + i.amount, 0)
  const mismatch = numbersValid && itemsMismatch(items, taxValue ?? 0, totalValue)
  const selectedCount = lines.filter(l => selected.has(l.key)).length
  const allSelected = lines.length > 0 && selectedCount === lines.length

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!valid) return
    const fields = { store: store.trim(), date, tax: taxValue ?? 0, total: totalValue, items, note: note.trim() }
    keepPhoto.current = true
    onClose()
    if (receipt) updateReceipt(receipt.id, fields)
    else addReceipt(receiptId, fields, photo ? await photo.upload : null)
  }

  function handleDelete() {
    if (receipt) deleteReceipt(receipt)
    onClose()
  }

  if (stage === 'pick') {
    return (
      <BottomSheet open onClose={onClose} title="Add Receipt">
        <div className="flex flex-col gap-3">
          <label className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl text-base flex items-center justify-center gap-2 active:opacity-80">
            <CameraIcon size={20} />
            Take or choose a photo
            <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
          </label>
          <button type="button" onClick={() => { setStage('form'); addLine() }} className="w-full py-3 text-sm text-gray-500">
            Type it in instead
          </button>
        </div>
      </BottomSheet>
    )
  }

  if (stage === 'reading') {
    return (
      <BottomSheet open onClose={onClose} title="Add Receipt">
        <div role="status" className="flex flex-col items-center gap-3 py-8 text-gray-500">
          {photo && <img src={photo.url} alt="" className="h-32 rounded-lg border border-gray-200 object-cover" />}
          <p className="flex items-center gap-2 text-sm"><LoaderIcon size={16} className="animate-spin" /> Reading receipt…</p>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={receipt ? 'Receipt' : 'Add Receipt'}
      footer={selectedCount > 0 ? <JobBar jobs={jobs} count={selectedCount} onPick={putSelectedOn} onClear={() => setSelected(new Set())} /> : undefined}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Store, date and total at a glance; tap Edit to change them */}
        <div className="flex items-center gap-3">
          {photoUrl && (
            <button type="button" onClick={() => setViewing(true)} className="shrink-0" aria-label="View receipt photo">
              <img src={photoUrl} alt="" className="w-12 h-16 rounded-md border border-gray-200 object-cover" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-lg font-semibold truncate ${store.trim() ? 'text-gray-900' : 'text-gray-400'}`}>{store.trim() || 'Store'}</p>
            <p className="text-sm text-gray-500 truncate">
              {date ? formatDate(date) : 'Date'} · {typeof totalValue === 'number' ? formatMoney(totalValue) : 'Total'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDetailsOpen(v => !v)}
            aria-expanded={detailsOpen}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600 active:bg-gray-50"
          >
            {detailsOpen ? 'Hide details' : <><PencilIcon size={13} /> Edit</>}
          </button>
        </div>

        {detailsOpen && (
          <div className="flex flex-col gap-3 p-4 -mt-1 bg-gray-50 rounded-xl">
            <Field label="Store" required>
              <input type="text" value={store} onChange={e => setStore(e.target.value)} className={inputClass} required />
            </Field>
            <Field label="Date" required>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} required />
            </Field>
            <div className="flex gap-3">
              <Field label="Tax" className="flex-1">
                <input type="text" inputMode="decimal" value={tax} onChange={e => setTax(e.target.value.replace(/[^\d.-]/g, ''))} className={inputClass} />
              </Field>
              <Field label="Total" required className="flex-1">
                <input type="text" inputMode="decimal" value={total} onChange={e => setTotal(e.target.value.replace(/[^\d.-]/g, ''))} className={inputClass} required />
              </Field>
            </div>
            <Field label="Note">
              <input type="text" value={note} onChange={e => setNote(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {/* Items: tick them, then pick a job in the bar that appears at the bottom */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between py-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Items</p>
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => setSelected(allSelected ? new Set() : new Set(lines.map(l => l.key)))}
                className="text-sm font-medium text-blue-600 py-1"
              >
                {allSelected ? 'Clear selection' : 'Select all'}
              </button>
            )}
          </div>
          {lines.length === 0 && <p className="text-sm text-gray-400 py-3">No items yet.</p>}
          {lines.map((line, index) => {
            const job = jobs.find(j => j.id === line.jobId)
            const color = jobColor(job)
            const label = line.name.trim() || `item ${index + 1}`
            const isSelected = selected.has(line.key)
            const amount = parseMoney(line.amount)
            return (
              <div key={line.key} className="border-b border-gray-100">
                <div
                  onClick={() => toggleSelected(line.key)}
                  className={`flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg ${isSelected ? 'bg-blue-50' : 'active:bg-gray-50'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(line.key)}
                    onClick={e => e.stopPropagation()}
                    aria-label={`Select ${label}`}
                    className="w-5 h-5 shrink-0 accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3">
                      <span className={`flex-1 truncate text-base ${line.name.trim() ? 'text-gray-800' : 'text-gray-400'}`}>{line.name.trim() || 'New item'}</span>
                      <span className={`shrink-0 tabular-nums text-base ${typeof amount === 'number' && amount < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                        {typeof amount === 'number' ? amount.toFixed(2).replace('-', '−') : line.amount}
                      </span>
                    </div>
                    {line.jobId ? (
                      <p className="flex items-center gap-1.5 text-xs font-medium truncate" style={{ color: color ?? '#6b7280' }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color ?? '#9ca3af' }} />
                        {job?.name ?? 'Archived job'}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No job</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setEditing(editing === line.key ? null : line.key) }}
                    aria-label={`Edit ${label}`}
                    className="shrink-0 p-2 -mr-1 text-gray-400 active:text-gray-600"
                  >
                    <PencilIcon size={16} />
                  </button>
                </div>
                {editing === line.key && (
                  <ItemEditor
                    line={line}
                    onChange={fields => updateLine(line.key, fields)}
                    onRemove={() => removeLine(line.key)}
                    onDone={() => setEditing(null)}
                  />
                )}
              </div>
            )
          })}
          {lines.length < MAX_ITEMS && (
            <button type="button" onClick={addLine} className="self-start flex items-center gap-1 text-sm font-medium text-blue-600 py-3">
              <PlusIcon size={16} /> Add item
            </button>
          )}
        </div>

        {/* Totals, and what goes to each job */}
        <div className="flex flex-col gap-1.5 text-sm">
          {items.length > 0 && (
            <div className="flex justify-between text-gray-500"><span>Items</span><span className="tabular-nums">{Number.isFinite(itemsSum) ? formatMoney(itemsSum) : '—'}</span></div>
          )}
          <div className="flex justify-between text-gray-500"><span>Tax</span><span className="tabular-nums">{typeof taxValue === 'number' ? formatMoney(taxValue) : taxValue === undefined ? tax : formatMoney(0)}</span></div>
          <div className="flex justify-between font-semibold text-gray-900 text-base"><span>Total</span><span className="tabular-nums">{typeof totalValue === 'number' ? formatMoney(totalValue) : '—'}</span></div>
        </div>

        {mismatch && (
          <p role="status" className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            <TriangleAlertIcon size={16} className="shrink-0 mt-0.5" />
            Items plus tax come to {formatMoney(itemsSum + (taxValue ?? 0))}, but the total is {formatMoney(totalValue)}.
          </p>
        )}

        {numbersValid && items.length > 0 && <JobSplit items={items} tax={taxValue ?? 0} jobs={jobs} />}

        <SubmitButton label={receipt ? 'Save' : 'Save Receipt'} disabled={!valid} />
        {receipt && <DeleteButton onDelete={handleDelete} />}
      </form>
      {viewing && photoUrl && <PhotoViewer src={photoUrl} onClose={() => setViewing(false)} />}
    </BottomSheet>
  )
}

interface ItemEditorProps {
  line: Line
  onChange: (fields: Partial<Line>) => void
  onRemove: () => void
  onDone: () => void
}

// Opens under an item to fix its name or amount; the receipt's own wording is kept for checking
function ItemEditor({ line, onChange, onRemove, onDone }: ItemEditorProps) {
  return (
    <div className="flex flex-col gap-3 p-4 mb-3 bg-gray-50 rounded-xl">
      <Field label="Item name" required>
        <input type="text" value={line.name} onChange={e => onChange({ name: e.target.value })} className={inputClass} autoFocus />
      </Field>
      <Field label="Amount ($)" required>
        <input type="text" inputMode="decimal" value={line.amount} onChange={e => onChange({ amount: e.target.value.replace(/[^\d.-]/g, '') })} className={inputClass} />
      </Field>
      {line.printed && <p className="text-xs text-gray-500">On the receipt: <span className="font-mono">{line.printed}</span></p>}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onRemove} className="text-sm font-medium text-red-500 py-1">Remove item</button>
        <button type="button" onClick={onDone} className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-900 text-white">Done</button>
      </div>
    </div>
  )
}

// Pinned under the list while items are ticked: one tap assigns them all to a job
function JobBar({ jobs, count, onPick, onClear }: { jobs: Job[]; count: number; onPick: (jobId: string | null) => void; onClear: () => void }) {
  return (
    <div role="toolbar" aria-label="Assign selected items to a job">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{count} {count === 1 ? 'item' : 'items'} selected · assign to</p>
        <button type="button" onClick={onClear} className="text-sm text-gray-500 py-1">Clear</button>
      </div>
      <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto">
        {jobs.map(job => (
          <button
            key={job.id}
            type="button"
            onClick={() => onPick(job.id)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-800 active:bg-gray-100"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: jobColor(job) }} />
            {job.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPick(null)}
          className="px-3.5 py-2 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-500 active:bg-gray-100"
        >
          No job
        </button>
      </div>
    </div>
  )
}

// What each job's part of this receipt comes to, tax included, so the split can be checked before saving
function JobSplit({ items, tax, jobs }: { items: ReceiptItem[]; tax: number; jobs: Job[] }) {
  const taxes = taxByJob(items, tax)
  const totals = new Map<string | null, number>()
  for (const item of items) totals.set(item.jobId, (totals.get(item.jobId) ?? 0) + item.amount)
  return (
    <div className="flex flex-col gap-1.5 p-4 bg-gray-50 rounded-xl text-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">By job</p>
      {[...totals].map(([jobId, sum]) => {
        const job = jobs.find(j => j.id === jobId)
        const color = jobColor(job)
        return (
          <div key={jobId ?? 'none'} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: jobId ? color ?? '#9ca3af' : '#f59e0b' }} />
            <span className={`flex-1 truncate ${jobId ? 'text-gray-700' : 'text-amber-700'}`}>{jobId ? job?.name ?? 'Archived job' : 'No job'}</span>
            <span className="text-gray-900 font-medium tabular-nums">{formatMoney(sum + (taxes.get(jobId) ?? 0))}</span>
          </div>
        )
      })}
    </div>
  )
}

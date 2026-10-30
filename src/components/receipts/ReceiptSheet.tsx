import { CameraIcon, PlusIcon, TriangleAlertIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DEFAULT_JOB_COLOR } from '../../constants/colors'
import { useJobs } from '../../hooks/useJobs'
import { useReceiptPhoto } from '../../hooks/useReceipts'
import { formatMoney, todayISO } from '../../lib/format'
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
import type { Job, Receipt, ReceiptItem } from '../../types'
import { BottomSheet } from '../ui/BottomSheet'
import { DeleteButton } from '../ui/DeleteButton'
import { Field, FieldLabel } from '../ui/Field'
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
  amount: string
  jobId: string | null
}

interface NewPhoto {
  url: string // local preview
  upload: Promise<string | null> // resolves to the Storage path, or null if it didn't upload
}

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500'
const smallInputClass = 'px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

// Saved amounts shown the way they're written on a receipt
const moneyText = (n: number | undefined) => (n === undefined ? '' : n.toFixed(2))

let nextKey = 0
const toLine = (item: Pick<ReceiptItem, 'name' | 'amount' | 'jobId'>): Line => ({ key: nextKey++, name: item.name, amount: moneyText(item.amount), jobId: item.jobId })
const blankLine = (): Line => ({ key: nextKey++, name: '', amount: '', jobId: null })

// Blank is null; anything else must be a number, kept to whole cents
function parseMoney(text: string): number | null | undefined {
  if (text.trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined
}


// Mounted only while open, so each receipt starts from a clean form
export function ReceiptSheet({ receipt, onClose }: Props) {
  const { jobs } = useJobs()
  const [receiptId] = useState(() => receipt?.id ?? newReceiptId())
  const [stage, setStage] = useState<'pick' | 'form'>(receipt ? 'form' : 'pick')
  const [photo, setPhoto] = useState<NewPhoto | null>(null)
  const [viewing, setViewing] = useState(false)
  const savedPhotoUrl = useReceiptPhoto(receipt?.photoPath)
  const photoUrl = photo?.url ?? savedPhotoUrl

  const [store, setStore] = useState(receipt?.store ?? '')
  const [date, setDate] = useState(receipt?.date ?? todayISO())
  const [tax, setTax] = useState(moneyText(receipt?.tax))
  const [total, setTotal] = useState(moneyText(receipt?.total))
  const [note, setNote] = useState(receipt?.note ?? '')
  const [lines, setLines] = useState<Line[]>(() => (receipt ? receipt.items.map(toLine) : [blankLine()]))

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
    try {
      const small = await shrinkImage(file)
      setPhoto({ url: URL.createObjectURL(small), upload: uploadReceiptPhoto(receiptId, small) })
    } catch (error) {
      console.error('[receipts] photo not read', error)
      showToast('Couldn’t open that photo. Try another, or type the receipt in.')
      return
    }
    setStage('form')
  }

  // Lines left completely blank are ignored; any other line needs a name and an amount
  const filled = lines.filter(l => l.name.trim() !== '' || l.amount.trim() !== '')
  const items: ReceiptItem[] = filled.map(l => ({ name: l.name.trim(), amount: parseMoney(l.amount) ?? NaN, jobId: l.jobId }))
  const linesValid = items.every(i => i.name !== '' && Number.isFinite(i.amount))
  const taxValue = parseMoney(tax)
  const totalValue = parseMoney(total)
  const valid = store.trim() !== '' && !!date && typeof totalValue === 'number' && taxValue !== undefined && linesValid
  const numbersValid = typeof totalValue === 'number' && taxValue !== undefined && linesValid
  const mismatch = numbersValid && itemsMismatch(items, taxValue ?? 0, totalValue)

  function updateLine(key: number, fields: Partial<Line>) {
    setLines(prev => prev.map(l => (l.key === key ? { ...l, ...fields } : l)))
  }

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
          <button type="button" onClick={() => setStage('form')} className="w-full py-3 text-sm text-gray-500">
            Type it in instead
          </button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open onClose={onClose} title={receipt ? 'Receipt' : 'Add Receipt'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {photoUrl && (
          <button type="button" onClick={() => setViewing(true)} className="self-start" aria-label="View receipt photo">
            <img src={photoUrl} alt="" className="h-24 rounded-lg border border-gray-200 object-cover" />
          </button>
        )}
        <Field label="Store" required>
          <input type="text" value={store} onChange={e => setStore(e.target.value)} className={inputClass} required />
        </Field>
        <Field label="Date" required>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} required />
        </Field>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <FieldLabel>Lines</FieldLabel>
            {filled.length > 1 && jobs.length > 0 && (
              <select
                aria-label="Put all lines on a job"
                value=""
                onChange={e => setLines(prev => prev.map(l => ({ ...l, jobId: e.target.value || null })))}
                className="text-sm text-blue-600 bg-transparent"
              >
                <option value="" disabled>All to…</option>
                {jobs.map(job => <option key={job.id} value={job.id}>{job.name}</option>)}
              </select>
            )}
          </div>
          {lines.map((line, index) => (
            <div key={line.key} className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label={`Line ${index + 1} name`}
                  value={line.name}
                  onChange={e => updateLine(line.key, { name: e.target.value })}
                  className={`${smallInputClass} flex-1 min-w-0`}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`Line ${index + 1} amount`}
                  value={line.amount}
                  onChange={e => updateLine(line.key, { amount: e.target.value.replace(/[^\d.-]/g, '') })}
                  className={`${smallInputClass} w-24 text-right`}
                />
                <button
                  type="button"
                  onClick={() => setLines(prev => prev.filter(l => l.key !== line.key))}
                  aria-label={`Remove line ${index + 1}`}
                  className="text-gray-300 px-1"
                >
                  <XIcon size={18} />
                </button>
              </div>
              <JobSelect
                jobs={jobs}
                value={line.jobId}
                onChange={jobId => updateLine(line.key, { jobId })}
                label={`Line ${index + 1} job`}
              />
            </div>
          ))}
          {lines.length < MAX_ITEMS && (
            <button type="button" onClick={() => setLines(prev => [...prev, blankLine()])} className="self-start flex items-center gap-1 text-sm text-blue-600 py-1">
              <PlusIcon size={16} /> Add line
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <Field label="Tax" className="flex-1">
            <input type="text" inputMode="decimal" value={tax} onChange={e => setTax(e.target.value.replace(/[^\d.-]/g, ''))} className={inputClass} />
          </Field>
          <Field label="Total" required className="flex-1">
            <input type="text" inputMode="decimal" value={total} onChange={e => setTotal(e.target.value.replace(/[^\d.-]/g, ''))} className={inputClass} required />
          </Field>
        </div>

        {mismatch && (
          <p role="status" className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            <TriangleAlertIcon size={16} className="shrink-0 mt-0.5" />
            Lines plus tax come to {formatMoney(items.reduce((a, i) => a + i.amount, 0) + (taxValue ?? 0))}, but the total is {formatMoney(totalValue)}.
          </p>
        )}

        {numbersValid && items.length > 0 && <JobSplit items={items} tax={taxValue ?? 0} jobs={jobs} />}

        <Field label="Note">
          <input type="text" value={note} onChange={e => setNote(e.target.value)} className={inputClass} />
        </Field>
        <SubmitButton label={receipt ? 'Save' : 'Save Receipt'} disabled={!valid} />
        {receipt && <DeleteButton onDelete={handleDelete} />}
      </form>
      {viewing && photoUrl && <PhotoViewer src={photoUrl} onClose={() => setViewing(false)} />}
    </BottomSheet>
  )
}

interface JobSelectProps {
  jobs: Job[]
  value: string | null
  onChange: (jobId: string | null) => void
  label: string
}

// Native picker: quick on a phone, even with a lot of lines
function JobSelect({ jobs, value, onChange, label }: JobSelectProps) {
  const job = jobs.find(j => j.id === value)
  const color = job ? job.color || DEFAULT_JOB_COLOR : undefined
  return (
    <select
      aria-label={label}
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      className={`self-start max-w-full text-sm font-medium px-3 py-1.5 rounded-full border ${job ? '' : 'text-amber-700 bg-amber-50 border-amber-200'}`}
      style={color ? { color, backgroundColor: `${color}15`, borderColor: `${color}30` } : undefined}
    >
      <option value="">Unassigned</option>
      {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
      {value && !job && <option value={value}>Archived job</option>}
    </select>
  )
}

// What each job's part of this receipt comes to, tax included, so the split can be checked before saving
function JobSplit({ items, tax, jobs }: { items: ReceiptItem[]; tax: number; jobs: Job[] }) {
  const taxes = taxByJob(items, tax)
  const totals = new Map<string | null, number>()
  for (const item of items) totals.set(item.jobId, (totals.get(item.jobId) ?? 0) + item.amount)
  return (
    <div className="flex flex-col gap-1 text-sm">
      {[...totals].map(([jobId, sum]) => (
        <div key={jobId ?? 'none'} className="flex justify-between">
          <span className={jobId ? 'text-gray-600' : 'text-amber-700'}>{jobId ? jobs.find(j => j.id === jobId)?.name ?? 'Archived job' : 'Unassigned'}</span>
          <span className="text-gray-800 font-medium">{formatMoney(sum + (taxes.get(jobId) ?? 0))}</span>
        </div>
      ))}
    </div>
  )
}

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeJob, makeReceipt } from '../../test/fixtures'
import { ReceiptSheet } from './ReceiptSheet'

const service = vi.hoisted(() => ({
  addReceipt: vi.fn(),
  updateReceipt: vi.fn(),
  deleteReceipt: vi.fn(),
  discardReceiptPhoto: vi.fn(),
  uploadReceiptPhoto: vi.fn(),
  newReceiptId: () => 'new-id',
}))
vi.mock('../../services/receiptService', () => service)
const reader = vi.hoisted(() => ({ readReceipt: vi.fn() }))
vi.mock('../../services/receiptReader', () => reader)
vi.mock('../../lib/image', () => ({ shrinkImage: async (file: Blob) => file }))
vi.mock('../../hooks/useJobs', () => ({
  useJobs: () => ({ jobs: [makeJob({ id: 'alder', name: 'Alder St' }), makeJob({ id: 'shop', name: 'The Shop' })], loading: false }),
}))
vi.mock('../../hooks/useReceipts', () => ({ useReceiptPhoto: () => null }))

beforeEach(() => {
  vi.clearAllMocks()
  service.uploadReceiptPhoto.mockResolvedValue('receipts/new-id.jpg')
  URL.createObjectURL = () => 'blob:preview'
  URL.revokeObjectURL = () => {}
})

async function pickPhoto() {
  const user = userEvent.setup()
  render(<ReceiptSheet onClose={() => {}} />)
  await user.upload(screen.getByLabelText('Take or choose a photo'), new File(['x'], 'receipt.jpg', { type: 'image/jpeg' }))
  return user
}

async function typeItIn() {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<ReceiptSheet onClose={onClose} />)
  await user.click(screen.getByRole('button', { name: 'Type it in instead' }))
  await user.type(screen.getByLabelText(/Store/), 'Hardware Co')
  return { user, onClose }
}

// The editor for the item being edited (only one is open at a time)
async function fillItem(user: ReturnType<typeof userEvent.setup>, name: string, amount: string) {
  await user.type(screen.getByLabelText(/Item name/), name)
  await user.type(screen.getByLabelText(/Amount/), amount)
  await user.click(screen.getByRole('button', { name: 'Done' }))
}

// The text of an item's row: name, amount and which job it's on
function rowOf(itemName: string) {
  return screen.getByLabelText(`Select ${itemName}`).parentElement!.textContent
}

describe('ReceiptSheet', () => {
  it('starts by asking for a photo, with typing it in as the alternative', () => {
    render(<ReceiptSheet onClose={() => {}} />)
    expect(screen.getByText('Take or choose a photo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Type it in instead' })).toBeInTheDocument()
  })

  it('saves a typed-in receipt, items on no job until tagged', async () => {
    const { user, onClose } = await typeItIn()
    // Typing it in opens with one item ready to fill
    await fillItem(user, 'Studs', '60')
    await user.click(screen.getByRole('button', { name: /Add item/ }))
    await fillItem(user, 'Roller', '15')
    await user.click(screen.getByLabelText('Select Roller'))
    await user.click(within(screen.getByRole('toolbar')).getByRole('button', { name: 'The Shop' }))
    await user.type(screen.getByLabelText(/Tax/), '6')
    await user.type(screen.getByLabelText(/Total/), '81')
    await user.click(screen.getByRole('button', { name: 'Save Receipt' }))

    await waitFor(() => expect(service.addReceipt).toHaveBeenCalled())
    expect(service.addReceipt).toHaveBeenCalledWith('new-id', {
      store: 'Hardware Co',
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      tax: 6,
      total: 81,
      items: [{ name: 'Studs', amount: 60, jobId: null }, { name: 'Roller', amount: 15, jobId: 'shop' }],
      note: '',
    }, null)
    expect(onClose).toHaveBeenCalled()
  })

  it('ticks items and assigns them to a job from the bar; the bar goes once they’re tagged', async () => {
    const { user } = await typeItIn()
    await fillItem(user, 'Studs', '60')
    await user.click(screen.getByRole('button', { name: /Add item/ }))
    await fillItem(user, 'Screws', '25')
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(screen.getByRole('toolbar')).toHaveTextContent('2 items selected')
    await user.click(within(screen.getByRole('toolbar')).getByRole('button', { name: 'Alder St' }))
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
    expect(rowOf('Studs')).toContain('Alder St')
    expect(rowOf('Screws')).toContain('Alder St')

    // Tapping the row itself also selects it; "No job" takes the tag off again
    await user.click(screen.getByText('Screws'))
    await user.click(within(screen.getByRole('toolbar')).getByRole('button', { name: 'No job' }))
    expect(rowOf('Screws')).toContain('No job')
    expect(rowOf('Studs')).toContain('Alder St')
  })

  it('warns, but still saves, when items and tax don’t add up to the total', async () => {
    const { user } = await typeItIn()
    await fillItem(user, 'Studs', '60')
    await user.type(screen.getByLabelText(/Total/), '70')
    expect(screen.getByRole('status')).toHaveTextContent('Items plus tax come to $60.00, but the total is $70.00.')
    expect(screen.getByRole('button', { name: 'Save Receipt' })).toBeEnabled()
  })

  it('shows what each job’s part comes to, tax included', async () => {
    const { user } = await typeItIn()
    await fillItem(user, 'Studs', '60')
    await user.click(screen.getByLabelText('Select Studs'))
    await user.click(within(screen.getByRole('toolbar')).getByRole('button', { name: 'Alder St' }))
    await user.click(screen.getByRole('button', { name: /Add item/ }))
    await fillItem(user, 'Gloves', '40')
    await user.type(screen.getByLabelText(/Tax/), '8')
    await user.type(screen.getByLabelText(/Total/), '108')
    expect(screen.getByText('$64.80')).toBeInTheDocument()
    expect(screen.getByText('$43.20')).toBeInTheDocument()
  })

  it('needs a store, a total, and a name and amount on every item used', async () => {
    const { user } = await typeItIn()
    const save = screen.getByRole('button', { name: 'Save Receipt' })
    expect(save).toBeDisabled()
    await user.type(screen.getByLabelText(/Total/), '10')
    expect(save).toBeEnabled()
    await user.type(screen.getByLabelText(/Amount/), '10')
    expect(save).toBeDisabled()
    await user.type(screen.getByLabelText(/Item name/), 'Tape')
    expect(save).toBeEnabled()
  })

  it('edits an item’s name and amount, shows the receipt’s wording, and can remove it', async () => {
    const user = userEvent.setup()
    const receipt = makeReceipt({ id: 'r1', items: [{ name: 'Studs', printed: '2X4 STD', amount: 60, jobId: null }, { name: 'Tape', amount: 5, jobId: null }], total: 65 })
    render(<ReceiptSheet receipt={receipt} onClose={() => {}} />)
    await user.click(screen.getByLabelText('Edit Studs'))
    expect(screen.getByText('2X4 STD')).toBeInTheDocument()
    const name = screen.getByLabelText(/Item name/)
    await user.clear(name)
    await user.type(name, 'Studs × 3')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByLabelText('Edit Tape'))
    await user.click(screen.getByRole('button', { name: 'Remove item' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(service.updateReceipt).toHaveBeenCalledWith('r1', expect.objectContaining({ items: [{ name: 'Studs × 3', printed: '2X4 STD', amount: 60, jobId: null }] }))
  })

  it('edits a saved receipt: details start folded, re-tag an item, save', async () => {
    const user = userEvent.setup()
    const receipt = makeReceipt({ id: 'r1', items: [{ name: 'Studs', amount: 60, jobId: null }], total: 60 })
    render(<ReceiptSheet receipt={receipt} onClose={() => {}} />)
    expect(screen.getByText('Hardware Co')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Store/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText(/Store/)).toHaveValue('Hardware Co')
    await user.click(screen.getByLabelText('Select Studs'))
    await user.click(within(screen.getByRole('toolbar')).getByRole('button', { name: 'Alder St' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(service.updateReceipt).toHaveBeenCalledWith('r1', expect.objectContaining({ items: [{ name: 'Studs', amount: 60, jobId: 'alder' }] }))
  })

  it('an item tagged to an archived job keeps its tag', async () => {
    const receipt = makeReceipt({ items: [{ name: 'Studs', amount: 60, jobId: 'old-job' }] })
    render(<ReceiptSheet receipt={receipt} onClose={() => {}} />)
    expect(rowOf('Studs')).toContain('Archived job')
  })

  it('deletes after a second tap', async () => {
    const user = userEvent.setup()
    const receipt = makeReceipt({ id: 'r1' })
    render(<ReceiptSheet receipt={receipt} onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Tap again to delete' }))
    expect(service.deleteReceipt).toHaveBeenCalledWith(receipt)
  })

  it('reads a photo and pre-fills the form, every item on no job', async () => {
    reader.readReceipt.mockResolvedValue({ store: 'Hardware Co', date: '2026-10-29', tax: 2.52, total: 34.01, items: [{ name: 'Primer, 1 gal', printed: 'PRMR 1G', amount: 24.99 }, { name: 'Tape', printed: 'Tape', amount: 6.5 }] })
    const user = await pickPhoto()
    expect(await screen.findByText('Hardware Co')).toBeInTheDocument()
    expect(screen.getByText('Primer, 1 gal')).toBeInTheDocument()
    expect(screen.getByText('6.50')).toBeInTheDocument()
    expect(rowOf('Tape')).toContain('No job')
    expect(screen.queryByLabelText(/Store/)).not.toBeInTheDocument() // read fine, so details stay folded
    expect(service.uploadReceiptPhoto).toHaveBeenCalledWith('new-id', expect.any(Blob))

    await user.click(screen.getByRole('button', { name: 'Save Receipt' }))
    await waitFor(() => expect(service.addReceipt).toHaveBeenCalledWith('new-id', expect.objectContaining({ store: 'Hardware Co', date: '2026-10-29', total: 34.01, items: [
      { name: 'Primer, 1 gal', printed: 'PRMR 1G', amount: 24.99, jobId: null },
      { name: 'Tape', printed: 'Tape', amount: 6.5, jobId: null },
    ] }), 'receipts/new-id.jpg'))
    expect(service.discardReceiptPhoto).not.toHaveBeenCalled()
  })

  it('shows the photo while reading', async () => {
    reader.readReceipt.mockReturnValue(new Promise(() => {}))
    await pickPhoto()
    expect(await screen.findByText('Reading receipt…')).toBeInTheDocument()
  })

  it('falls back to an empty form, details open, if the photo can’t be read', async () => {
    reader.readReceipt.mockResolvedValue(null)
    await pickPhoto()
    expect(await screen.findByLabelText(/Store/)).toHaveValue('')
    expect(screen.getByText('No items yet.')).toBeInTheDocument()
  })

  it('throws away the uploaded photo if the receipt isn’t saved', async () => {
    reader.readReceipt.mockResolvedValue(null)
    const user = await pickPhoto()
    await screen.findByLabelText(/Store/)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    // onClose is a no-op here; unmounting is what a real close does
    cleanup()
    await waitFor(() => expect(service.discardReceiptPhoto).toHaveBeenCalledWith('receipts/new-id.jpg'))
  })
})

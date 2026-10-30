import { render, screen, waitFor, within } from '@testing-library/react'
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
vi.mock('../../hooks/useJobs', () => ({
  useJobs: () => ({ jobs: [makeJob({ id: 'alder', name: 'Alder St' }), makeJob({ id: 'shop', name: 'The Shop' })], loading: false }),
}))
vi.mock('../../hooks/useReceipts', () => ({ useReceiptPhoto: () => null }))

beforeEach(() => vi.clearAllMocks())

async function typeItIn() {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<ReceiptSheet onClose={onClose} />)
  await user.click(screen.getByRole('button', { name: 'Type it in instead' }))
  await user.type(screen.getByLabelText(/Store/), 'Hardware Co')
  return { user, onClose }
}

describe('ReceiptSheet', () => {
  it('starts by asking for a photo, with typing it in as the alternative', () => {
    render(<ReceiptSheet onClose={() => {}} />)
    expect(screen.getByText('Take or choose a photo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Type it in instead' })).toBeInTheDocument()
  })

  it('saves a typed-in receipt with lines unassigned until tagged', async () => {
    const { user, onClose } = await typeItIn()
    await user.type(screen.getByLabelText('Line 1 name'), 'Studs')
    await user.type(screen.getByLabelText('Line 1 amount'), '60')
    await user.click(screen.getByRole('button', { name: /Add line/ }))
    await user.type(screen.getByLabelText('Line 2 name'), 'Roller')
    await user.type(screen.getByLabelText('Line 2 amount'), '15')
    await user.selectOptions(screen.getByLabelText('Line 2 job'), 'The Shop')
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

  it('“All to…” puts every line on one job', async () => {
    const { user } = await typeItIn()
    await user.type(screen.getByLabelText('Line 1 name'), 'Studs')
    await user.type(screen.getByLabelText('Line 1 amount'), '60')
    await user.click(screen.getByRole('button', { name: /Add line/ }))
    await user.type(screen.getByLabelText('Line 2 name'), 'Screws')
    await user.type(screen.getByLabelText('Line 2 amount'), '25')
    await user.selectOptions(screen.getByLabelText('Put all lines on a job'), 'Alder St')
    expect(screen.getByLabelText('Line 1 job')).toHaveValue('alder')
    expect(screen.getByLabelText('Line 2 job')).toHaveValue('alder')
  })

  it('warns, but still saves, when lines and tax don’t add up to the total', async () => {
    const { user } = await typeItIn()
    await user.type(screen.getByLabelText('Line 1 name'), 'Studs')
    await user.type(screen.getByLabelText('Line 1 amount'), '60')
    await user.type(screen.getByLabelText(/Total/), '70')
    expect(screen.getByRole('status')).toHaveTextContent('Lines plus tax come to $60.00, but the total is $70.00.')
    expect(screen.getByRole('button', { name: 'Save Receipt' })).toBeEnabled()
  })

  it('shows what each job’s part comes to, tax included', async () => {
    const { user } = await typeItIn()
    await user.type(screen.getByLabelText('Line 1 name'), 'Studs')
    await user.type(screen.getByLabelText('Line 1 amount'), '60')
    await user.selectOptions(screen.getByLabelText('Line 1 job'), 'Alder St')
    await user.click(screen.getByRole('button', { name: /Add line/ }))
    await user.type(screen.getByLabelText('Line 2 name'), 'Gloves')
    await user.type(screen.getByLabelText('Line 2 amount'), '40')
    await user.type(screen.getByLabelText(/Tax/), '8')
    await user.type(screen.getByLabelText(/Total/), '108')
    expect(screen.getByText('$64.80')).toBeInTheDocument()
    expect(screen.getByText('$43.20')).toBeInTheDocument()
  })

  it('needs a store, a total, and a name and amount on every line used', async () => {
    const { user } = await typeItIn()
    const save = screen.getByRole('button', { name: 'Save Receipt' })
    expect(save).toBeDisabled()
    await user.type(screen.getByLabelText(/Total/), '10')
    expect(save).toBeEnabled()
    await user.type(screen.getByLabelText('Line 1 amount'), '10')
    expect(save).toBeDisabled()
    await user.type(screen.getByLabelText('Line 1 name'), 'Tape')
    expect(save).toBeEnabled()
  })

  it('edits a saved receipt: re-tag a line, save, or delete', async () => {
    const user = userEvent.setup()
    const receipt = makeReceipt({ id: 'r1', items: [{ name: 'Studs', amount: 60, jobId: null }], total: 60 })
    render(<ReceiptSheet receipt={receipt} onClose={() => {}} />)
    expect(screen.getByLabelText(/Store/)).toHaveValue('Hardware Co')
    await user.selectOptions(screen.getByLabelText('Line 1 job'), 'Alder St')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(service.updateReceipt).toHaveBeenCalledWith('r1', expect.objectContaining({ items: [{ name: 'Studs', amount: 60, jobId: 'alder' }] }))
  })

  it('a line tagged to an archived job keeps its tag', async () => {
    const receipt = makeReceipt({ items: [{ name: 'Studs', amount: 60, jobId: 'old-job' }] })
    render(<ReceiptSheet receipt={receipt} onClose={() => {}} />)
    const select = screen.getByLabelText('Line 1 job')
    expect(select).toHaveValue('old-job')
    expect(within(select).getByRole('option', { name: 'Archived job' })).toBeInTheDocument()
  })

  it('deletes after a second tap', async () => {
    const user = userEvent.setup()
    const receipt = makeReceipt({ id: 'r1' })
    render(<ReceiptSheet receipt={receipt} onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Tap again to delete' }))
    expect(service.deleteReceipt).toHaveBeenCalledWith(receipt)
  })
})

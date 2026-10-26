import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LedgerEntrySheet } from './LedgerEntrySheet'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 22, 12))
})
afterEach(() => vi.useRealTimers())

function setup(props: Partial<React.ComponentProps<typeof LedgerEntrySheet>> = {}) {
  const onSave = vi.fn()
  const onClose = vi.fn()
  render(<LedgerEntrySheet open onClose={onClose} kind="hours" onSave={onSave} {...props} />)
  return { onSave, onClose, user: userEvent.setup() }
}

describe('LedgerEntrySheet', () => {
  it('logs hours for today by default', async () => {
    const { onSave, onClose, user } = setup()
    expect(screen.getByRole('heading', { name: 'Log Hours' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Date/)).toHaveValue('2026-10-22')
    await user.type(screen.getByRole('textbox', { name: 'Hours' }), '7.5')
    await user.type(screen.getByRole('textbox', { name: 'Note' }), '  Prep  ')
    await user.click(screen.getByRole('button', { name: 'Log Hours' }))
    expect(onSave).toHaveBeenCalledWith('2026-10-22', 7.5, 'Prep')
    expect(onClose).toHaveBeenCalled()
  })

  it('strips anything but digits and dots while typing', async () => {
    const { user } = setup({ kind: 'payment' })
    const amount = screen.getByRole('textbox', { name: 'Amount ($)' })
    await user.type(amount, '$1,250.50')
    expect(amount).toHaveValue('1250.50')
  })

  it.each(['', '0', '.', '1.2.3'])('rejects %j as a value', async (value) => {
    const { onSave, user } = setup()
    if (value) await user.type(screen.getByRole('textbox', { name: 'Hours' }), value)
    const submit = screen.getByRole('button', { name: 'Log Hours' })
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('edits an existing entry and shows the rate it was logged at', async () => {
    const onDelete = vi.fn()
    const { onSave, user } = setup({ initial: { date: '2026-10-01', value: 8, note: 'Paint', rate: 30 }, onDelete })
    expect(screen.getByRole('heading', { name: 'Edit Hours' })).toBeInTheDocument()
    expect(screen.getByText('Logged at $30.00/hr')).toBeInTheDocument()
    const hours = screen.getByRole('textbox', { name: 'Hours' })
    await user.clear(hours)
    await user.type(hours, '6')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('2026-10-01', 6, 'Paint')
  })

  it('needs two taps to delete', async () => {
    const onDelete = vi.fn()
    const { user } = setup({ initial: { date: '2026-10-01', value: 8, note: '' }, onDelete })
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Tap again to delete' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('renders nothing when closed', () => {
    setup({ open: false })
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeJob, makeReceipt } from '../test/fixtures'
import type { Receipt } from '../types'
import { ExpensesScreen } from './ExpensesScreen'

const state = vi.hoisted(() => ({ receipts: [] as Receipt[], loading: false }))

vi.mock('../hooks/useReceipts', () => ({
  useReceipts: () => ({ receipts: state.receipts, loading: state.loading }),
  useReceiptPhoto: () => null,
}))
vi.mock('../hooks/useJobs', () => ({
  useJobs: () => ({ jobs: [makeJob({ id: 'alder', name: 'Alder St' })], loading: false }),
  useArchivedJobs: () => ({ jobs: [makeJob({ id: 'old', name: 'Old Job', isArchived: true })], loading: false }),
}))
vi.mock('../services/receiptService', () => ({ newReceiptId: () => 'new-id' }))

beforeEach(() => {
  state.receipts = []
  state.loading = false
})

describe('ExpensesScreen', () => {
  it('says when there are no receipts yet', () => {
    render(<ExpensesScreen />)
    expect(screen.getByText('No receipts yet. Tap + to add one.')).toBeInTheDocument()
  })

  it('groups receipts by month with month totals', () => {
    state.receipts = [
      makeReceipt({ id: 'a', store: 'Lumber Yard', date: '2026-10-29', total: 100 }),
      makeReceipt({ id: 'b', store: 'Paint Shop', date: '2026-10-02', total: 20.5 }),
      makeReceipt({ id: 'c', store: 'Hardware Co', date: '2026-09-30', total: 7 }),
    ]
    render(<ExpensesScreen />)
    expect(screen.getByText('October 2026')).toBeInTheDocument()
    expect(screen.getByText('$120.50')).toBeInTheDocument()
    expect(screen.getByText('September 2026')).toBeInTheDocument()
    expect(screen.getAllByText('$7.00')).toHaveLength(2) // the month and its one receipt
  })

  it('shows the jobs a receipt is split across, archived ones too, and flags unassigned lines', () => {
    state.receipts = [makeReceipt({
      items: [
        { name: 'Studs', amount: 60, jobId: 'alder' },
        { name: 'Caulk', amount: 5, jobId: 'old' },
        { name: 'Gloves', amount: 9, jobId: null },
        { name: 'Snacks', amount: 4, jobId: null },
      ],
    })]
    render(<ExpensesScreen />)
    expect(screen.getByText('Alder St')).toBeInTheDocument()
    expect(screen.getByText('Old Job')).toBeInTheDocument()
    expect(screen.getByText('2 unassigned')).toBeInTheDocument()
  })

  it('the + button opens a new receipt', () => {
    render(<ExpensesScreen />)
    screen.getByRole('button', { name: 'Add receipt' }).click()
    return screen.findByText('Take or choose a photo')
  })
})

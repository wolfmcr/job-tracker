import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeJob, makeShoppingItem, makeTask } from '../test/fixtures'
import type { Job } from '../types'
import { JobDetailScreen } from './JobDetailScreen'

const state = vi.hoisted(() => ({
  job: { job: null as Job | null, loading: true },
  items: [] as unknown[],
  tasks: [] as unknown[],
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ jobId: 'job-1' }),
  useNavigate: () => state.navigate,
}))
vi.mock('../hooks/useJob', () => ({ useJob: () => state.job }))
vi.mock('../hooks/useJobItems', () => ({
  useShoppingItems: () => ({ items: state.items, loading: false }),
  useTasks: () => ({ items: state.tasks, loading: false }),
}))
vi.mock('../services/jobService', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return Object.fromEntries(Object.keys(actual).map(name => [name, vi.fn()]))
})

beforeEach(() => {
  state.job = { job: null, loading: true }
  state.items = []
  state.tasks = []
})

describe('JobDetailScreen', () => {
  it('shows a spinner while the job loads', () => {
    render(<JobDetailScreen />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByText(/doesn’t exist/)).not.toBeInTheDocument()
  })

  it('says so when the job doesn’t exist, with a way back', () => {
    state.job = { job: null, loading: false }
    render(<JobDetailScreen />)
    expect(screen.getByText('This job doesn’t exist any more.')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Back to jobs' }).click()
    expect(state.navigate).toHaveBeenCalledWith({ to: '/jobs' })
  })

  it('lists tasks above the shopping list', () => {
    state.job = { job: makeJob(), loading: false }
    state.tasks = [makeTask({ text: 'Paint door' })]
    state.items = [makeShoppingItem({ name: 'Primer' })]
    render(<JobDetailScreen />)
    expect(screen.getByRole('heading', { name: 'Alder St' })).toBeInTheDocument()
    const headings = screen.getAllByText(/^(Tasks|Shopping)$/).map(h => h.textContent)
    expect(headings).toEqual(['Tasks', 'Shopping'])
    const taskPosition = screen.getByText('Paint door').compareDocumentPosition(screen.getByText('Primer'))
    expect(taskPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('archived jobs are view-only with a restore button', () => {
    state.job = { job: makeJob({ isArchived: true }), loading: false }
    render(<JobDetailScreen />)
    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restore job' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add/ })).not.toBeInTheDocument()
    expect(within(document.body).queryByRole('button', { name: 'Complete job' })).not.toBeInTheDocument()
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeJob } from '../../test/fixtures'
import { AddTaskSheet } from './AddTaskSheet'

describe('AddTaskSheet', () => {
  it('adds a trimmed task with cleaned bullets to the fixed job', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AddTaskSheet open onClose={onClose} onAdd={onAdd} defaultJobId="job-9" />)
    // Focuses the task text on open
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Task' })).toHaveFocus())
    expect(screen.queryByRole('group', { name: 'Job' })).not.toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Task' }), '  Paint door  ')
    await user.type(screen.getByRole('textbox', { name: 'Details bullet 1' }), ' two coats {Enter}{Enter}')
    await user.click(screen.getByRole('radio', { name: 'High' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledWith('job-9', { text: 'Paint door', bullets: ['two coats'], priority: 2, dueDate: '' })
    expect(onClose).toHaveBeenCalled()
  })

  it('picks the first job by default when choosing from a list', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    const jobs = [makeJob({ id: 'a', name: 'Alder St' }), makeJob({ id: 'b', name: 'Birch Ave' })]
    render(<AddTaskSheet open onClose={vi.fn()} onAdd={onAdd} jobs={jobs} />)
    await user.type(screen.getByRole('textbox', { name: 'Task' }), 'Caulk')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledWith('a', expect.objectContaining({ text: 'Caulk' }))
  })

  it('adds to the job picked from the list', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    const jobs = [makeJob({ id: 'a', name: 'Alder St' }), makeJob({ id: 'b', name: 'Birch Ave' })]
    render(<AddTaskSheet open onClose={vi.fn()} onAdd={onAdd} jobs={jobs} />)
    await user.click(screen.getByRole('button', { name: 'Birch Ave' }))
    await user.type(screen.getByRole('textbox', { name: 'Task' }), 'Caulk')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledWith('b', expect.objectContaining({ text: 'Caulk' }))
  })

  it('cannot add a blank task', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(<AddTaskSheet open onClose={vi.fn()} onAdd={onAdd} defaultJobId="job-1" />)
    await user.type(screen.getByRole('textbox', { name: 'Task' }), '   ')
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  })

  it('starts empty each time it opens', async () => {
    const user = userEvent.setup()
    const props = { onClose: vi.fn(), onAdd: vi.fn(), defaultJobId: 'job-1' }
    const { rerender } = render(<AddTaskSheet open {...props} />)
    await user.type(screen.getByRole('textbox', { name: 'Task' }), 'Half typed')
    rerender(<AddTaskSheet open={false} {...props} />)
    rerender(<AddTaskSheet open {...props} />)
    expect(screen.getByRole('textbox', { name: 'Task' })).toHaveValue('')
  })
})

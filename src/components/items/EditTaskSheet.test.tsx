import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeShoppingItem, makeTask } from '../../test/fixtures'
import { EditTaskSheet } from './EditTaskSheet'

vi.mock('../../services/jobService', () => ({
  addShoppingItem: vi.fn(),
  deleteShoppingItem: vi.fn(),
  toggleShoppingItem: vi.fn(),
}))

function setup(props: Partial<React.ComponentProps<typeof EditTaskSheet>> = {}) {
  const handlers = { onClose: vi.fn(), onUpdate: vi.fn(), onDelete: vi.fn() }
  render(<EditTaskSheet open task={makeTask({ bullets: ['Two coats'] })} shoppingItems={[]} {...handlers} {...props} />)
  return { ...handlers, user: userEvent.setup() }
}

describe('EditTaskSheet', () => {
  it('shows the task, then edits and saves it', async () => {
    const { onUpdate, onClose, user } = setup()
    expect(screen.getByText('Paint door')).toBeInTheDocument()
    expect(screen.getByText('Two coats')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const text = screen.getByRole('textbox', { name: 'Task' })
    await user.clear(text)
    await user.type(text, ' Paint front door ')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onUpdate).toHaveBeenCalledWith({ text: 'Paint front door', bullets: ['Two coats'], priority: 0, dueDate: '' })
    expect(onClose).toHaveBeenCalled()
  })

  it('deletes a task with no shopping after a second tap', async () => {
    const { onDelete, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Tap again to delete' }))
    expect(onDelete).toHaveBeenCalledWith(false)
  })

  it('asks whether to delete the task’s shopping too', async () => {
    const items = [makeShoppingItem({ id: 'a', taskId: 'task-1' }), makeShoppingItem({ id: 'b', name: 'Brush', taskId: 'task-1' })]
    const { onDelete, user } = setup({ shoppingItems: items })
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText('This task has 2 shopping items. Delete them too?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete task, keep shopping on job list' }))
    expect(onDelete).toHaveBeenCalledWith(false)
  })

  it('can delete the task and its shopping together', async () => {
    const { onDelete, user } = setup({ shoppingItems: [makeShoppingItem({ taskId: 'task-1' })] })
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete task and shopping' }))
    expect(onDelete).toHaveBeenCalledWith(true)
  })

  it('keeps what’s being typed when a live update hands it a fresh copy of the task', async () => {
    const handlers = { onClose: vi.fn(), onUpdate: vi.fn(), onDelete: vi.fn() }
    const user = userEvent.setup()
    const { rerender } = render(<EditTaskSheet open task={makeTask()} shoppingItems={[]} {...handlers} />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.type(screen.getByRole('textbox', { name: 'Task' }), ' twice')
    rerender(<EditTaskSheet open task={makeTask()} shoppingItems={[]} {...handlers} />)
    expect(screen.getByRole('textbox', { name: 'Task' })).toHaveValue('Paint door twice')
  })

  it('starts from the latest saved task each time it opens', async () => {
    const handlers = { onClose: vi.fn(), onUpdate: vi.fn(), onDelete: vi.fn() }
    const { rerender } = render(<EditTaskSheet open={false} task={makeTask()} shoppingItems={[]} {...handlers} />)
    rerender(<EditTaskSheet open={false} task={makeTask({ text: 'Paint back door' })} shoppingItems={[]} {...handlers} />)
    rerender(<EditTaskSheet open task={makeTask({ text: 'Paint back door' })} shoppingItems={[]} {...handlers} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('textbox', { name: 'Task' })).toHaveValue('Paint back door')
  })

  it('is view-only for archived jobs', () => {
    setup({ readOnly: true })
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})

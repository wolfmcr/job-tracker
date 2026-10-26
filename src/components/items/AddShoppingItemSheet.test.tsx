import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddShoppingItemSheet } from './AddShoppingItemSheet'

describe('AddShoppingItemSheet', () => {
  it('adds a trimmed item with qty and priority', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AddShoppingItemSheet open onClose={onClose} onAdd={onAdd} defaultJobId="job-1" />)
    // Focuses the item name on open
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Item' })).toHaveFocus())
    await user.type(screen.getByRole('textbox', { name: 'Qty' }), ' 2 gal ')
    await user.type(screen.getByRole('textbox', { name: 'Item' }), ' Primer ')
    await user.click(screen.getByRole('radio', { name: 'Medium' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledWith('job-1', { qty: '2 gal', name: 'Primer', priority: 1 })
    expect(onClose).toHaveBeenCalled()
  })

  it('needs an item name', async () => {
    const user = userEvent.setup()
    render(<AddShoppingItemSheet open onClose={vi.fn()} onAdd={vi.fn()} defaultJobId="job-1" />)
    await user.type(screen.getByRole('textbox', { name: 'Qty' }), '2')
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  })
})

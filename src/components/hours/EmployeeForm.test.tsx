import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmployeeForm } from './EmployeeForm'

describe('EmployeeForm', () => {
  it('saves a trimmed name and the parsed rate', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<EmployeeForm submitLabel="Save" onSave={onSave} />)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), '  Sam  ')
    await user.type(screen.getByRole('textbox', { name: 'Hourly rate ($)' }), '32.50')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('Sam', 32.5)
  })

  it('allows a $0 rate but not a blank name or rate', async () => {
    const user = userEvent.setup()
    render(<EmployeeForm submitLabel="Save" onSave={vi.fn()} />)
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Sam')
    expect(save).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Hourly rate ($)' }), '0')
    expect(save).toBeEnabled()
  })

  it('starts from the current values when editing', () => {
    render(<EmployeeForm submitLabel="Save" initialName="Sam" initialRate={30} onSave={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Sam')
    expect(screen.getByRole('textbox', { name: 'Hourly rate ($)' })).toHaveValue('30')
  })
})

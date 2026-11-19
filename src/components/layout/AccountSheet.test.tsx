import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { setBusiness } from '../../lib/business'
import { signOutAndReload } from '../../lib/session'
import { AccountSheet } from './AccountSheet'

vi.mock('../../lib/firebase', () => ({ db: {}, auth: { currentUser: { email: 'alice@example.test' } } }))
vi.mock('../../lib/session', () => ({ signOutAndReload: vi.fn() }))

describe('AccountSheet', () => {
  it('shows the business and account, and signs out', async () => {
    setBusiness({ id: 'a', name: 'Alder Builders' })
    render(<AccountSheet open onClose={vi.fn()} />)
    expect(screen.getByText('Alder Builders')).toBeInTheDocument()
    expect(screen.getByText('alice@example.test')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }))
    expect(signOutAndReload).toHaveBeenCalled()
  })
})

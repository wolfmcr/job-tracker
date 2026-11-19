import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginScreen } from './LoginScreen'

vi.mock('firebase/auth', () => ({ sendPasswordResetEmail: vi.fn(), signInWithEmailAndPassword: vi.fn() }))

const failure = (code: string) => Object.assign(new Error(code), { code })
const SENT = /If that email has an account, a link to set a new password is on its way/

beforeEach(() => {
  vi.mocked(sendPasswordResetEmail).mockReset()
  vi.mocked(signInWithEmailAndPassword).mockReset()
})

async function typeEmail(email: string) {
  const user = userEvent.setup()
  render(<LoginScreen />)
  if (email) await user.type(screen.getByLabelText(/Email/), email)
  return user
}

describe('LoginScreen', () => {
  it('says why signing in failed', async () => {
    vi.mocked(signInWithEmailAndPassword).mockImplementation(() => Promise.reject(failure('auth/too-many-requests')))
    const user = await typeEmail('alice@example.test')
    await user.type(screen.getByLabelText(/Password/), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Too many attempts/)
  })

  it('sends a reset link to the email typed in', async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValue()
    const user = await typeEmail(' alice@example.test ')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'alice@example.test')
    expect(await screen.findByRole('status')).toHaveTextContent(SENT)
  })

  it('says the same thing when the email has no account, so it can’t be used to find out who does', async () => {
    vi.mocked(sendPasswordResetEmail).mockImplementation(() => Promise.reject(failure('auth/user-not-found')))
    const user = await typeEmail('nobody@example.test')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(await screen.findByRole('status')).toHaveTextContent(SENT)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('asks for the email first, and explains real failures', async () => {
    const user = await typeEmail('')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Enter your email above/)
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()

    vi.mocked(sendPasswordResetEmail).mockImplementation(() => Promise.reject(failure('auth/network-request-failed')))
    await user.type(screen.getByLabelText(/Email/), 'alice@example.test')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Can’t reach the server/)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

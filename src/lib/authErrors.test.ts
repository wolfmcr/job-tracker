import { describe, expect, it } from 'vitest'
import { signInErrorMessage } from './authErrors'

const failure = (code: string) => Object.assign(new Error('Firebase: Error'), { code })

describe('signInErrorMessage', () => {
  it('says the email or password is wrong only when that’s the problem', () => {
    expect(signInErrorMessage(failure('auth/invalid-credential'))).toBe('Wrong email or password.')
    expect(signInErrorMessage(failure('auth/wrong-password'))).toBe('Wrong email or password.')
  })

  it('explains a lockout after too many attempts', () => {
    expect(signInErrorMessage(failure('auth/too-many-requests'))).toMatch(/Too many attempts/)
  })

  it('blames the connection when the server can’t be reached', () => {
    expect(signInErrorMessage(failure('auth/network-request-failed'))).toMatch(/Can’t reach the server/)
  })

  it('falls back to a general message for anything else', () => {
    expect(signInErrorMessage(failure('auth/internal-error'))).toBe('Couldn’t sign in. Please try again.')
    expect(signInErrorMessage('not an error')).toBe('Couldn’t sign in. Please try again.')
  })
})

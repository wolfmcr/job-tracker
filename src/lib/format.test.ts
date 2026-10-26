import { describe, expect, it } from 'vitest'
import { formatPhone } from './format'

describe('formatPhone', () => {
  it('formats a 10-digit number', () => {
    expect(formatPhone('5035551234')).toBe('(503) 555-1234')
  })
})

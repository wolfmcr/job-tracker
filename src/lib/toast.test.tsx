import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '../components/layout/Toaster'
import { showToast } from './toast'

beforeEach(() => {
  vi.useFakeTimers()
  render(<Toaster />)
})
afterEach(() => {
  act(() => { vi.runAllTimers() })
  vi.useRealTimers()
})

describe('toasts', () => {
  it('show a message that goes away after 5 seconds', () => {
    act(() => showToast('Saved badly'))
    expect(screen.getByText('Saved badly')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.queryByText('Saved badly')).not.toBeInTheDocument()
  })

  it('can be dismissed early', () => {
    act(() => showToast('Oops'))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Oops')).not.toBeInTheDocument()
  })

  it('stacks different messages', () => {
    act(() => {
      showToast('One')
      showToast('Two')
    })
    expect(screen.getByText('One')).toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
  })
})

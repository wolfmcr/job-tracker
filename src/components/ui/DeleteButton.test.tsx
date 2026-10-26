import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DeleteButton } from './DeleteButton'

afterEach(() => vi.useRealTimers())

describe('DeleteButton', () => {
  it('asks for a second tap, then deletes', () => {
    const onDelete = vi.fn()
    render(<DeleteButton onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to delete' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('backs out of confirming after 3 seconds', () => {
    vi.useFakeTimers()
    const onDelete = vi.fn()
    render(<DeleteButton onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    act(() => { vi.advanceTimersByTime(3000) })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).not.toHaveBeenCalled()
  })
})

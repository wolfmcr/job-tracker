import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ts } from '../../test/timestamp'
import type { Timer } from '../../types'
import { TimerCard } from './TimerCard'

const MIN = 60_000
const now = new Date(2026, 10, 16, 9, 0).getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(now)
})
afterEach(() => vi.useRealTimers())

function setup(timer: Partial<Timer> = {}) {
  const props = { onStart: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onStop: vi.fn(), onSetStart: vi.fn() }
  render(<TimerCard timer={{ startedAt: ts(now - 90 * MIN), pausedAt: null, pausedMs: 0, ...timer }} {...props} />)
  return props
}

describe('TimerCard', () => {
  it('stays the same card when idle, with a start button', () => {
    const onStart = vi.fn()
    render(<TimerCard onStart={onStart} onPause={vi.fn()} onResume={vi.fn()} onStop={vi.fn()} onSetStart={vi.fn()} />)
    expect(screen.getByText('Not running')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    expect(onStart).toHaveBeenCalled()
  })

  it('shows the time worked and ticks while running', () => {
    const { onPause, onStop } = setup()
    expect(screen.getByRole('timer')).toHaveTextContent('1:30:00')
    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.getByRole('timer')).toHaveTextContent('1:30:05')
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(onPause).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalled()
  })

  it('stands still while paused and offers resume', () => {
    const { onResume } = setup({ pausedAt: ts(now - 30 * MIN), pausedMs: 0 })
    expect(screen.getByText('Paused')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.getByRole('timer')).toHaveTextContent('1:00:00')
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(onResume).toHaveBeenCalled()
  })

  it('asks if it’s still running after 12 hours', () => {
    setup({ startedAt: ts(now - 13 * 60 * MIN) })
    expect(screen.getByRole('status')).toHaveTextContent('Still running?')
  })

  it('corrects the start time, but not to the future', () => {
    const { onSetStart } = setup()
    fireEvent.click(screen.getByRole('button', { name: /^Started/ }))
    const input = screen.getByLabelText(/Started at/)
    expect(input).toHaveValue('2026-11-16T07:30')

    fireEvent.change(input, { target: { value: '2026-11-16T09:30' } })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    fireEvent.change(input, { target: { value: '2026-11-16T07:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSetStart).toHaveBeenCalledWith(new Date(2026, 10, 16, 7, 0).getTime())
    expect(screen.queryByLabelText(/Started at/)).not.toBeInTheDocument()
  })
})

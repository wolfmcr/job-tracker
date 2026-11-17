import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as service from '../services/employeeService'
import { ts } from '../test/timestamp'
import type { Employee, Timer } from '../types'
import { HoursScreen } from './HoursScreen'

const MIN = 60_000
const now = new Date(2026, 10, 16, 15, 0).getTime()

const state = vi.hoisted(() => ({ employee: null as Employee | null }))

vi.mock('../hooks/useEmployee', () => ({
  useEmployee: () => ({ employee: state.employee, loading: false }),
  useEmployeeLedger: () => ({ timeEntries: [], payments: [] }),
}))
vi.mock('../services/employeeService', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return Object.fromEntries(Object.keys(actual).map(name => [name, vi.fn()]))
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
  vi.clearAllMocks()
})
afterEach(() => vi.useRealTimers())

function setup(timer?: Timer) {
  state.employee = { id: 'e', name: 'Sam', hourlyRate: 30, timer, createdAt: ts(0) }
  render(<HoursScreen />)
  return userEvent.setup()
}

const running: Timer = { startedAt: ts(now - (7 * 60 + 52) * MIN), pausedAt: null, pausedMs: 0 }

describe('HoursScreen timer', () => {
  it('starts the timer', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Start timer' }))
    expect(service.startTimer).toHaveBeenCalledWith('e')
    expect(screen.getByRole('button', { name: 'Log hours' })).toBeInTheDocument()
  })

  it('swaps Log hours for the timer while it runs', () => {
    setup(running)
    expect(screen.getByRole('timer')).toHaveTextContent('7:52:00')
    expect(screen.queryByRole('button', { name: 'Start timer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log hours' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add payment' })).toBeInTheDocument()
  })

  it('stop pauses it and fills in the hours to the nearest 15 minutes', async () => {
    const user = setup(running)
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(service.pauseTimer).toHaveBeenCalledWith('e', running)
    expect(screen.getByRole('textbox', { name: 'Hours' })).toHaveValue('7.75')
    expect(screen.getByText('Timed 7:52:00, rounded to 7.75 hrs')).toBeInTheDocument()
    expect(screen.getByLabelText(/Date/)).toHaveValue('2026-11-16')

    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'Framing')
    await user.click(screen.getByRole('button', { name: 'Log Hours' }))
    expect(service.logTimerSession).toHaveBeenCalledWith('e', '2026-11-16', 7.75, 30, 'Framing')
  })

  it('can discard the stopped session instead', async () => {
    const user = setup(running)
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    await user.click(screen.getByRole('button', { name: 'Discard session' }))
    await user.click(screen.getByRole('button', { name: 'Tap again to discard session' }))
    expect(service.discardTimer).toHaveBeenCalledWith('e')
    expect(service.logTimerSession).not.toHaveBeenCalled()
  })
})

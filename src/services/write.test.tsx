import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '../components/layout/Toaster'
import { SAVE_FAILED, SAVE_SLOW, SAVE_TIMEOUT_MS, write } from './write'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<Toaster />)
})
afterEach(() => {
  act(() => { vi.runAllTimers() }) // let any toasts expire so tests don't leak into each other
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('write', () => {
  it('resolves true once the server confirms, with no message', async () => {
    await expect(write(Promise.resolve())).resolves.toBe(true)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('resolves false and tells the user when the server rejects the write', async () => {
    let result: boolean | undefined
    await act(async () => { result = await write(Promise.reject(new Error('permission-denied'))) })
    expect(result).toBe(false)
    expect(screen.getByText(SAVE_FAILED)).toBeInTheDocument()
  })

  it('gives up waiting after the timeout and warns the change may not be saved', async () => {
    const pending = write(new Promise(() => {}))
    act(() => { vi.advanceTimersByTime(SAVE_TIMEOUT_MS - 1) })
    expect(screen.queryByText(SAVE_SLOW)).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1) })
    await expect(pending).resolves.toBe(false)
    expect(screen.getByText(SAVE_SLOW)).toBeInTheDocument()
  })

  it('doesn’t stack the same message when several writes fail together', async () => {
    await act(async () => {
      await Promise.all([write(Promise.reject(new Error('a'))), write(Promise.reject(new Error('b')))])
    })
    expect(screen.getAllByText(SAVE_FAILED)).toHaveLength(1)
  })
})

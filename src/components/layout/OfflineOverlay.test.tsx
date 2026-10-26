import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OfflineOverlay } from './OfflineOverlay'

function goOffline(offline: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(!offline)
  window.dispatchEvent(new Event(offline ? 'offline' : 'online'))
}

afterEach(() => vi.restoreAllMocks())

describe('OfflineOverlay', () => {
  it('stays out of the way while online', () => {
    render(<OfflineOverlay />)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('covers the app while offline and clears when the connection is back', () => {
    render(<OfflineOverlay />)
    act(() => goOffline(true))
    expect(screen.getByRole('alertdialog', { name: 'No connection' })).toBeInTheDocument()
    act(() => goOffline(false))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows straight away when the app opens offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    render(<OfflineOverlay />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})

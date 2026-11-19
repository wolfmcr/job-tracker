import { renderHook, waitFor } from '@testing-library/react'
import { getDocs } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'
import { useAccess } from './useAccess'

vi.mock('firebase/firestore', () => ({ collection: vi.fn(), query: vi.fn(), limit: vi.fn(), getDocs: vi.fn() }))

const failure = (code: string) => Object.assign(new Error(code), { code })

describe('useAccess', () => {
  it('counts as allowed while checking and once the read works', async () => {
    let resolve!: () => void
    vi.mocked(getDocs).mockReturnValue(new Promise(r => { resolve = () => r({} as never) }))
    const { result } = renderHook(() => useAccess('uid-1'))
    expect(result.current).toBe(true)
    resolve()
    await waitFor(() => expect(getDocs).toHaveBeenCalled())
    expect(result.current).toBe(true)
  })

  it('says no when the rules refuse the account', async () => {
    vi.mocked(getDocs).mockImplementation(() => Promise.reject(failure('permission-denied')))
    const { result } = renderHook(() => useAccess('uid-1'))
    await waitFor(() => expect(result.current).toBe(false))
  })

  it('stays allowed when the read fails for another reason', async () => {
    vi.mocked(getDocs).mockImplementation(() => Promise.reject(failure('unavailable')))
    const { result } = renderHook(() => useAccess('uid-1'))
    await new Promise(resolve => setTimeout(resolve, 20)) // long enough for a denial to have shown
    expect(result.current).toBe(true)
  })

  it('checks again for a different account', async () => {
    vi.mocked(getDocs).mockImplementationOnce(() => Promise.reject(failure('permission-denied'))).mockResolvedValue({} as never)
    const { result, rerender } = renderHook(({ uid }) => useAccess(uid), { initialProps: { uid: 'uid-1' } })
    await waitFor(() => expect(result.current).toBe(false))
    rerender({ uid: 'uid-2' })
    expect(result.current).toBe(true)
  })
})

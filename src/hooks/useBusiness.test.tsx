import { act, renderHook, waitFor } from '@testing-library/react'
import { getDoc } from 'firebase/firestore'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { currentBusiness } from '../lib/business'
import { RETRY_MS } from './useLive'
import { useBusiness } from './useBusiness'

// doc() returns its path, so getDoc can answer per document
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((_db: unknown, ...path: string[]) => path.join('/')),
  getDoc: vi.fn(),
}))

const snapshot = (data?: Record<string, unknown>) => ({ exists: () => data !== undefined, data: () => data })
const failure = (code: string) => Object.assign(new Error(code), { code })

// What each document holds; a function lets one fail
function database(docs: Record<string, Record<string, unknown> | (() => never) | undefined>) {
  vi.mocked(getDoc).mockImplementation(async path => {
    const value = docs[path as unknown as string]
    if (typeof value === 'function') value()
    return snapshot(value as Record<string, unknown> | undefined) as never
  })
}

afterEach(() => vi.useRealTimers())

describe('useBusiness', () => {
  it('is loading at first, then ready with the account’s business, which the app then uses', async () => {
    database({ 'users/alice': { businessId: 'a' }, 'businesses/a': { name: 'Alder Builders' } })
    const { result } = renderHook(() => useBusiness('alice'))
    expect(result.current).toEqual({ status: 'loading' })
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', business: { id: 'a', name: 'Alder Builders' } }))
    expect(currentBusiness()).toEqual({ id: 'a', name: 'Alder Builders' })
  })

  it('means no access for an account that isn’t in any business', async () => {
    database({})
    const { result } = renderHook(() => useBusiness('stranger'))
    await waitFor(() => expect(result.current).toEqual({ status: 'no-access' }))
  })

  it('means no access when the business no longer exists', async () => {
    database({ 'users/alice': { businessId: 'gone' } })
    const { result } = renderHook(() => useBusiness('alice'))
    await waitFor(() => expect(result.current).toEqual({ status: 'no-access' }))
  })

  it('means no access when the rules refuse (a removed member)', async () => {
    database({ 'users/alice': { businessId: 'a' }, 'businesses/a': () => { throw failure('permission-denied') } })
    const { result } = renderHook(() => useBusiness('alice'))
    await waitFor(() => expect(result.current).toEqual({ status: 'no-access' }))
  })

  it('keeps trying through a bad connection instead of locking the account out', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let down = true
    database({
      'users/alice': { businessId: 'a' },
      get 'businesses/a'() { return down ? () => { throw failure('unavailable') } : { name: 'Alder Builders' } },
    } as never)
    const { result } = renderHook(() => useBusiness('alice'))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(result.current).toEqual({ status: 'loading' })
    down = false
    await act(async () => { await vi.advanceTimersByTimeAsync(RETRY_MS[0]) })
    expect(result.current).toEqual({ status: 'ready', business: { id: 'a', name: 'Alder Builders' } })
  })
})

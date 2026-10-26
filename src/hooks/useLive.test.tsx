import { act, render, renderHook, screen } from '@testing-library/react'
import type { DocumentReference, DocumentSnapshot, Query, QueryDocumentSnapshot } from 'firebase/firestore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '../components/layout/Toaster'
import { LOAD_FAILED, RETRY_MS, useLiveDoc, useLiveQuery } from './useLive'

interface FakeListener {
  next: (snap: unknown) => void
  error: (error: Error) => void
  unsubscribe: ReturnType<typeof vi.fn>
}

const listeners: FakeListener[] = []
const latest = () => listeners.at(-1)!

vi.mock('firebase/firestore', () => ({
  onSnapshot: (_ref: unknown, _options: unknown, next: FakeListener['next'], error: FakeListener['error']) => {
    const listener = { next, error, unsubscribe: vi.fn() }
    listeners.push(listener)
    return listener.unsubscribe
  },
}))

const querySnap = (ids: string[], fromCache = false) => ({ docs: ids.map(id => ({ id })), metadata: { fromCache } })
const docSnap = (exists: boolean, fromCache = false) => ({ id: 'd', exists: () => exists, metadata: { fromCache } })

const makeQuery = () => ({}) as Query
const toId = (doc: QueryDocumentSnapshot) => doc.id
const useIds = (key: string | null) => useLiveQuery(key, makeQuery, toId)

beforeEach(() => {
  listeners.length = 0
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  act(() => { vi.runOnlyPendingTimers() })
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useLiveQuery', () => {
  it('stays loading until the server answers; an empty cache isn’t “no items”', () => {
    const { result } = renderHook(() => useIds('k'))
    expect(result.current).toEqual({ items: [], loading: true })
    act(() => latest().next(querySnap([], true)))
    expect(result.current.loading).toBe(true)
    act(() => latest().next(querySnap([])))
    expect(result.current).toEqual({ items: [], loading: false })
  })

  it('cached items are shown straight away', () => {
    const { result } = renderHook(() => useIds('k'))
    act(() => latest().next(querySnap(['a'], true)))
    expect(result.current).toEqual({ items: ['a'], loading: false })
  })

  it('doesn’t go back to loading on later cached snapshots', () => {
    const { result } = renderHook(() => useIds('k'))
    act(() => latest().next(querySnap(['a'])))
    act(() => latest().next(querySnap([], true)))
    expect(result.current).toEqual({ items: [], loading: false })
  })

  it('switching to a new key drops the old data and listener', () => {
    const { result, rerender } = renderHook(({ key }) => useIds(key), { initialProps: { key: 'job-1' } })
    act(() => latest().next(querySnap(['from-job-1'])))
    const first = latest()
    rerender({ key: 'job-2' })
    expect(result.current).toEqual({ items: [], loading: true })
    expect(first.unsubscribe).toHaveBeenCalled()
    expect(listeners).toHaveLength(2)
    act(() => latest().next(querySnap(['from-job-2'])))
    expect(result.current.items).toEqual(['from-job-2'])
  })

  it('a null key listens to nothing and isn’t loading', () => {
    const { result } = renderHook(() => useIds(null))
    expect(result.current).toEqual({ items: [], loading: false })
    expect(listeners).toHaveLength(0)
  })

  it('retries with backoff after an error and tells the user once', () => {
    render(<Toaster />)
    renderHook(() => useIds('k'))
    act(() => latest().error(new Error('unavailable')))
    expect(screen.getAllByText(LOAD_FAILED)).toHaveLength(1)

    act(() => { vi.advanceTimersByTime(RETRY_MS[0] - 1) })
    expect(listeners).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(1) })
    expect(listeners).toHaveLength(2)

    act(() => latest().error(new Error('unavailable')))
    expect(screen.getAllByText(LOAD_FAILED)).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(RETRY_MS[0]) })
    expect(listeners).toHaveLength(2) // second wait is longer
    act(() => { vi.advanceTimersByTime(RETRY_MS[1] - RETRY_MS[0]) })
    expect(listeners).toHaveLength(3)
  })

  it('recovers after a retry', () => {
    const { result } = renderHook(() => useIds('k'))
    act(() => latest().error(new Error('unavailable')))
    act(() => { vi.advanceTimersByTime(RETRY_MS[0]) })
    act(() => latest().next(querySnap(['a'])))
    expect(result.current).toEqual({ items: ['a'], loading: false })
  })

  it('cleans up the listener and any pending retry on unmount', () => {
    const { unmount } = renderHook(() => useIds('k'))
    act(() => latest().error(new Error('unavailable')))
    unmount()
    act(() => { vi.advanceTimersByTime(RETRY_MS.at(-1)!) })
    expect(listeners).toHaveLength(1)
  })
})

describe('useLiveDoc', () => {
  const makeRef = () => ({}) as DocumentReference
  const toValue = (doc: DocumentSnapshot) => doc.id

  it('is null and loading until the server says whether it exists', () => {
    const { result } = renderHook(() => useLiveDoc('k', makeRef, toValue))
    expect(result.current).toEqual({ value: null, loading: true })
    act(() => latest().next(docSnap(false, true)))
    expect(result.current.loading).toBe(true)
    act(() => latest().next(docSnap(false)))
    expect(result.current).toEqual({ value: null, loading: false })
  })

  it('gives the document once it exists', () => {
    const { result } = renderHook(() => useLiveDoc('k', makeRef, toValue))
    act(() => latest().next(docSnap(true, true)))
    expect(result.current).toEqual({ value: 'd', loading: false })
  })
})

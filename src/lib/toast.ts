import { useSyncExternalStore } from 'react'

export interface Toast {
  id: number
  message: string
}

const DURATION_MS = 5000

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function dismissToast(id: number) {
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

// Short message at the bottom of the screen. The same message isn't stacked twice.
export function showToast(message: string) {
  if (toasts.some(t => t.message === message)) return
  const id = nextId++
  toasts = [...toasts, { id, message }]
  emit()
  setTimeout(() => dismissToast(id), DURATION_MS)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts)
}

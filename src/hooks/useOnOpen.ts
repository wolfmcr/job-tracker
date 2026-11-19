import { useEffect, useRef } from 'react'

// Runs `onOpen` each time a sheet opens, and only then. Live listeners hand out fresh objects on
// every snapshot (including when a write is merely confirmed), so a form that reset whenever its
// task, item or job changed would wipe whatever was being typed.
export function useOnOpen(open: boolean, onOpen: () => void) {
  const latest = useRef(onOpen)
  useEffect(() => {
    latest.current = onOpen
  })
  useEffect(() => {
    if (open) latest.current()
  }, [open])
}

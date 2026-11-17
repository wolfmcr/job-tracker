import { useEffect, useState } from 'react'

// The current time, ticking every second while mounted (e.g. under a running timer)
export function useNow() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return now
}

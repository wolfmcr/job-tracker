import { useEffect, useState } from 'react'

// The current time, ticking while mounted. Several times a second, so a timer's seconds turn over
// on time instead of up to a second late (and don't stall right after starting or resuming).
export function useNow() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  return now
}

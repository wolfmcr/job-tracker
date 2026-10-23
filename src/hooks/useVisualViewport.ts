import { useEffect, useState } from 'react'

// The part of the screen not covered by the on-screen keyboard.
// keyboardInset is how much of the bottom the keyboard covers (0 when it's closed).
export function useVisualViewport() {
  const [state, setState] = useState({ keyboardInset: 0, height: window.innerHeight })

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setState({
      keyboardInset: Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop),
      height: viewport.height,
    })
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return state
}

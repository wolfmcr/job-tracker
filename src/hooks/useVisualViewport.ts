import { useEffect, useState } from 'react'

// Anything smaller is browser chrome or rounding, not a keyboard
const KEYBOARD_MIN_HEIGHT = 120

// The part of the screen not covered by the on-screen keyboard.
// keyboardInset is how far up the page the keyboard reaches. It stays 0 on Android, where the page
// itself shrinks above the keyboard (interactive-widget=resizes-content), so use keyboardOpen to tell.
export function useVisualViewport() {
  const [state, setState] = useState({ keyboardOpen: false, keyboardInset: 0, height: window.innerHeight })

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    // Tallest the visible area has been at this width, i.e. with the keyboard closed
    let width = viewport.width
    let fullHeight = viewport.height

    const update = () => {
      if (viewport.width !== width) {
        width = viewport.width
        fullHeight = viewport.height
      }
      fullHeight = Math.max(fullHeight, viewport.height)
      const keyboardOpen = fullHeight - viewport.height > KEYBOARD_MIN_HEIGHT
      const inset = window.innerHeight - viewport.height - viewport.offsetTop
      setState({
        keyboardOpen,
        keyboardInset: keyboardOpen && inset > KEYBOARD_MIN_HEIGHT ? inset : 0,
        height: viewport.height,
      })
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return state
}

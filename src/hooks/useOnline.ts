import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

// Whether the device has a network connection. "Online" can still mean no internet (e.g. captive
// wifi); writes that never get through are caught by the save timeout in services/write.ts.
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine)
}

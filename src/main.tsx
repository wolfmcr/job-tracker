import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './index.css'

// Reloads the page automatically once a new deploy's service worker takes over.
// Also re-checks for updates when the app returns to the foreground and hourly.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const checkForUpdate = () => {
      if (navigator.onLine) registration.update().catch(() => {})
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })
    setInterval(checkForUpdate, 60 * 60 * 1000)
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)

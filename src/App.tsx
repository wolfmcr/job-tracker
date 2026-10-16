import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { useAuth } from './hooks/useAuth'
import { LoginScreen } from './screens/LoginScreen'

function AppPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh text-gray-500 gap-2">
      <p className="font-medium text-gray-700">Signed in successfully.</p>
      <p className="text-sm">App screens coming soon…</p>
    </div>
  )
}

const rootRoute = createRootRoute({ component: () => <Outlet /> })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: AppPlaceholder })
const routeTree = rootRoute.addChildren([indexRoute])
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

export function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return <RouterProvider router={router} />
}

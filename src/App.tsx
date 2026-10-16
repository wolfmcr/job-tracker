import { createRootRoute, createRoute, createRouter, Outlet, redirect, RouterProvider } from '@tanstack/react-router'
import { AppShell } from './components/layout/AppShell'
import { useAuth } from './hooks/useAuth'
import { ArchiveScreen } from './screens/ArchiveScreen'
import { CombinedShoppingScreen } from './screens/CombinedShoppingScreen'
import { CombinedTodoScreen } from './screens/CombinedTodoScreen'
import { JobDetailScreen } from './screens/JobDetailScreen'
import { JobsScreen } from './screens/JobsScreen'
import { LoginScreen } from './screens/LoginScreen'


const rootRoute = createRootRoute({ component: () => <Outlet /> })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/jobs' }) },
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: AppShell,
})

const jobsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/jobs',
  component: JobsScreen,
})

const shoppingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/shopping',
  component: CombinedShoppingScreen,
})

const todoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/todo',
  component: CombinedTodoScreen,
})

const archiveRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/archive',
  component: ArchiveScreen,
})

const jobDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/jobs/$jobId',
  component: JobDetailScreen,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  layoutRoute.addChildren([jobsRoute, jobDetailRoute, shoppingRoute, todoRoute, archiveRoute]),
])

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

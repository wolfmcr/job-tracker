import { createRootRoute, createRoute, createRouter, Outlet, redirect, RouterProvider } from '@tanstack/react-router'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary, ErrorFallback } from './components/layout/ErrorBoundary'
import { OfflineOverlay } from './components/layout/OfflineOverlay'
import { Toaster } from './components/layout/Toaster'
import { useAuth } from './hooks/useAuth'
import { ArchiveScreen } from './screens/ArchiveScreen'
import { CombinedShoppingScreen } from './screens/CombinedShoppingScreen'
import { CombinedTasksScreen } from './screens/CombinedTasksScreen'
import { ExpensesScreen } from './screens/ExpensesScreen'
import { HoursScreen } from './screens/HoursScreen'
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

const tasksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/tasks',
  component: CombinedTasksScreen,
})

// Old path, kept so saved shortcuts still land on Tasks
const legacyTodoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/todo',
  beforeLoad: () => { throw redirect({ to: '/tasks' }) },
})

const hoursRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/hours',
  component: HoursScreen,
})

const expensesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/expenses',
  component: ExpensesScreen,
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
  layoutRoute.addChildren([jobsRoute, jobDetailRoute, shoppingRoute, tasksRoute, legacyTodoRoute, hoursRoute, expensesRoute, archiveRoute]),
])

// Route errors get the same fallback as the rest of the app instead of the router's default
const router = createRouter({ routeTree, defaultErrorComponent: ErrorFallback })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthGate />
      <Toaster />
      <OfflineOverlay />
    </ErrorBoundary>
  )
}

function AuthGate() {
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

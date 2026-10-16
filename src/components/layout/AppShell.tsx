import { Outlet } from '@tanstack/react-router'
import { BottomTabBar } from './BottomTabBar'

export function AppShell() {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}

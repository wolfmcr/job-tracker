import { Outlet } from '@tanstack/react-router'
import { BottomTabBar } from './BottomTabBar'

export function AppShell() {
  return (
    <div className="flex flex-col min-h-dvh pt-[env(safe-area-inset-top)]">
      {/* Dark backing for the iOS status bar (black-translucent) */}
      <div className="fixed top-0 inset-x-0 h-[env(safe-area-inset-top)] bg-[#111827] z-30" />
      <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}

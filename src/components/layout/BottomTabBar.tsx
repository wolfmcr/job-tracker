import { Link, useRouterState } from '@tanstack/react-router'
import { ArchiveIcon, BriefcaseIcon, CheckSquareIcon, ShoppingCartIcon } from 'lucide-react'

const tabs = [
  { to: '/jobs', icon: BriefcaseIcon, label: 'Jobs' },
  { to: '/shopping', icon: ShoppingCartIcon, label: 'Shopping' },
  { to: '/todo', icon: CheckSquareIcon, label: 'To-Do' },
  { to: '/archive', icon: ArchiveIcon, label: 'Archive' },
] as const

export function BottomTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ to, icon: Icon, label }) => {
        const active = pathname.startsWith(to)
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs ${active ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

import { Link, useRouterState } from '@tanstack/react-router'
import { BriefcaseIcon, CheckSquareIcon, ClockIcon, ShoppingCartIcon } from 'lucide-react'

const tabs = [
  { to: '/jobs', icon: BriefcaseIcon, label: 'Jobs', alsoActiveOn: ['/archive'] },
  { to: '/shopping', icon: ShoppingCartIcon, label: 'Shopping', alsoActiveOn: [] },
  { to: '/todo', icon: CheckSquareIcon, label: 'To-Do', alsoActiveOn: [] },
  { to: '/hours', icon: ClockIcon, label: 'Hours', alsoActiveOn: [] },
] as const

export function BottomTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ to, icon: Icon, label, alsoActiveOn }) => {
        const active = [to, ...alsoActiveOn].some(path => pathname.startsWith(path))
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center pt-1 pb-2 gap-0.5 text-xs relative ${active ? 'text-blue-600' : 'text-gray-400'}`}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
            )}
            <Icon size={22} />
            <span className="font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UserCircle, History, MapPinned } from 'lucide-react'

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/profile', label: '프로필', icon: UserCircle },
  { href: '/history', label: '기록', icon: History },
  { href: '/map', label: '지도', icon: MapPinned },
]

export function BottomNav(): JSX.Element {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                active ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.6 : 2} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

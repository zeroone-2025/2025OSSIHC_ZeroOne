'use client'

import React from "react";
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UserCircle } from 'lucide-react'

export function BottomNav(): React.ReactElement {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-bg bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-2">
        <span className="flex h-[72px] flex-1 items-center justify-center" aria-hidden="true" />
        <Link
          href="/"
          className={`flex h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
            pathname === '/' ? 'text-brand' : 'text-brand/70 hover:text-brand'
          }`}
        >
          <Home size={24} strokeWidth={pathname === '/' ? 2.6 : 2} />
          <span className="text-xs font-semibold">홈</span>
        </Link>
        <Link
          href="/profile"
          className={`flex h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
            pathname.startsWith('/profile') ? 'text-brand' : 'text-brand/70 hover:text-brand'
          }`}
        >
          <UserCircle size={24} strokeWidth={pathname.startsWith('/profile') ? 2.6 : 2} />
          <span className="text-xs font-semibold">프로필</span>
        </Link>
      </div>
    </nav>
  )
}

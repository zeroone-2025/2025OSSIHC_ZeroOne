'use client'

import React, { useCallback } from "react";
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, UserCircle, Utensils } from 'lucide-react'

export function BottomNav(): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()

  const handleLunchRecommendation = useCallback(() => {
    // Trigger recommendation flow by navigating to home and starting Q&A
    if (pathname !== '/') {
      router.push('/')
    }

    // Dispatch a custom event to start the recommendation flow
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('startRecommendation'))
    }, 100)
  }, [pathname, router])

  return (
    <>
      {/* Floating CTA Button */}
      <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2">
        <button
          type="button"
          onClick={handleLunchRecommendation}
          className="group relative flex h-14 w-auto items-center gap-2 rounded-full bg-brand px-6 py-3 shadow-lg transition-all hover:bg-brand/90 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
          aria-label="점심 메뉴 추천하기"
        >
          <Utensils className="h-5 w-5 text-white" strokeWidth={2.5} />
          <span className="text-sm font-bold text-white whitespace-nowrap">점심 메뉴 추천하기</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-bg bg-white/95 backdrop-blur-md safe-area-inset-bottom">
        <div className="mx-auto flex max-w-md items-center justify-between px-2">
          <Link
            href="/"
            className={`flex h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors min-h-[44px] ${
              pathname === '/' ? 'text-brand' : 'text-brand/70 hover:text-brand'
            }`}
          >
            <Home size={24} strokeWidth={pathname === '/' ? 2.6 : 2} />
            <span className="text-xs font-semibold">홈</span>
          </Link>

          {/* Empty space for floating button */}
          <div className="flex-1" aria-hidden="true" />

          <Link
            href="/profile"
            className={`flex h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors min-h-[44px] ${
              pathname.startsWith('/profile') ? 'text-brand' : 'text-brand/70 hover:text-brand'
            }`}
          >
            <UserCircle size={24} strokeWidth={pathname.startsWith('/profile') ? 2.6 : 2} />
            <span className="text-xs font-semibold">프로필</span>
          </Link>
        </div>
      </nav>
    </>
  )
}

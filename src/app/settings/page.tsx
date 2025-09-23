'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage(): JSX.Element {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/profile'), 1200)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-sm rounded-3xl bg-white p-6 text-center shadow">
        <h1 className="text-lg font-semibold text-gray-900">프로필 페이지로 이동합니다</h1>
        <p className="mt-2 text-sm text-gray-500">설정 항목이 개인 프로필로 통합됐어요. 잠시만 기다려 주세요.</p>
      </div>
    </div>
  )
}

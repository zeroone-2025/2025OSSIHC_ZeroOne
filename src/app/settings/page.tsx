'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '../_components/Card'

export default function SettingsPage(): React.ReactElement {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/profile'), 1200)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="section">
      <Card tone="soft" className="space-y-2 p-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">프로필 페이지로 이동합니다</h1>
        <p className="text-sm text-brand/80">설정 항목이 개인 프로필로 통합됐어요. 잠시만 기다려 주세요.</p>
      </Card>
    </div>
  )
}

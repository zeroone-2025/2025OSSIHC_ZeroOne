"use client"

import { X } from 'lucide-react'
import type { RecommendationResult } from '../../../lib/types'
import { Button } from './Button'
import { Card } from './Card'

interface MapSheetProps {
  open: boolean
  onClose: () => void
  target: RecommendationResult | null
}

export function MapSheet({ open, onClose, target }: MapSheetProps): JSX.Element | null {
  if (!open || !target) return null

  const { restaurant } = target
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.lat},${restaurant.lng}`

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
      <div className="w-full max-w-screen-sm rounded-t-3xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
            <p className="text-sm text-brand-sub1/80">지도를 확인하고 길찾기를 이어가세요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-sub1/60 text-brand hover:bg-brand-bg"
            aria-label="지도 닫기"
          >
            <X size={18} />
          </button>
        </div>
        <Card tone="soft" className="overflow-hidden p-0">
          <iframe
            title={`${restaurant.name} 위치 지도`}
            src={`https://map.kakao.com/?urlX=${restaurant.lng}&urlY=${restaurant.lat}&urlLevel=3&itemId=${restaurant.id}`}
            className="h-64 w-full"
            loading="lazy"
          />
        </Card>
        <div className="mt-4 flex gap-3">
          <Button fullWidth variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button
            fullWidth
            onClick={() => {
              window.open(kakaoUrl, '_blank', 'noopener,noreferrer')
            }}
          >
            카카오맵 길찾기
          </Button>
        </div>
      </div>
    </div>
  )
}

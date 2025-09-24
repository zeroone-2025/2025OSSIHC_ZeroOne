"use client"

import React, { type ReactElement } from 'react';
import { MapPin, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { RecommendationResult } from '../../../../lib/types'
import { Card } from '../../_components/Card'
import { Button } from '../../_components/Button'

interface ReasonCard {
  badge: string
  detail?: string
  source?: string
}

interface RecommendationCardProps {
  recommendation: RecommendationResult
  reasons: ReasonCard[]
  onDislike: () => void
  onLike: () => void
  onNavigate: () => void
  onOpenMap: () => void
  footer?: React.ReactNode
}

export function RecommendationCard({
  recommendation,
  reasons,
  onDislike,
  onLike,
  onNavigate,
  onOpenMap,
  footer,
}: RecommendationCardProps): ReactElement {
  const { restaurant, etaMins } = recommendation

  return (
    <Card tone="lifted" className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
          {restaurant.category_name && (
            <p className="mt-1 text-sm text-gray-500">{restaurant.category_name}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-brand-sub1/60 bg-brand-sub1/20 px-3 py-1 text-xs font-semibold text-brand-sub1">
            ETA {etaMins ?? restaurant.etaMins ?? 0}분
          </span>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="space-y-3">
          {reasons.slice(0, 3).map((reason) => (
            <div
              key={`${reason.badge}-${reason.source ?? 'local'}`}
              className="rounded-xl border border-brand-sub1/60 bg-white p-4 shadow-sm"
            >
              <div className="text-xs font-semibold text-brand-sub1">{reason.badge}</div>
              {reason.detail && <p className="mt-1 text-xs text-brand-sub1">{reason.detail}</p>}
              {reason.source && reason.source !== 'local' && (
                <div className="mt-2 text-[10px] uppercase tracking-wide text-brand-sub1/80">{reason.source}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
        <div className="rounded-xl border border-brand-sub1/60 bg-white p-3 shadow-sm">
          <span className="text-xs text-brand-sub1/70">분류</span>
          <div className="text-sm font-medium text-gray-900">{restaurant.category}</div>
        </div>
        <div className="rounded-xl border border-brand-sub1/60 bg-white p-3 shadow-sm">
          <span className="text-xs text-brand-sub1/70">거리</span>
          <div className="text-sm font-medium text-gray-900">
            {restaurant.etaMins ? `${restaurant.etaMins * 80}m ±` : '예상 거리 미정'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button variant="danger" fullWidth className="gap-2" onClick={onDislike}>
            <ThumbsDown size={18} />
            패스
          </Button>
          <Button variant="secondary" fullWidth className="gap-2" onClick={onLike}>
            <ThumbsUp size={18} />
            좋아요
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="gap-2" onClick={onNavigate}>
            <MapPin size={18} /> 길찾기
          </Button>
          <Button variant="tertiary" onClick={onOpenMap}>
            지도 보기
          </Button>
        </div>
      </div>

      {footer && <div className="text-center text-xs text-brand-sub1/80">{footer}</div>}
    </Card>
  )
}

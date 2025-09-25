'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Clock, Heart, X, ArrowRight, Utensils } from 'lucide-react'
import Link from 'next/link'
import { Card } from './Card'
import { getVisits } from '../../../lib/store'
import type { Visit } from '../../../lib/types'

interface RecentMeal extends Visit {
  timeAgo: string
}

export function RecentMealsCard(): React.ReactElement {
  const [visits, setVisits] = useState<Visit[]>([])

  useEffect(() => {
    const storedVisits = getVisits()
    setVisits(storedVisits)
  }, [])

  const recentMeals: RecentMeal[] = useMemo(() => {
    return visits
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((visit) => ({
        ...visit,
        timeAgo: formatTimeAgo(visit.timestamp),
      }))
  }, [visits])

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days > 0) {
      return `${days}일 전`
    }
    if (hours > 0) {
      return `${hours}시간 전`
    }
    if (minutes > 0) {
      return `${minutes}분 전`
    }
    return '방금 전'
  }

  const getReactionIcon = (liked?: boolean) => {
    if (liked === true) {
      return <Heart className="h-3 w-3 fill-red-500 text-red-500" />
    }
    if (liked === false) {
      return <X className="h-3 w-3 text-gray-400" />
    }
    return null
  }

  const getReactionColor = (liked?: boolean) => {
    if (liked === true) return 'bg-red-50 border-red-200'
    if (liked === false) return 'bg-gray-50 border-gray-200'
    return 'bg-gray-50 border-gray-200'
  }

  return (
    <Card tone="soft" className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-gray-900">최근에 먹은 음식</h2>
        </div>
        <Link
          href="/history"
          className="text-xs font-medium text-brand-sub1 hover:text-brand-sub1/80 min-h-[44px] flex items-center gap-1"
        >
          전체 보기
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {recentMeals.length === 0 ? (
        <div className="text-center py-8">
          <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">아직 기록이 없어요</p>
          <p className="text-xs text-gray-500">
            점심 메뉴를 추천받고 평가하면 여기에 표시돼요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentMeals.map((meal, index) => (
            <div
              key={`${meal.restaurantId}-${meal.timestamp}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-brand-sub2/40 transition-colors min-h-[44px]"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${getReactionColor(meal.liked)} flex-shrink-0`}
              >
                {getReactionIcon(meal.liked)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    식당 #{meal.restaurantId.slice(-4)}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {meal.timeAgo}
                  </span>
                </div>

                {meal.reason && (
                  <p className="text-xs text-gray-600 truncate">
                    {typeof meal.reason === 'string' ? meal.reason : '맞춤 추천'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {recentMeals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              총 {visits.length}회 기록
            </span>
            <span className="text-brand-sub1">
              {visits.filter(v => v.liked === true).length}회 좋아요
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
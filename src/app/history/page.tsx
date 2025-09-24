'use client'

import { useEffect, useMemo, useState } from 'react'
import { ThumbsUp, ThumbsDown, Star, CheckCircle2 } from 'lucide-react'
import { Card } from '../_components/Card'
import { Button } from '../_components/Button'
import { getVisits, getPendingReview, clearPendingReview, addVisit } from '../../../lib/store'
import type { Visit, Restaurant } from '../../../lib/types'

export default function HistoryPage(): React.ReactElement {
  const [visits, setVisits] = useState<Visit[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [pending, setPending] = useState<{ placeId: string; decidedAt: number } | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/data/restaurants.json')
        const data: Restaurant[] = await response.json()
        setRestaurants(data)
      } catch (error) {
        console.error('Failed to load restaurants', error)
      }
      const history = getVisits().sort((a, b) => b.timestamp - a.timestamp).slice(0, 30)
      setVisits(history)
      setPending(getPendingReview())
    }
    load()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(timer)
  }, [toast])

  const visitCards = useMemo(() => visits.map((visit) => ({
    visit,
    restaurant: restaurants.find((item) => item.id === visit.restaurantId) ?? null,
  })), [visits, restaurants])

  const pendingRestaurant = useMemo(
    () => restaurants.find((item) => item.id === pending?.placeId) ?? null,
    [pending, restaurants]
  )

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]))
  }

  const submitPending = () => {
    if (!pending) return
    addVisit({
      restaurantId: pending.placeId,
      timestamp: Date.now(),
      liked: rating >= 4 || Boolean(wouldReturn),
      reason: tags.join(','),
    })
    clearPendingReview()
    setPending(null)
    setRating(0)
    setWouldReturn(null)
    setTags([])
    setToast('평가를 저장했어요.')
  }

  const cancelPending = () => {
    clearPendingReview()
    setPending(null)
    setRating(0)
    setWouldReturn(null)
    setTags([])
  }

  return (
    <div className="section space-y-4">
      <Card tone="soft" className="space-y-2 p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">방문 기록</h1>
          {pending && <span className="rounded-full border border-brand-sub1/60 bg-brand-sub2/20 px-3 py-1 text-xs font-semibold text-brand-sub1">평가 작성</span>}
        </div>
        <p className="text-sm text-gray-500">좋아요·패스 기록과 평가 요청을 확인하세요.</p>
      </Card>

      {pending && pendingRestaurant && (
        <Card tone="lifted" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">평가 대기 중</h2>
              <p className="text-sm text-gray-500">{pendingRestaurant.name}</p>
            </div>
            <span className="text-xs text-gray-400">{formatRelative(pending.decidedAt)}</span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-brand-sub1/80">만족도</span>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  rating >= value ? 'border-brand bg-brand text-white' : 'border-brand-sub1/60 bg-white text-brand-sub1/60'
                }`}
              >
                <Star size={16} />
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-brand-sub1/80">재방문</span>
            <button
              onClick={() => setWouldReturn(true)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                wouldReturn === true ? 'border-brand bg-brand text-white' : 'border-brand-sub1/60 bg-white text-brand-sub1 hover:bg-brand-bg'
              }`}
            >
              있다
            </button>
            <button
              onClick={() => setWouldReturn(false)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                wouldReturn === false ? 'border-brand bg-brand text-white' : 'border-brand-sub1/60 bg-white text-brand-sub1 hover:bg-brand-bg'
              }`}
            >
              없다
            </button>
          </div>

          <div className="mt-4">
            <span className="text-sm text-gray-600">이유 태그</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {['가성비', '가까움', '따뜻함', '건강함', '빠른 제공', '조용함', '단체 적합', '친절함'].map((tag) => {
                const active = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                      active ? 'border-brand bg-brand text-white' : 'border-brand-sub1/60 bg-white text-brand-sub1 hover:bg-brand-bg'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={submitPending} className="flex-1 gap-2">
              평가 제출
            </Button>
            <Button variant="tertiary" onClick={cancelPending} className="px-6">
              나중에
            </Button>
          </div>
        </Card>
      )}

      <section className="space-y-3">
        {visitCards.length === 0 ? (
          <Card tone="soft" className="p-6 text-center text-sm text-gray-500">
            아직 기록이 없습니다. 추천에서 좋아요 또는 패스를 눌러 주세요.
          </Card>
        ) : (
          visitCards.map(({ visit, restaurant }) => {
            if (!restaurant) return null
            return (
              <Card key={`${visit.restaurantId}-${visit.timestamp}`} tone="soft" className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                    <p className="text-sm text-gray-500">{restaurant.category}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatRelative(visit.timestamp)}</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  {visit.liked ? (
                    <span className="flex items-center gap-1 rounded-full border border-brand-sub1/60 bg-brand-sub1/20 px-3 py-1 text-brand-sub1">
                      <ThumbsUp size={16} /> 좋아요
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full border border-critical/30 bg-critical/10 px-3 py-1 text-critical">
                      <ThumbsDown size={16} /> 패스
                    </span>
                  )}
                  {visit.reason && (
                    <span className="rounded-full border border-brand-sub1/60 bg-white px-3 py-1 text-xs text-brand-sub1 shadow-sm">{visit.reason}</span>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </section>

      {toast && (
        <div className="fixed bottom-24 left-0 right-0 mx-auto flex max-w-[320px] items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm text-white shadow-lg">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

function formatRelative(timestamp: number): string {
  const delta = Date.now() - timestamp
  const minutes = Math.floor(delta / (1000 * 60))
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  const date = new Date(timestamp)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ThumbsUp, ThumbsDown, MapPin, Cloud, Thermometer, Wind, RotateCcw } from 'lucide-react'
import { Card } from './_components/Card'
import { Button } from './_components/Button'
import type { RecommendationResult, WeatherSnapshot } from '../../lib/types'
import { addVisit } from '../../lib/store'
import { boot, askNext, applyAnswer, finalize, scheduleReview } from '../../lib/flow'
import { createInitialState, reducer, restoreSession, persistSession, resetSession } from '../../lib/state'
import type { NextQuestion } from '../../lib/llm'
import { MissingOperatorKeyError } from '../../lib/llm'
import { MissingWeatherKeyError } from '../../lib/weather'

interface ToastState {
  message: string
  tone: 'info' | 'warning' | 'error'
}

interface LLMReason {
  badge: string
  detail: string
  source: string
}

export default function HomePage(): JSX.Element {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => (typeof window === 'undefined' ? createInitialState() : restoreSession() ?? createInitialState())
  )
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [question, setQuestion] = useState<NextQuestion | null>(null)
  const [asking, setAsking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  const [llmUnavailable, setLlmUnavailable] = useState(false)
  const [reasonsByRestaurant, setReasonsByRestaurant] = useState<Record<string, LLMReason[]>>({})

  const bootedRef = useRef(false)
  const reasonsInFlight = useRef<Set<string>>(new Set())

  useEffect(() => {
    persistSession(state)
  }, [state])

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (bootedRef.current) return
      bootedRef.current = true
      setLoading(true)
      setBootError(null)

      try {
        await boot(dispatch)
      } catch (error) {
        if (cancelled) return
        if (error instanceof MissingWeatherKeyError) {
          setBootError('운영자 WEATHER_AUTH_KEY 설정이 필요합니다.')
          setToast({ message: '날씨 정보를 불러올 수 없어요. 운영자 키를 확인해 주세요.', tone: 'error' })
        } else {
          const message = error instanceof Error ? error.message : '초기화에 실패했습니다.'
          setBootError(message)
          setToast({ message, tone: 'error' })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (state.step === 'boot') {
      start()
    } else {
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [state.step])

  useEffect(() => {
    setRecommendations(finalize(state))
  }, [state])

  useEffect(() => {
    let active = true
    if (state.step !== 'qa') return
    if (asking || question) return

    setAsking(true)
    askNext(state)
      .then((next) => {
        if (!active) return
        setQuestion(next)
        setLlmUnavailable(false)
      })
      .catch((error) => {
        if (!active) return
        if (error instanceof MissingOperatorKeyError) {
          setToast({ message: '질문 생성을 위한 OPENAI_API_KEY가 필요합니다.', tone: 'error' })
          setBootError('OPENAI 키가 설정되지 않았습니다.')
          setLlmUnavailable(true)
        } else if (error instanceof Error && error.message.includes('질문할 인텐트')) {
          dispatch({ type: 'QNA_DONE' })
          setQuestion(null)
        } else {
          const message = error instanceof Error ? error.message : '질문을 불러오지 못했습니다.'
          setToast({ message, tone: 'error' })
        }
      })
      .finally(() => {
        if (active) setAsking(false)
      })

    return () => {
      active = false
    }
  }, [state, asking, question])

  const currentRecommendation = recommendations[0] ?? null

  const toastToneClass = toast
    ? toast.tone === 'error'
      ? 'border-critical/40 text-critical'
      : toast.tone === 'warning'
      ? 'border-brand/60 text-brand'
      : 'border-brand-light/60 text-brand'
    : ''

  const fetchReasons = useCallback(
    async (target: RecommendationResult) => {
      try {
        if (reasonsInFlight.current.has(target.restaurant.id)) {
          return
        }
        reasonsInFlight.current.add(target.restaurant.id)

        const activeWeatherFlags = Object.entries(state.weather?.flags ?? {})
          .filter(([, active]) => Boolean(active))
          .map(([flag]) => flag)

        const response = await fetch('/api/llm/reasons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant: {
              id: target.restaurant.id,
              name: target.restaurant.name,
              category: target.restaurant.category,
              tags: target.restaurant.tags,
              menuTags: target.restaurant.menuTags ?? [],
              categoryName: target.restaurant.category_name ?? null,
              categoryStrength: target.restaurant.categoryStrength ?? null,
              price_tier: target.restaurant.price_tier,
              macros: target.restaurant.macros,
            },
            highlights: target.reason.split(' · ').filter(Boolean),
            context: {
              weatherFlags: activeWeatherFlags,
              answers: state.answers.map(({ intent, option }) => ({ intent, option })),
              etaMins: target.etaMins,
              freeTimeMins: state.freeTimeMins ?? null,
              menuTags: target.restaurant.menuTags ?? [],
            },
          }),
        })

        if (response.status === 503) {
          setLlmUnavailable(true)
          throw new Error('NO_OPENAI_KEY')
        }

        if (!response.ok) {
          throw new Error(`reasons request failed: ${response.status}`)
        }

        const data = await response.json()
        if (!Array.isArray(data.reasons)) {
          throw new Error('invalid reasons payload')
        }

        setReasonsByRestaurant((prev) => ({
          ...prev,
          [target.restaurant.id]: data.reasons as LLMReason[],
        }))
        setLlmUnavailable(false)
      } catch (error) {
        setReasonsByRestaurant((prev) => ({
          ...prev,
          [target.restaurant.id]: [
            {
              badge: '근거 생성 실패',
              detail: 'LLM 근거를 불러오지 못했습니다.',
              source: 'system',
            },
          ],
        }))

        if (error instanceof Error && error.message !== 'NO_OPENAI_KEY') {
          console.warn('Failed to load reasons:', error)
        }
      } finally {
        reasonsInFlight.current.delete(target.restaurant.id)
      }
    },
    [state.answers, state.freeTimeMins, state.weather]
  )

  useEffect(() => {
    if (!currentRecommendation) return
    if (reasonsByRestaurant[currentRecommendation.restaurant.id]) return
    fetchReasons(currentRecommendation)
  }, [currentRecommendation, fetchReasons, reasonsByRestaurant])

  const displayReasons: LLMReason[] = useMemo(() => {
    if (!currentRecommendation) return []
    return (
      reasonsByRestaurant[currentRecommendation.restaurant.id] ||
      currentRecommendation.reason
        .split(' · ')
        .filter(Boolean)
        .map((token) => ({ badge: token, detail: '', source: 'local' }))
    )
  }, [currentRecommendation, reasonsByRestaurant])

  const weatherBadges = useMemo(() => {
    const target = state.weather
    if (!target) return []
    const badges: Array<{ icon: JSX.Element; text: string }> = []
    const temperature = Math.round(target.T1H ?? target.TMP ?? 15)
    badges.push({ icon: <Thermometer size={14} />, text: `${temperature}°C` })
    if (target.RN1 || target.PCP || target.flags.wet) {
      badges.push({ icon: <Cloud size={14} />, text: target.RN1 ? `${target.RN1}mm` : '강수' })
    }
    badges.push({ icon: <Wind size={14} />, text: `${Math.round(target.WSD ?? 1.5)}m/s` })
    return badges
  }, [state.weather])

  const handleReset = useCallback(() => {
    resetSession()
    dispatch({ type: 'RESET' })
    setRecommendations([])
    setQuestion(null)
    setToast({ message: '세션을 초기화했어요.', tone: 'info' })
    bootedRef.current = false
    setReasonsByRestaurant({})
    setLlmUnavailable(false)
    reasonsInFlight.current.clear()
  }, [])

  const handleAnswer = useCallback(async (answer: string) => {
    if (!question) return

    const collectedAt = Date.now()
    const intent = question.intent
    dispatch({ type: 'ANSWER_COMMIT', answer: { qId: question.qId, intent, option: answer } })

    const parsedMinutes = intent === 'time_pressure' ? interpretTimePressure(answer) : undefined
    if (typeof parsedMinutes === 'number') {
      dispatch({ type: 'SET_FREE_TIME', minutes: parsedMinutes })
    }

    const simulatedState = {
      ...state,
      answers: [
        ...state.answers,
        { qId: question.qId, intent, option: answer, collectedAt },
      ],
      freeTimeMins: typeof parsedMinutes === 'number' ? parsedMinutes : state.freeTimeMins,
    }

    const updatedResults = applyAnswer({ ...simulatedState, pool: state.pool })
    const updatedPool = updatedResults.map((entry) => entry.restaurant)
    dispatch({ type: 'RECOMMEND_READY', pool: updatedPool })
    setRecommendations(updatedResults)
    setQuestion(null)

    try {
      const nextQuestion = await askNext({ ...simulatedState, pool: updatedPool })
      setQuestion(nextQuestion)
      setLlmUnavailable(false)
    } catch (error) {
      if (error instanceof MissingOperatorKeyError) {
        setToast({ message: 'OPENAI 키가 없어서 추가 질문을 할 수 없습니다.', tone: 'warning' })
        setLlmUnavailable(true)
      } else if (error instanceof Error && error.message.includes('질문할 인텐트')) {
        dispatch({ type: 'QNA_DONE' })
      }
    }
  }, [question, state])

  const removeActiveRecommendation = useCallback((reason?: 'like' | 'skip') => {
    setRecommendations((prev) => prev.slice(1))
    if (currentRecommendation) {
      setReasonsByRestaurant((prev) => {
        const next = { ...prev }
        delete next[currentRecommendation.restaurant.id]
        return next
      })
    }
    if (state.pool.length > 1) {
      const reducedPool = state.pool.slice(1)
      dispatch({ type: 'RECOMMEND_READY', pool: reducedPool })
    }
    if (reason === 'like' && currentRecommendation) {
      dispatch({ type: 'DECIDE', placeId: currentRecommendation.restaurant.id })
    }
  }, [state.pool, currentRecommendation])

  const handleLike = useCallback(() => {
    if (!currentRecommendation) return
    const reasonSources = displayReasons
      .map((item) => item.source)
      .filter((source) => source && source !== 'local')
      .join(',')
    addVisit({
      restaurantId: currentRecommendation.restaurant.id,
      timestamp: Date.now(),
      liked: true,
      reason: reasonSources || currentRecommendation.reason,
    })
    scheduleReview(currentRecommendation.restaurant.id)
    removeActiveRecommendation('like')
  }, [currentRecommendation, displayReasons, removeActiveRecommendation])

  const handleDislike = useCallback(() => {
    if (!currentRecommendation) return
    const reasonSources = displayReasons
      .map((item) => item.source)
      .filter((source) => source && source !== 'local')
      .join(',')
    addVisit({
      restaurantId: currentRecommendation.restaurant.id,
      timestamp: Date.now(),
      liked: false,
      reason: reasonSources || currentRecommendation.reason,
    })
    removeActiveRecommendation('skip')
  }, [currentRecommendation, displayReasons, removeActiveRecommendation])

  const openMap = useCallback(() => {
    if (!currentRecommendation) return
    const { restaurant } = currentRecommendation
    const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.lat},${restaurant.lng}`
    window.open(kakaoUrl, '_blank', 'noopener,noreferrer')
  }, [currentRecommendation])

  return (
    <div className="section space-y-4">
      <Card tone="soft" className="flex items-center justify-end p-3">
        <Button
          aria-label="세션 초기화"
          variant="secondary"
          className="w-12 px-0 text-brand"
          onClick={handleReset}
        >
          <RotateCcw size={18} />
        </Button>
      </Card>

      {state.weather && (
        <Card tone="soft" className="flex flex-wrap gap-2 p-4 text-xs text-brand">
          {weatherBadges.map((badge, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 rounded-full border border-brand-light/60 bg-white px-3 py-1 shadow-sm">
              {badge.icon}
              {badge.text}
            </span>
          ))}
        </Card>
      )}

      {llmUnavailable && (
        <Card tone="soft" className="p-4 text-sm text-brand">
          운영자: OPENAI_API_KEY 설정이 필요합니다.
        </Card>
      )}

      {toast && (
        <Card tone="soft" className={`p-4 text-sm ${toastToneClass}`}>
          {toast.message}
        </Card>
      )}

      {bootError && (
        <Card tone="soft" className="p-4 text-sm !border-critical/40 text-critical">
          {bootError}
        </Card>
      )}

      {loading && (
        <Card tone="soft" className="flex flex-col items-center justify-center gap-3 p-6 text-brand">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-pale border-t-brand" />
          <span className="text-sm">초기 데이터를 불러오는 중입니다…</span>
        </Card>
      )}

      {!loading && !currentRecommendation && !question && (
        <Card tone="soft" className="p-8 text-center text-base text-gray-600">
          추천 가능한 결과가 없습니다. 취향을 업데이트하거나 잠시 후 다시 시도해 주세요.
        </Card>
      )}

      {question && (
        <Card tone="soft" className="space-y-4 p-5">
          <div className="text-xs font-semibold text-brand">맞춤 질문</div>
          <div className="text-base font-semibold text-gray-900">{question.question}</div>
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className="h-12 rounded-xl border border-brand-light/60 bg-white px-3 text-sm font-medium text-brand shadow-sm transition-colors hover:bg-brand-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
              >
                {option}
              </button>
            ))}
          </div>
        </Card>
      )}

      {currentRecommendation && (
        <Card tone="lifted" className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{currentRecommendation.restaurant.name}</h2>
            <span className="rounded-full border border-brand-light/60 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              ETA {currentRecommendation.etaMins}분
            </span>
          </div>

          <div className="space-y-3">
            {displayReasons.map((reason) => (
              <div
                key={`${reason.badge}-${reason.source}`}
                className="rounded-xl border border-brand-light/60 bg-white p-4 shadow-sm"
              >
                <div className="text-xs font-semibold text-brand">{reason.badge}</div>
                {reason.detail && <p className="mt-1 text-xs text-brand">{reason.detail}</p>}
                {reason.source && reason.source !== 'local' && (
                  <div className="mt-2 text-[10px] uppercase tracking-wide text-brand/80">{reason.source}</div>
                )}
              </div>
            ))}
          </div>

          {currentRecommendation.restaurant.categoryStrength === 'leaf' &&
            (currentRecommendation.restaurant.menuTags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-brand-light/60 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  업종 기반
                </span>
              </div>
            )}

          <div className="rounded-xl border border-brand-light/60 bg-white p-4 text-sm text-gray-700 shadow-sm">
            <div className="flex justify-between">
              <span>분류</span>
              <span>{currentRecommendation.restaurant.category}</span>
            </div>
            <div className="flex justify-between">
              <span>예상 거리</span>
              <span>{currentRecommendation.etaMins * 80}m ±</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-gray-600">
              <div>칼로리 {currentRecommendation.restaurant.macros.kcal}kcal</div>
              <div>단백질 {currentRecommendation.restaurant.macros.protein}g</div>
              <div>지방 {currentRecommendation.restaurant.macros.fat}g</div>
              <div>탄수화물 {currentRecommendation.restaurant.macros.carb}g</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="critical" fullWidth className="gap-2" onClick={handleDislike}>
              <ThumbsDown size={18} />
              패스
            </Button>
            <Button
              variant="secondary"
              className="w-12 px-0 text-brand"
              aria-label="지도 열기"
              onClick={openMap}
            >
              <MapPin size={18} />
            </Button>
            <Button variant="primary" fullWidth className="gap-2" onClick={handleLike}>
              <ThumbsUp size={18} />
              좋아요
            </Button>
          </div>

          <div className="text-center text-xs text-brand/80">
            {Math.min(5, recommendations.length)}개 중 1번째 추천
          </div>
        </Card>
      )}
    </div>
  )
}

function interpretTimePressure(option: string): number | undefined {
  const lower = option.toLowerCase()
  if (lower.includes('5')) return 5
  if (lower.includes('10')) return 10
  if (lower.includes('15')) return 15
  if (lower.includes('20')) return 20
  if (lower.includes('여유') || lower.includes('상관없')) return 25
  const numeric = parseInt(option, 10)
  return Number.isFinite(numeric) ? numeric : undefined
}

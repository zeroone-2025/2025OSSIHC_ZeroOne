'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ThumbsUp, ThumbsDown, MapPin, Cloud, Thermometer, Wind, RotateCcw } from 'lucide-react'
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

const touchButtonClass = 'rounded-2xl px-4 py-4 text-base font-semibold shadow-sm transition-all duration-150 active:scale-95'

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
              price_tier: target.restaurant.price_tier,
              macros: target.restaurant.macros,
            },
            highlights: target.reason.split(' · ').filter(Boolean),
            context: {
              weatherFlags: activeWeatherFlags,
              answers: state.answers.map(({ intent, option }) => ({ intent, option })),
              etaMins: target.etaMins,
              freeTimeMins: state.freeTimeMins ?? null,
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

  const heroSubtitle = 'LLM 질문→답변→이유있는 점심 추천'

  return (
    <div className="mx-auto max-w-md pb-24">
      <header className="sticky top-0 z-20 bg-gradient-to-b from-white/90 to-white/30 backdrop-blur-md">
        <div className="px-4 pb-3 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">이유있는 점심 추천</h1>
              <p className="text-sm text-gray-500">{heroSubtitle}</p>
            </div>
            <button
              onClick={handleReset}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:text-blue-600"
              title="세션 초기화"
            >
              <RotateCcw size={18} />
            </button>
          </div>
          {state.weather && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              {weatherBadges.map((badge, idx) => (
                <span key={idx} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                  {badge.icon}
                  {badge.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {llmUnavailable && (
        <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          운영자: OPENAI_API_KEY 설정이 필요합니다.
        </div>
      )}

      {toast && (
        <div
          className={`mx-4 mt-4 rounded-2xl px-4 py-3 text-sm shadow ${
            toast.tone === 'error'
              ? 'bg-red-50 text-red-700'
              : toast.tone === 'warning'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {bootError && (
        <div className="mx-4 mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bootError}
        </div>
      )}

      {loading && (
        <div className="mt-20 flex flex-col items-center justify-center gap-3 text-gray-500">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          <span className="text-sm">초기 데이터를 불러오는 중입니다…</span>
        </div>
      )}

      {!loading && !currentRecommendation && !question && (
        <div className="mx-4 mt-20 rounded-3xl bg-white p-8 text-center shadow">
          <p className="text-base text-gray-600">추천 가능한 결과가 없습니다. 취향을 업데이트하거나 잠시 후 다시 시도해 주세요.</p>
        </div>
      )}

      {question && (
        <section className="mx-4 mt-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-blue-500">맞춤 질문</div>
          <div className="mt-2 text-base font-semibold text-gray-900">{question.question}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className="rounded-2xl bg-blue-50 px-3 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                style={{ minHeight: 48 }}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      )}

      {currentRecommendation && (
        <main className="mx-4 mt-6 rounded-3xl bg-white p-6 shadow">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{currentRecommendation.restaurant.name}</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              ETA {currentRecommendation.etaMins}분
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {displayReasons.map((reason) => (
              <div
                key={`${reason.badge}-${reason.source}`}
                className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
              >
                <div className="text-xs font-semibold text-blue-700">{reason.badge}</div>
                {reason.detail && <p className="mt-1 text-xs text-blue-900">{reason.detail}</p>}
                {reason.source && reason.source !== 'local' && (
                  <div className="mt-2 text-[10px] uppercase tracking-wide text-blue-400">{reason.source}</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
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

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleDislike}
              className={`${touchButtonClass} flex-1 bg-red-500 text-white hover:bg-red-600`}
            >
              <ThumbsDown size={18} />
              패스
            </button>
            <button
              onClick={openMap}
              className={`${touchButtonClass} flex w-14 items-center justify-center bg-yellow-400 text-white hover:bg-yellow-500`}
              aria-label="지도 열기"
            >
              <MapPin size={18} />
            </button>
            <button
              onClick={handleLike}
              className={`${touchButtonClass} flex-1 bg-green-500 text-white hover:bg-green-600`}
            >
              <ThumbsUp size={18} />
              좋아요
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            {Math.min(5, recommendations.length)}개 중 1번째 추천
          </div>
        </main>
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

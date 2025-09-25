import { NextRequest, NextResponse } from 'next/server'
import { hasOpenAIKey } from '@/lib/env'
import { chatJson, type ChatMessage } from '@/lib/openai'
import { isValidReasons } from '@/lib/validators'

type ReasonRequest = {
  restaurant: {
    id?: string
    name: string
    category: string
    tags: string[]
    price_tier?: number
    macros?: Record<string, number>
    menuTags?: string[]
    categoryName?: string | null
    categoryStrength?: string | null
  }
  highlights: string[]
  context: {
    weatherFlags: string[]
    answers: { intent: string; option: string }[]
    etaMins?: number
    freeTimeMins?: number | null
    menuTags?: string[]
  }
}

type ReasonDetail = {
  badge: string
  detail: string
  source: string
}

type ReasonResponse = {
  reasons: ReasonDetail[]
}

const SYSTEM_PROMPT = [
  '역할: 점심 추천 근거 생성기.',
  '규칙:',
  '- 입력 JSON만 사용. 추측이나 외부 지식 금지.',
  '- 뻔한 상식 단독 금지. 서로 다른 정보 2~3개 근거 제공.',
  '- 각 근거는 badge 18자 이하, detail 1문장. source는 weather|eta|novelty|history|trend|allergy|nutrition|group|situation|pref|category 중 선택.',
  '- 출력은 JSON 한 줄 {"reasons":[{"badge":"...","detail":"...","source":"..."}]} 형식.',
].join('\n')

const FALLBACK_REASON: ReasonDetail = {
  badge: '근거 생성 실패',
  detail: 'LLM 응답이 없어 기본 근거를 사용합니다.',
  source: 'fallback',
}

export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  if (!isValidReasonRequest(payload)) {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
  }

  if (!hasOpenAIKey()) {
    return NextResponse.json({ error: 'NO_OPENAI_KEY' }, { status: 503 })
  }

  const requestBody = sanitizeReasonRequest(payload)

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(requestBody) },
  ]

  let result: unknown
  try {
    result = await chatJson(messages)
  } catch (error) {
    console.error('chatJson(reasons) failed:', error)
    const isMissingKey = error instanceof Error && error.message === 'NO_OPENAI_KEY'
    return NextResponse.json(
      { error: isMissingKey ? 'NO_OPENAI_KEY' : 'LLM_REQUEST_FAILED' },
      { status: isMissingKey ? 503 : 500 }
    )
  }

  if (!isValidReasons(result)) {
    console.error('Invalid LLM reasons response:', result)
    return NextResponse.json({ error: 'BAD_LLM_RESPONSE' }, { status: 500 })
  }

  const normalized = normalizeReasons(result)

  return NextResponse.json(normalized, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

function isValidReasonRequest(candidate: unknown): candidate is ReasonRequest {
  if (!candidate || typeof candidate !== 'object') {
    return false
  }

  const value = candidate as Record<string, any>
  const restaurant = value.restaurant
  const context = value.context

  if (!restaurant || typeof restaurant !== 'object') {
    return false
  }

  if (typeof restaurant.name !== 'string' || typeof restaurant.category !== 'string') {
    return false
  }

  if (!Array.isArray(restaurant.tags)) {
    return false
  }

  if (restaurant.menuTags !== undefined && !Array.isArray(restaurant.menuTags)) {
    return false
  }

  if (!Array.isArray(value.highlights)) {
    return false
  }

  if (!context || typeof context !== 'object') {
    return false
  }

  if (!Array.isArray(context.weatherFlags) || !Array.isArray(context.answers)) {
    return false
  }

  if (context.menuTags !== undefined && !Array.isArray(context.menuTags)) {
    return false
  }

  return true
}

function sanitizeReasonRequest(candidate: ReasonRequest): ReasonRequest {
  return {
    restaurant: {
      ...candidate.restaurant,
      name: candidate.restaurant.name.trim(),
      category: candidate.restaurant.category.trim(),
      tags: candidate.restaurant.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
      menuTags: Array.isArray(candidate.restaurant.menuTags)
        ? candidate.restaurant.menuTags.map((tag) => tag.trim()).filter(Boolean).slice(0, 12)
        : [],
    },
    highlights: candidate.highlights.map((item) => item.trim()).filter(Boolean).slice(0, 5),
    context: {
      ...candidate.context,
      weatherFlags: candidate.context.weatherFlags.map((flag) => flag.trim()).filter(Boolean).slice(0, 8),
      answers: candidate.context.answers
        .map((entry) => ({
          intent: entry.intent.trim(),
          option: entry.option.trim(),
        }))
        .filter((entry) => entry.intent && entry.option)
        .slice(0, 10),
      menuTags: Array.isArray(candidate.context.menuTags)
        ? candidate.context.menuTags.map((tag) => tag.trim()).filter(Boolean).slice(0, 12)
        : [],
    },
  }
}

function normalizeReasons(payload: ReasonResponse): ReasonResponse {
  const reasons = payload.reasons
    .slice(0, 3)
    .map((reason) => ({
      badge: reason.badge.trim().slice(0, 18),
      detail: reason.detail.trim(),
      source: reason.source.trim().toLowerCase(),
    }))
    .filter((reason) => reason.badge && reason.detail && reason.source)

  if (!reasons.length) {
    return { reasons: [FALLBACK_REASON] }
  }

  return { reasons }
}

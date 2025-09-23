import { NextRequest, NextResponse } from 'next/server'
import { hasOpenAIKey } from '@/lib/env'
import { chatJson } from '@/lib/openai'

interface ReasonRequest {
  restaurant: {
    id?: string
    name: string
    category: string
    tags: string[]
    price_tier?: number
    macros?: Record<string, number>
  }
  highlights: string[]
  context: {
    weatherFlags: string[]
    answers: { intent: string; option: string }[]
    etaMins?: number
    freeTimeMins?: number | null
  }
}

interface ReasonDetail {
  badge: string
  detail: string
  source: string
}

interface ReasonResponse {
  reasons: ReasonDetail[]
}

const SYSTEM_PROMPT = `역할: 점심 추천 근거 생성기.

규칙:
- 입력 JSON만 사용. 추측/창작/미확인 정보 금지.
- 뻔한 상식(예: "추워서 국물")만으로 된 근거 금지. 기여도가 높은 다른 요소와 결합.
- 상위 기여도 2~3개의 근거로 구성.
- 각 근거는 18자 이내의 배지(badge) + 1문장 설명(detail) + source 키(예: weather, profile, answer 등).
- 설명은 한국어, 간결하지만 구체적으로 작성.
- 금지: 평점 언급, 리뷰 인용, 영업/혼잡 단정, 과장된 수식.
- 출력은 JSON 한 줄. 스키마: {"reasons":[{"badge":"","detail":"","source":""}, ...]}`;

export async function POST(request: NextRequest) {
  if (!hasOpenAIKey()) {
    return NextResponse.json({ error: 'NO_OPENAI_KEY' }, { status: 503 })
  }

  try {
    const body = await request.json()
    validateRequest(body)

    const payload = {
      restaurant: body.restaurant,
      highlights: body.highlights,
      context: body.context,
    }

    const result = await chatJson(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) },
      ],
      { maxTokens: 500 }
    )

    validateResponse(result)

    const normalized: ReasonResponse = {
      reasons: result.reasons.slice(0, 3).map((reason: ReasonDetail) => ({
        badge: String(reason.badge).trim().slice(0, 18),
        detail: String(reason.detail).trim(),
        source: String(reason.source || 'llm').trim().toLowerCase(),
      })),
    }

    return NextResponse.json(normalized, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    if ((error as Error).message === 'NO_OPENAI_KEY') {
      return NextResponse.json({ error: 'NO_OPENAI_KEY' }, { status: 503 })
    }

    console.error('LLM reason generation failed:', error)
    const message = error instanceof Error ? error.message : 'LLM 근거 생성 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function validateRequest(candidate: unknown): asserts candidate is ReasonRequest {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('INVALID_REQUEST')
  }

  const value = candidate as Record<string, unknown>
  const restaurant = value.restaurant as Record<string, unknown>
  const context = value.context as Record<string, unknown>

  if (!restaurant || typeof restaurant.name !== 'string' || typeof restaurant.category !== 'string') {
    throw new Error('INVALID_REQUEST')
  }

  if (!Array.isArray(restaurant.tags)) {
    throw new Error('INVALID_REQUEST')
  }

  if (!Array.isArray(value.highlights) || value.highlights.length === 0) {
    throw new Error('INVALID_REQUEST')
  }

  if (!context || !Array.isArray(context.weatherFlags) || !Array.isArray(context.answers)) {
    throw new Error('INVALID_REQUEST')
  }
}

function validateResponse(candidate: unknown): asserts candidate is ReasonResponse {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('INVALID_OPENAI_JSON')
  }

  const value = candidate as Record<string, unknown>
  if (!Array.isArray(value.reasons) || value.reasons.length === 0) {
    throw new Error('INVALID_OPENAI_JSON')
  }

  for (const reason of value.reasons) {
    if (!reason || typeof reason !== 'object') {
      throw new Error('INVALID_OPENAI_JSON')
    }
    const item = reason as Record<string, unknown>
    if (typeof item.badge !== 'string' || typeof item.detail !== 'string') {
      throw new Error('INVALID_OPENAI_JSON')
    }
  }
}

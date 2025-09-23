import { NextRequest, NextResponse } from 'next/server'
import { hasOpenAIKey } from '@/lib/env'
import { chatJson } from '@/lib/openai'
import { isValidReasons } from '@/lib/validators'

interface ReasonRequest {
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
* 입력 JSON만 사용. 추측·발명 금지. 외부 지식 사용 금지.
* 뻔한 상식 단독 금지. 최소 2가지 근거 결합(개인 기록/집단 트렌드/시간·거리/영양/알레르기/신규성/업종).
* 상위 기여도 순 2~3개. 각 근거 18자 배지 + 1문장 설명(한국어, 구체적 수치/조건).
* 금지: 평점·리뷰 생성, 영업여부 단정, 과장어.

출력 스키마(JSON only):
{"reasons":[{"badge":"...","detail":"...","source":"weather|eta|novelty|history|trend|allergy|nutrition|group|situation|pref|category"}]}`;

export async function POST(request: NextRequest) {
  if (!hasOpenAIKey()) {
    return NextResponse.json({ error: 'NO_OPENAI_KEY' }, { status: 503 })
  }

  try {
    const body = await request.json()
    validateRequest(body)

    const payload = {
      restaurant: {
        ...body.restaurant,
        menuTags: Array.isArray(body.restaurant?.menuTags)
          ? body.restaurant.menuTags.filter((tag: unknown) => typeof tag === 'string').slice(0, 12)
          : [],
      },
      highlights: Array.isArray(body.highlights)
        ? body.highlights.filter((item: unknown) => typeof item === 'string').slice(0, 5)
        : [],
      context: {
        ...body.context,
        menuTags: Array.isArray(body.context?.menuTags)
          ? body.context.menuTags.filter((tag: unknown) => typeof tag === 'string').slice(0, 12)
          : [],
      },
    }

    const result = await chatJson(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) },
      ],
      { maxTokens: 500 }
    )

    if (!isValidReasons(result)) {
      throw new Error('INVALID_OPENAI_JSON')
    }

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

  if (restaurant.menuTags !== undefined && !Array.isArray(restaurant.menuTags)) {
    throw new Error('INVALID_REQUEST')
  }

  if (!Array.isArray(value.highlights)) {
    throw new Error('INVALID_REQUEST')
  }

  if (!context || !Array.isArray(context.weatherFlags) || !Array.isArray(context.answers)) {
    throw new Error('INVALID_REQUEST')
  }

  if (context.menuTags !== undefined && !Array.isArray(context.menuTags)) {
    throw new Error('INVALID_REQUEST')
  }
}

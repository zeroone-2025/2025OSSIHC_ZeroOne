import { NextRequest, NextResponse } from 'next/server'
import { hasOpenAIKey } from '@/lib/env'
import { chatJson, type ChatMessage } from '@/lib/openai'

type QuestionRequest = {
  session: {
    upperTags: string[]
    weatherFlags: string[]
    previousAnswers: string[]
  }
  remainingIntents: string[]
}

type SliderConfig = {
  min: number
  max: number
  step: number
  preset: number[]
}

type QuestionResponse = {
  id: string
  text: string
  options?: string[]
  slider?: SliderConfig
}

const VALID_INTENTS = ["budget", "time_pressure", "meal_feel"] as const

const SYSTEM_PROMPT = [
  '역할: 점심 추천 질문 생성기.',
  '',
  '요구사항:',
  '1. remainingIntents 배열의 첫 번째 값을 intent로 사용.',
  '2. intent가 "budget"이면 예산 관련 질문 생성.',
  '3. intent가 "time_pressure"이면 시간 압박 관련 질문 생성 (옵션: "급함", "보통", "여유").',
  '4. intent가 "meal_feel"이면 식사 느낌 관련 질문 생성 (옵션: "따뜻하게", "가볍게", "든든하게", "새로운 걸로").',
  '5. 질문은 한국어 한 문장.',
  '6. budget 외에는 보기 4개 제공.',
  '7. 메뉴 추천, 광고 문구, 다중 질문, 영어 혼용 금지.',
  '8. 출력은 JSON 한 줄: {"id":"q-타임스탬프","text":"질문","options":[...]} 또는 budget일 때 {"id":"budget","text":"예산을 설정해주세요"}',
].join('\n')

export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  if (!isValidQuestionRequest(payload)) {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
  }

  if (!hasOpenAIKey()) {
    return NextResponse.json({ error: 'NO_OPENAI_KEY' }, { status: 503 })
  }

  const requestBody: QuestionRequest = {
    remainingIntents: payload.remainingIntents.filter((intent: string) =>
      VALID_INTENTS.includes(intent as any)
    ),
    session: {
      upperTags: dedupeStrings(payload.session.upperTags).slice(0, 8),
      weatherFlags: dedupeStrings(payload.session.weatherFlags).slice(0, 8),
      previousAnswers: dedupeStrings(payload.session.previousAnswers).slice(0, 12),
    },
  }

  if (requestBody.remainingIntents.length === 0) {
    return NextResponse.json({ error: 'NO_VALID_INTENTS' }, { status: 400 })
  }

  const currentIntent = requestBody.remainingIntents[0]

  // Handle budget question specially - return slider config
  if (currentIntent === 'budget') {
    const budgetResponse: QuestionResponse = {
      id: 'budget',
      text: '오늘 점심 예산은 얼마까지 생각하고 계신가요?',
      slider: {
        min: 0,
        max: 50000,
        step: 1000,
        preset: [8000, 12000, 20000, 35000]
      }
    }
    return NextResponse.json(budgetResponse)
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        remainingIntents: [currentIntent],
        session: requestBody.session,
      }),
    },
  ]

  let result: unknown
  try {
    result = await chatJson(messages)
  } catch (error) {
    console.error('chatJson(next-question) failed:', error)
    const isMissingKey = error instanceof Error && error.message === 'NO_OPENAI_KEY'
    return NextResponse.json(
      { error: isMissingKey ? 'NO_OPENAI_KEY' : 'LLM_REQUEST_FAILED' },
      { status: isMissingKey ? 503 : 500 }
    )
  }

  let normalized: QuestionResponse
  try {
    normalized = normalizeQuestionResponse(result, currentIntent)
  } catch (error) {
    console.error('Invalid LLM next-question response:', error)
    return NextResponse.json({ error: 'BAD_LLM_RESPONSE' }, { status: 500 })
  }

  return NextResponse.json(normalized, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

function isValidQuestionRequest(candidate: unknown): candidate is QuestionRequest {
  if (!candidate || typeof candidate !== 'object') {
    return false
  }

  const value = candidate as Record<string, any>
  const session = value.session

  if (!Array.isArray(value.remainingIntents) || value.remainingIntents.length === 0) {
    return false
  }

  if (!session || typeof session !== 'object') {
    return false
  }

  if (!Array.isArray(session.upperTags) || !Array.isArray(session.weatherFlags) || !Array.isArray(session.previousAnswers)) {
    return false
  }

  return true
}

function normalizeQuestionResponse(candidate: unknown, intent: string): QuestionResponse {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('missing payload object')
  }

  const value = candidate as Record<string, unknown>
  const id = safeString(value.id) || safeString(value.qId) || intent
  const text = safeString(value.text) || safeString(value.question)
  const optionsRaw = Array.isArray(value.options) ? value.options : []

  const options = optionsRaw
    .map((option) => safeString(option))
    .filter(Boolean)
    .slice(0, 5)

  if (!text) {
    throw new Error('missing question text')
  }

  // For non-budget questions, require options
  if (intent !== 'budget' && options.length < 3) {
    throw new Error('insufficient options for non-budget question')
  }

  const response: QuestionResponse = {
    id,
    text,
  }

  if (intent !== 'budget') {
    response.options = options
  }

  return response
}

function dedupeStrings(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []
  for (const item of input) {
    const value = safeString(item)
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }
  return result
}

function safeString(candidate: unknown): string {
  return typeof candidate === 'string' ? candidate.trim() : ''
}
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

type QuestionResponse = {
  qId: string
  intent: string
  question: string
  options: string[]
}

const SYSTEM_PROMPT = [
  '역할: 점심 추천 질문 생성기.',
  '',
  '요구사항:',
  '1. remainingIntents 배열의 첫 번째 값을 intent로 사용.',
  '2. 질문은 한국어 한 문장.',
  '3. 보기 4~5개, 간결하고 서로 구분되도록 작성.',
  '4. 메뉴 추천, 광고 문구, 다중 질문, 영어 혼용 금지.',
  '5. 출력은 JSON 한 줄: {"qId":"q-타임스탬프","intent":"intent","question":"질문","options":[...]}',
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
    remainingIntents: payload.remainingIntents,
    session: {
      upperTags: dedupeStrings(payload.session.upperTags).slice(0, 8),
      weatherFlags: dedupeStrings(payload.session.weatherFlags).slice(0, 8),
      previousAnswers: dedupeStrings(payload.session.previousAnswers).slice(0, 12),
    },
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        remainingIntents: requestBody.remainingIntents,
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
    normalized = normalizeQuestionResponse(result)
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

function normalizeQuestionResponse(candidate: unknown): QuestionResponse {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('missing payload object')
  }

  const value = candidate as Record<string, unknown>
  const qId = safeString(value.qId)
  const intent = safeString(value.intent)
  const question = safeString(value.question)
  const optionsRaw = Array.isArray(value.options) ? value.options : []

  const options = optionsRaw
    .map((option) => safeString(option))
    .filter(Boolean)
    .slice(0, 5)

  if (!qId || !intent || !question || options.length < 4) {
    throw new Error('missing essential fields')
  }

  return {
    qId,
    intent,
    question,
    options,
  }
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

import { NextRequest, NextResponse } from 'next/server';
import { hasOpenAIKey } from '@/lib/env';
import { chatJson } from '@/lib/openai';

interface QuestionRequest {
  session: {
    upperTags: string[];
    weatherFlags: string[];
    previousAnswers: string[];
  };
  remainingIntents: string[];
}

interface QuestionResponse {
  qId: string;
  intent: string;
  question: string;
  options: string[];
}

const SYSTEM_PROMPT = `역할: 점심 추천 질문 생성기.

규칙:
1. remainingIntents 배열의 첫 번째 요소 intent로 지정.
2. 질문은 한국어 1문항(두 문장 금지).
3. 보기 4~5개, 짧고 구체적으로 작성.
4. 메뉴 추천, 광고성 문구, 다중 질문, 영어 혼용 금지.
5. 출력은 JSON 한 줄: {"qId":"q-타임스탬프","intent":"intent","question":"질문","options":[...]}`;

export async function POST(request: NextRequest) {
  if (!hasOpenAIKey()) {
    return NextResponse.json({ error: 'NO_OPENAI_KEY' }, { status: 503 })
  }

  try {
    const body = await request.json()
    validateRequest(body)

    const userPayload = {
      remainingIntents: body.remainingIntents,
      session: {
        upperTags: body.session.upperTags,
        weatherFlags: body.session.weatherFlags,
        previousAnswers: body.session.previousAnswers,
      },
    }

    const data = await chatJson(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
      { maxTokens: 350 }
    )

    validateResponse(data)

    const sanitized: QuestionResponse = {
      qId: String(data.qId),
      intent: String(data.intent),
      question: String(data.question),
      options: data.options.slice(0, 5).map((option: unknown) => String(option).trim()).filter(Boolean),
    }

    return NextResponse.json(sanitized, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    if ((error as Error).message === 'NO_OPENAI_KEY') {
      return NextResponse.json({ error: 'NO_OPENAI_KEY' }, { status: 503 })
    }

    console.error('LLM question generation failed:', error)
    const message = error instanceof Error ? error.message : 'LLM 질문 생성 실패'
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}

function validateRequest(candidate: unknown): asserts candidate is QuestionRequest {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('INVALID_REQUEST')
  }

  const value = candidate as Record<string, unknown>
  const session = value.session as Record<string, unknown> | undefined
  if (!Array.isArray(value.remainingIntents) || value.remainingIntents.length === 0) {
    throw new Error('INVALID_REQUEST')
  }
  if (!session) {
    throw new Error('INVALID_REQUEST')
  }
  if (!Array.isArray(session.upperTags) || !Array.isArray(session.weatherFlags) || !Array.isArray(session.previousAnswers)) {
    throw new Error('INVALID_REQUEST')
  }
}

function validateResponse(payload: any): asserts payload is QuestionResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('INVALID_OPENAI_JSON')
  }

  if (typeof payload.qId !== 'string' || typeof payload.intent !== 'string' || typeof payload.question !== 'string') {
    throw new Error('INVALID_OPENAI_JSON')
  }

  if (!Array.isArray(payload.options) || payload.options.length === 0) {
    throw new Error('INVALID_OPENAI_JSON')
  }
}

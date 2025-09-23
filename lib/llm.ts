import type { SessionState } from './state'

export interface NextQuestion {
  qId: string
  intent: string
  question: string
  options: string[]
}

const DEFAULT_INTENTS = [
  'time_pressure',
  'distance_tradeoff',
  'meal_feel',
  'group_dyn',
  'diet_focus',
  'indoor_outdoor',
  'spice_tolerance',
]

const hasOpenAiKey = process.env.HAS_OPENAI_KEY === 'true'

export class MissingOperatorKeyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingOperatorKeyError'
  }
}

export async function getNextQuestion(
  state: SessionState,
  opts: { signal?: AbortSignal; intents?: string[] } = {}
): Promise<NextQuestion> {
  if (!hasOpenAiKey) {
    throw new MissingOperatorKeyError('OPENAI_API_KEY가 설정되어 있지 않습니다.')
  }

  const intents = opts.intents ?? DEFAULT_INTENTS
  const remainingIntents = intents.filter((intent) => !state.answers.some((answer) => answer.intent === intent))

  if (!remainingIntents.length) {
    throw new Error('질문할 인텐트가 없습니다.')
  }

  const topTags = state.pool[0]?.tags?.slice(0, 3) || state.places[0]?.tags?.slice(0, 3) || []
  const activeWeatherFlags = Object.entries(state.weather?.flags ?? {})
    .filter(([, active]) => Boolean(active))
    .map(([flag]) => flag)

  const response = await fetch('/api/llm/next-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: {
        upperTags: topTags,
        weatherFlags: activeWeatherFlags,
        previousAnswers: state.answers.map((a) => a.option),
      },
      remainingIntents,
    }),
    signal: opts.signal,
  })

  if (response.status === 503) {
    const payload = await safeJson(response)
    const message = typeof payload?.error === 'string' ? payload.error : '운영자 키 설정이 필요합니다.'
    throw new MissingOperatorKeyError(message)
  }

  if (!response.ok) {
    const payload = await safeJson(response)
    const message = typeof payload?.error === 'string' ? payload.error : `LLM 질문 요청 실패 (${response.status})`
    throw new Error(message)
  }

  const data = await response.json()
  validateQuestion(data)
  return data
}

async function safeJson(res: Response): Promise<any | null> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function validateQuestion(candidate: any): asserts candidate is NextQuestion {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('질문 응답 형식이 올바르지 않습니다.')
  }

  if (typeof candidate.qId !== 'string' || typeof candidate.intent !== 'string') {
    throw new Error('질문 응답에 식별자가 없습니다.')
  }

  if (typeof candidate.question !== 'string' || !Array.isArray(candidate.options)) {
    throw new Error('질문 응답에 필수 필드가 없습니다.')
  }
}

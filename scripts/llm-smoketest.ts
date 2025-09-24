const baseUrl = process.env.LLM_TEST_BASE_URL || 'http://localhost:3000'

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set. Aborting smoke test.')
  process.exit(1)
}

async function main() {
  await testNextQuestion()
  await testReasons()
  console.log('LLM smoke test passed.')
}

async function testNextQuestion() {
  const response = await fetch(`${baseUrl}/api/llm/next-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: {
        upperTags: ['salad', 'warm'],
        weatherFlags: ['wet'],
        previousAnswers: ['빠르게 먹고 싶어요'],
      },
      remainingIntents: ['time_pressure', 'meal_feel'],
    }),
  })

  if (!response.ok) {
    throw new Error(`/api/llm/next-question failed: ${response.status}`)
  }

  const data = await response.json()
  if (!data.qId || !data.intent || !data.question || !Array.isArray(data.options)) {
    throw new Error('next-question response missing required fields')
  }
}

async function testReasons() {
  const response = await fetch(`${baseUrl}/api/llm/reasons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurant: {
        name: '테스트 식당',
        category: 'korean',
        tags: ['warm', 'soup'],
        price_tier: 2,
      },
      highlights: ['[프로필] 7일 내 미방문', '[날씨] 비/체감 추움'],
      context: {
        weatherFlags: ['wet', 'feels_cold'],
        answers: [
          { intent: 'meal_feel', option: '따뜻한 국물' },
          { intent: 'time_pressure', option: '10분 내외' },
        ],
        etaMins: 6,
        freeTimeMins: 12,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`/api/llm/reasons failed: ${response.status}`)
  }

  const data = await response.json()
  if (!Array.isArray(data.reasons) || data.reasons.length === 0) {
    throw new Error('reasons response missing reasons array')
  }

  for (const reason of data.reasons) {
    if (!reason.badge || !reason.detail || !reason.source) {
      throw new Error('reason entry missing required fields')
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

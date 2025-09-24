import { ensureOpenAI } from './env'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatOptions {
  maxTokens?: number
  temperature?: number
  topP?: number
  signal?: AbortSignal
}

export async function chatJson(messages: ChatMessage[], options: ChatOptions = {}): Promise<any> {
  ensureOpenAI()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: options.temperature ?? 0.2,
      top_p: options.topP ?? 0.9,
      max_tokens: options.maxTokens ?? 400,
      response_format: { type: 'json_object' },
      messages,
    }),
    signal: options.signal,
  })

  if (!response.ok) {
    const error = new Error(`OpenAI request failed: ${response.status}`)
    error.name = 'OpenAIRequestError'
    throw error
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI response missing JSON content')
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error('OpenAI response is not valid JSON')
  }
}

import { hasGeminiKey } from './env'

interface GeminiOptions {
  schemaHint?: string
  signal?: AbortSignal
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export async function callGeminiJSON(prompt: string, options: GeminiOptions = {}): Promise<any> {
  if (!hasGeminiKey()) {
    throw new Error('Gemini API key missing')
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY as string
  const composedPrompt = options.schemaHint ? `${options.schemaHint.trim()}

${prompt}` : prompt

  const response = await fetch(`${GEMINI_ENDPOINT}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: composedPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
      },
    }),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`GEMINI_REQUEST_FAILED_${response.status}`)
  }

  const payload = await response.json()
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('GEMINI_EMPTY_RESPONSE')
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error('GEMINI_INVALID_JSON')
  }
}

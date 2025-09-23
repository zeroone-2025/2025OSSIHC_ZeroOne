export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim())
}

export function ensureOpenAI(): void {
  if (!hasOpenAIKey()) {
    const error = new Error('NO_OPENAI_KEY')
    error.name = 'MissingOpenAIKeyError'
    throw error
  }
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function getEnv(name: string): string {
  const value = readEnv(name)
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export function hasOpenAIKey(): boolean {
  return Boolean(readEnv('OPENAI_API_KEY'))
}

export function hasWeatherKey(): boolean {
  return Boolean(readEnv('WEATHER_API_KEY') ?? readEnv('WEATHER_AUTH_KEY'))
}

export function hasKakaoKey(): boolean {
  return Boolean(readEnv('KAKAO_API_KEY') ?? readEnv('NEXT_PUBLIC_KAKAO_JS_KEY'))
}

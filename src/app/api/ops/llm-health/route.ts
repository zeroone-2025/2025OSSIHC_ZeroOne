import { NextResponse } from 'next/server'
import { hasOpenAIKey } from '@/lib/env'

export function GET() {
  if (hasOpenAIKey()) {
    return NextResponse.json({ status: 'KEY_PRESENT' }, { status: 200 })
  }

  return NextResponse.json({ status: 'NO_OPENAI_KEY' }, { status: 503 })
}

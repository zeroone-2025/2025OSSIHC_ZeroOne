import { NextResponse } from 'next/server'
import { hasGeminiKey } from '@/lib/env'

export function GET() {
  if (hasGeminiKey()) {
    return NextResponse.json({ status: 'KEY_PRESENT' }, { status: 200 })
  }
  return NextResponse.json({ status: 'NO_GEMINI_KEY' }, { status: 503 })
}

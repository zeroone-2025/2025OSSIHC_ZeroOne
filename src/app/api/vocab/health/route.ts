import { NextRequest, NextResponse } from 'next/server'

interface VocabEntry {
  label: string
  synonyms: string[]
}

type VocabData = Record<string, VocabEntry>

interface HealthCheckResult {
  ok: boolean
  timestamp: string
  checks: {
    allergies: {
      success: boolean
      keys?: string[]
      keyCount?: number
      error?: string
    }
    food_dislikes: {
      success: boolean
      keys?: string[]
      keyCount?: number
      error?: string
    }
  }
  summary?: {
    totalKeys: number
    totalSynonyms: number
  }
  detail?: string
}

/**
 * Vocab 파일 헬스체크 - 두 파일 모두 fetch로 검증
 */
export async function GET(request: NextRequest) {
  console.log('[VocabHealth] 헬스체크 시작')

  const result: HealthCheckResult = {
    ok: true,
    timestamp: new Date().toISOString(),
    checks: {
      allergies: { success: false },
      food_dislikes: { success: false }
    }
  }

  const baseUrl = request.nextUrl.origin
  let totalKeys = 0
  let totalSynonyms = 0

  try {
    // 1. allergies.ko.json 검증
    try {
      console.log('[VocabHealth] allergies.ko.json 체크 중...')

      const allergiesResponse = await fetch(`${baseUrl}/data/vocab/allergies.ko.json`, {
        cache: 'no-store'
      })

      if (!allergiesResponse.ok) {
        throw new Error(`HTTP ${allergiesResponse.status}: ${allergiesResponse.statusText}`)
      }

      const allergiesData: VocabData = await allergiesResponse.json()
      const allergiesKeys = Object.keys(allergiesData)

      // 스키마 검증
      for (const [key, entry] of Object.entries(allergiesData)) {
        if (!entry.label || typeof entry.label !== 'string') {
          throw new Error(`Invalid label in key "${key}"`)
        }
        if (!Array.isArray(entry.synonyms)) {
          throw new Error(`Invalid synonyms in key "${key}"`)
        }
        totalSynonyms += entry.synonyms.length
      }

      result.checks.allergies = {
        success: true,
        keys: allergiesKeys,
        keyCount: allergiesKeys.length
      }

      totalKeys += allergiesKeys.length

      console.log(`[VocabHealth] ✅ allergies.ko.json OK (${allergiesKeys.length}개 키)`)

    } catch (error) {
      console.error('[VocabHealth] ❌ allergies.ko.json 실패:', error)
      result.checks.allergies = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      result.ok = false
    }

    // 2. food_dislikes.ko.json 검증
    try {
      console.log('[VocabHealth] food_dislikes.ko.json 체크 중...')

      const dislikesResponse = await fetch(`${baseUrl}/data/vocab/food_dislikes.ko.json`, {
        cache: 'no-store'
      })

      if (!dislikesResponse.ok) {
        throw new Error(`HTTP ${dislikesResponse.status}: ${dislikesResponse.statusText}`)
      }

      const dislikesData: VocabData = await dislikesResponse.json()
      const dislikesKeys = Object.keys(dislikesData)

      // 스키마 검증
      for (const [key, entry] of Object.entries(dislikesData)) {
        if (!entry.label || typeof entry.label !== 'string') {
          throw new Error(`Invalid label in key "${key}"`)
        }
        if (!Array.isArray(entry.synonyms)) {
          throw new Error(`Invalid synonyms in key "${key}"`)
        }
        totalSynonyms += entry.synonyms.length
      }

      result.checks.food_dislikes = {
        success: true,
        keys: dislikesKeys,
        keyCount: dislikesKeys.length
      }

      totalKeys += dislikesKeys.length

      console.log(`[VocabHealth] ✅ food_dislikes.ko.json OK (${dislikesKeys.length}개 키)`)

    } catch (error) {
      console.error('[VocabHealth] ❌ food_dislikes.ko.json 실패:', error)
      result.checks.food_dislikes = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      result.ok = false
    }

    // 3. 종합 정보 추가
    if (result.ok) {
      result.summary = {
        totalKeys,
        totalSynonyms
      }
      console.log(`[VocabHealth] 🎉 전체 성공 - ${totalKeys}개 키, ${totalSynonyms}개 동의어`)
    } else {
      const failedChecks = Object.entries(result.checks)
        .filter(([_, check]) => !check.success)
        .map(([name, _]) => name)

      result.detail = `Failed checks: ${failedChecks.join(', ')}`
      console.log(`[VocabHealth] ❌ 일부 실패: ${result.detail}`)
    }

  } catch (error) {
    console.error('[VocabHealth] 전체 실패:', error)
    result.ok = false
    result.detail = error instanceof Error ? error.message : 'Unknown error'
  }

  const status = result.ok ? 200 : 500
  return NextResponse.json(result, { status })
}
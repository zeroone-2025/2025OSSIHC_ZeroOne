/**
 * Vocab 파일 로더 유틸리티
 * 클라이언트/서버 모두에서 사용 가능한 fetch 기반 로더
 */

export interface VocabEntry {
  label: string
  synonyms: string[]
}

export type VocabData = Record<string, VocabEntry>

/**
 * 알레르기 vocab 로드
 */
export async function loadAllergies(): Promise<VocabData> {
  try {
    console.log('[Vocab] Loading allergies.ko.json...')

    const response = await fetch('/data/vocab/allergies.ko.json', {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch allergies: ${response.status} ${response.statusText}`)
    }

    const data: VocabData = await response.json()

    // 기본 검증
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid allergies data format')
    }

    const keyCount = Object.keys(data).length
    console.log(`[Vocab] ✅ Allergies loaded: ${keyCount} entries`)

    return data

  } catch (error) {
    console.error('[Vocab] ❌ Failed to load allergies:', error)
    throw error
  }
}

/**
 * 음식 기피사항 vocab 로드
 */
export async function loadFoodDislikes(): Promise<VocabData> {
  try {
    console.log('[Vocab] Loading food_dislikes.ko.json...')

    const response = await fetch('/data/vocab/food_dislikes.ko.json', {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch food_dislikes: ${response.status} ${response.statusText}`)
    }

    const data: VocabData = await response.json()

    // 기본 검증
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid food_dislikes data format')
    }

    const keyCount = Object.keys(data).length
    console.log(`[Vocab] ✅ Food dislikes loaded: ${keyCount} entries`)

    return data

  } catch (error) {
    console.error('[Vocab] ❌ Failed to load food_dislikes:', error)
    throw error
  }
}

/**
 * 모든 vocab 데이터 로드 (병렬)
 */
export async function loadAllVocab(): Promise<{
  allergies: VocabData
  foodDislikes: VocabData
}> {
  try {
    console.log('[Vocab] Loading all vocab data...')

    const [allergies, foodDislikes] = await Promise.all([
      loadAllergies(),
      loadFoodDislikes()
    ])

    console.log('[Vocab] 🎉 All vocab data loaded successfully')

    return {
      allergies,
      foodDislikes
    }

  } catch (error) {
    console.error('[Vocab] ❌ Failed to load all vocab:', error)
    throw error
  }
}

/**
 * 특정 카테고리에서 동의어 검색
 */
export function findSynonymMatches(
  vocabData: VocabData,
  searchTerm: string
): Array<{ key: string; entry: VocabEntry; matchedSynonyms: string[] }> {
  const results: Array<{ key: string; entry: VocabEntry; matchedSynonyms: string[] }> = []
  const normalizedSearch = searchTerm.toLowerCase().trim()

  for (const [key, entry] of Object.entries(vocabData)) {
    const matchedSynonyms = entry.synonyms.filter(synonym =>
      synonym.toLowerCase().includes(normalizedSearch) ||
      normalizedSearch.includes(synonym.toLowerCase())
    )

    if (matchedSynonyms.length > 0) {
      results.push({ key, entry, matchedSynonyms })
    }
  }

  return results
}

/**
 * 키로 직접 vocab 엔트리 찾기
 */
export function getVocabEntry(vocabData: VocabData, key: string): VocabEntry | undefined {
  return vocabData[key]
}

/**
 * 모든 동의어를 평평한 배열로 반환
 */
export function getAllSynonyms(vocabData: VocabData): string[] {
  const allSynonyms: string[] = []

  for (const entry of Object.values(vocabData)) {
    allSynonyms.push(...entry.synonyms)
  }

  return allSynonyms
}

/**
 * 통계 정보 추출
 */
export function getVocabStats(vocabData: VocabData): {
  totalEntries: number
  totalSynonyms: number
  averageSynonymsPerEntry: number
  entriesWithMostSynonyms: { key: string; count: number }
} {
  const entries = Object.entries(vocabData)
  const totalEntries = entries.length

  let totalSynonyms = 0
  let maxSynonyms = 0
  let entryWithMostSynonyms = ''

  for (const [key, entry] of entries) {
    const synonymCount = entry.synonyms.length
    totalSynonyms += synonymCount

    if (synonymCount > maxSynonyms) {
      maxSynonyms = synonymCount
      entryWithMostSynonyms = key
    }
  }

  return {
    totalEntries,
    totalSynonyms,
    averageSynonymsPerEntry: totalEntries > 0 ? totalSynonyms / totalEntries : 0,
    entriesWithMostSynonyms: { key: entryWithMostSynonyms, count: maxSynonyms }
  }
}
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { loadAllergies, loadFoodDislikes, loadAllVocab, findSynonymMatches, getAllSynonyms, getVocabStats, type VocabData } from '../lib/vocab'

// Mock fetch for testing
const mockFetch = (data: any, ok: boolean = true, status: number = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data)
  })
}

// 실제 vocab 데이터 (테스트용)
const mockAllergiesData = {
  peanut: {
    label: '땅콩',
    synonyms: ['땅콩', '피넛', '견과류', '호두', '아몬드']
  },
  shellfish: {
    label: '갑각류',
    synonyms: ['새우', '게', '랍스터', '조개', '굴', '홍합', '전복']
  },
  milk: {
    label: '유제품',
    synonyms: ['우유', '치즈', '버터', '크림', '요거트']
  }
}

const mockFoodDislikesData = {
  spicy: {
    label: '매운 음식',
    synonyms: ['매운', '매콤', '불닭', '고추', '청양고추', '떡볶이']
  },
  greasy: {
    label: '기름진 음식',
    synonyms: ['기름진', '튀김', '느끼한', '돈가스', '삼겹살']
  },
  sweet: {
    label: '단 음식',
    synonyms: ['달달', '달콤', '디저트', '케이크', '초콜릿', '아이스크림']
  }
}

describe('Vocab 유틸리티 테스트', () => {
  describe('loadAllergies', () => {
    it('allergies.ko.json을 성공적으로 로드한다', async () => {
      mockFetch(mockAllergiesData)

      const result = await loadAllergies()

      expect(result).toEqual(mockAllergiesData)
      expect(fetch).toHaveBeenCalledWith('/data/vocab/allergies.ko.json', {
        cache: 'no-store'
      })
    })

    it('파싱 가능한 JSON인지 확인한다', async () => {
      mockFetch(mockAllergiesData)

      const result = await loadAllergies()

      expect(typeof result).toBe('object')
      expect(result).not.toBeNull()
    })

    it('최소한의 키가 존재하는지 확인한다', async () => {
      mockFetch(mockAllergiesData)

      const result = await loadAllergies()

      const keys = Object.keys(result)
      expect(keys.length).toBeGreaterThan(0)
      expect(keys).toContain('peanut')
      expect(keys).toContain('shellfish')
    })

    it('모든 엔트리가 올바른 스키마를 가지는지 확인한다', async () => {
      mockFetch(mockAllergiesData)

      const result = await loadAllergies()

      for (const [key, entry] of Object.entries(result)) {
        expect(entry).toHaveProperty('label')
        expect(entry).toHaveProperty('synonyms')
        expect(typeof entry.label).toBe('string')
        expect(Array.isArray(entry.synonyms)).toBe(true)
        expect(entry.label.length).toBeGreaterThan(0)
        expect(entry.synonyms.length).toBeGreaterThan(0)

        // 모든 synonym이 문자열인지 확인
        entry.synonyms.forEach(synonym => {
          expect(typeof synonym).toBe('string')
          expect(synonym.trim().length).toBeGreaterThan(0)
        })
      }
    })

    it('fetch 실패 시 에러를 던진다', async () => {
      mockFetch({}, false, 404)

      await expect(loadAllergies()).rejects.toThrow('Failed to fetch allergies')
    })
  })

  describe('loadFoodDislikes', () => {
    it('food_dislikes.ko.json을 성공적으로 로드한다', async () => {
      mockFetch(mockFoodDislikesData)

      const result = await loadFoodDislikes()

      expect(result).toEqual(mockFoodDislikesData)
      expect(fetch).toHaveBeenCalledWith('/data/vocab/food_dislikes.ko.json', {
        cache: 'no-store'
      })
    })

    it('모든 엔트리가 올바른 스키마를 가지는지 확인한다', async () => {
      mockFetch(mockFoodDislikesData)

      const result = await loadFoodDislikes()

      for (const [key, entry] of Object.entries(result)) {
        expect(entry).toHaveProperty('label')
        expect(entry).toHaveProperty('synonyms')
        expect(typeof entry.label).toBe('string')
        expect(Array.isArray(entry.synonyms)).toBe(true)
        expect(entry.synonyms.length).toBeGreaterThan(0)
      }
    })
  })

  describe('loadAllVocab', () => {
    it('모든 vocab 데이터를 병렬로 로드한다', async () => {
      // 두 번의 fetch 호출을 모킹
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAllergiesData)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockFoodDislikesData)
        })

      const result = await loadAllVocab()

      expect(result).toHaveProperty('allergies')
      expect(result).toHaveProperty('foodDislikes')
      expect(result.allergies).toEqual(mockAllergiesData)
      expect(result.foodDislikes).toEqual(mockFoodDislikesData)
    })
  })

  describe('중복 검사', () => {
    it('allergies에 중복 synonym이 없는지 확인한다', async () => {
      mockFetch(mockAllergiesData)
      const result = await loadAllergies()

      const allSynonyms = getAllSynonyms(result)
      const normalizedSynonyms = allSynonyms.map(s => s.toLowerCase().trim())
      const uniqueSynonyms = new Set(normalizedSynonyms)

      expect(normalizedSynonyms.length).toBe(uniqueSynonyms.size)
    })

    it('food_dislikes에 중복 synonym이 없는지 확인한다', async () => {
      mockFetch(mockFoodDislikesData)
      const result = await loadFoodDislikes()

      const allSynonyms = getAllSynonyms(result)
      const normalizedSynonyms = allSynonyms.map(s => s.toLowerCase().trim())
      const uniqueSynonyms = new Set(normalizedSynonyms)

      expect(normalizedSynonyms.length).toBe(uniqueSynonyms.size)
    })
  })

  describe('유틸리티 함수들', () => {
    let testData: VocabData

    beforeAll(async () => {
      mockFetch(mockAllergiesData)
      testData = await loadAllergies()
    })

    describe('findSynonymMatches', () => {
      it('정확한 동의어 매칭을 수행한다', () => {
        const matches = findSynonymMatches(testData, '새우')

        expect(matches.length).toBe(1)
        expect(matches[0].key).toBe('shellfish')
        expect(matches[0].matchedSynonyms).toContain('새우')
      })

      it('부분 매칭도 지원한다', () => {
        const matches = findSynonymMatches(testData, '우유')

        expect(matches.length).toBe(1)
        expect(matches[0].key).toBe('milk')
        expect(matches[0].matchedSynonyms).toContain('우유')
      })

      it('대소문자를 무시한다', () => {
        const matches = findSynonymMatches(testData, '땅콩')

        expect(matches.length).toBeGreaterThan(0)
        expect(matches[0].key).toBe('peanut')
      })
    })

    describe('getAllSynonyms', () => {
      it('모든 동의어를 평평한 배열로 반환한다', () => {
        const synonyms = getAllSynonyms(testData)

        expect(Array.isArray(synonyms)).toBe(true)
        expect(synonyms.length).toBeGreaterThan(0)
        expect(synonyms).toContain('땅콩')
        expect(synonyms).toContain('새우')
        expect(synonyms).toContain('우유')
      })
    })

    describe('getVocabStats', () => {
      it('정확한 통계를 반환한다', () => {
        const stats = getVocabStats(testData)

        expect(stats.totalEntries).toBe(3)
        expect(stats.totalSynonyms).toBeGreaterThan(0)
        expect(stats.averageSynonymsPerEntry).toBeGreaterThan(0)
        expect(stats.entriesWithMostSynonyms.key).toBeTruthy()
        expect(stats.entriesWithMostSynonyms.count).toBeGreaterThan(0)
      })
    })
  })
})

import { describe, it, expect } from 'vitest'
import { getRecommendations, mergeWeather, deriveFlags, type PlaceCandidate } from '../lib/recommend'

describe('getRecommendations', () => {
  it('should return up to 5 recommendations with reason and etaMins', async () => {
    const mockPlaces: PlaceCandidate[] = [
      {
        id: 'place1',
        place_name: '테스트 식당',
        category_name: '음식점 > 한식',
        lat: 37.5665,
        lng: 126.978,
        distance: 500,
        categoryPath: ['음식점', '한식']
      }
    ]

    const results = await getRecommendations(mockPlaces, { maxResults: 5 })
    expect(results.length).toBeLessThanOrEqual(5)

    if (results.length > 0) {
      const [result] = results
      expect(result).toHaveProperty('reason')
      expect(result).toHaveProperty('etaMins')
      expect(typeof result.etaMins).toBe('number')
      expect(result.etaMins).toBeGreaterThan(0)
    }
  })

  it('adds category-based tags and badges for leaf matches', async () => {
    const mockPlaces: PlaceCandidate[] = [
      {
        id: 'gukbap-place',
        place_name: '맛있는 국밥',
        category_name: '음식점 > 한식 > 국밥',
        lat: 37.5665,
        lng: 126.978,
        distance: 300,
        categoryPath: ['음식점', '한식', '국밥']
      }
    ]

    const results = await getRecommendations(mockPlaces, { maxResults: 1 })
    expect(results.length).toBe(1);
    const [result] = results;
    expect(result.restaurant.menuTags).toContain('soup');
    expect(result.reason).toContain('업종 기반');
  });

  it('should include weather tokens in reason when weather is provided', async () => {
    const mockPlaces: PlaceCandidate[] = [
      {
        id: 'warm-place',
        place_name: '따뜻한 국밥',
        category_name: '음식점 > 한식 > 국밥',
        lat: 37.5665,
        lng: 126.978,
        distance: 200,
        categoryPath: ['음식점', '한식', '국밥']
      }
    ]

    const results = await getRecommendations(mockPlaces, {
      weather: { wet: true, feels_cold: true },
      maxResults: 1
    })

    expect(results.length).toBe(1)
    const [result] = results
    expect(result.reason).toContain('날씨')
  })

  it('should not apply weather scoring when weather preference is disabled', async () => {
    const mockPlaces: PlaceCandidate[] = [
      {
        id: 'test-place',
        place_name: '테스트 식당',
        category_name: '음식점 > 한식',
        lat: 37.5665,
        lng: 126.978,
        distance: 400,
        categoryPath: ['음식점', '한식']
      }
    ]

    const results = await getRecommendations(mockPlaces, {
      weather: undefined,
      maxResults: 1
    })

    expect(results.length).toBe(1)
    const [result] = results
    expect(result.reason).not.toContain('날씨')
  })
})

describe('deriveFlags', () => {
  it('should correctly identify wet conditions', () => {
    const wetData = { T1H: 15, REH: 60, RN1: 1.0, WSD: 2 }
    const flags = deriveFlags(wetData)
    expect(flags.wet).toBe(true)

    const dryData = { T1H: 15, REH: 60, RN1: 0, WSD: 2 }
    const dryFlags = deriveFlags(dryData)
    expect(dryFlags.wet).toBe(false)
  })

  it('should correctly identify cold conditions', () => {
    const coldData = { T1H: 8, REH: 60, RN1: 0, WSD: 2 }
    const flags = deriveFlags(coldData)
    expect(flags.feels_cold).toBe(true)

    const warmData = { T1H: 20, REH: 60, RN1: 0, WSD: 2 }
    const warmFlags = deriveFlags(warmData)
    expect(warmFlags.feels_cold).toBe(false)
  })

  it('should correctly identify muggy conditions', () => {
    const muggyData = { T1H: 25, REH: 85, RN1: 0, WSD: 1 }
    const flags = deriveFlags(muggyData)
    expect(flags.muggy).toBe(true)

    const dryData = { T1H: 25, REH: 40, RN1: 0, WSD: 1 }
    const dryFlags = deriveFlags(dryData)
    expect(dryFlags.muggy).toBe(false)
  })

  it('should correctly identify clear conditions', () => {
    const clearData = { T1H: 15, REH: 50, RN1: 0, WSD: 2 }
    const flags = deriveFlags(clearData)
    expect(flags.clear).toBe(true)

    const humidData = { T1H: 15, REH: 70, RN1: 0, WSD: 2 }
    const humidFlags = deriveFlags(humidData)
    expect(humidFlags.clear).toBe(false)
  })

  it('should correctly identify temperature extremes', () => {
    const hotData = { T1H: 35, REH: 60, RN1: 0, WSD: 1 }
    const flags = deriveFlags(hotData)
    expect(flags.hot_peak).toBe(true)

    const coldData = { T1H: -5, REH: 60, RN1: 0, WSD: 1 }
    const coldFlags = deriveFlags(coldData)
    expect(coldFlags.cold_min).toBe(true)
  })
})

describe('mergeWeather', () => {
  it('should prioritize live data over ultra and short', () => {
    const live = {
      T1H: 20,
      REH: 65,
      WSD: 2.0,
      RN1: 0
    }

    const ultra = {
      TMP: 18,
      REH: 70,
      WSD: 3.0,
      PCP: 1.0
    }

    const merged = mergeWeather(live, ultra)

    expect(merged.T1H).toBe(20) // From live
    expect(merged.TMP).toBe(18) // From ultra (not in live)
  })

  it('should use ultra data when live is unavailable', () => {
    const ultra = {
      TMP: 18,
      REH: 70,
      WSD: 3.0,
      PCP: 0
    }

    const merged = mergeWeather(undefined, ultra)

    expect(merged.T1H).toBe(18) // From ultra TMP
    expect(merged.REH).toBe(70)
  })

  it('should provide safe defaults when no data is available', () => {
    const merged = mergeWeather()

    expect(merged.T1H).toBe(15)
    expect(merged.REH).toBe(50)
    expect(merged.WSD).toBe(1.5)
    expect(merged.RN1).toBe(0)
  })
})

describe('weather scoring integration', () => {
  it('should apply distance modifier for bad weather', async () => {
    const mockPlaces: PlaceCandidate[] = [
      {
        id: 'soup-place',
        place_name: 'Warm Soup Place',
        category_name: '음식점 > 한식 > 국밥',
        lat: 37.5665,
        lng: 126.9780,
        distance: 300,
        categoryPath: ['음식점', '한식', '국밥']
      },
      {
        id: 'salad-place',
        place_name: 'Cold Salad Place',
        category_name: '음식점 > 양식 > 샐러드',
        lat: 37.5665,
        lng: 126.9780,
        distance: 300,
        categoryPath: ['음식점', '양식', '샐러드']
      }
    ]

    const badWeather = {
      wet: true,
      feels_cold: true,
      muggy: false,
      windy: false,
      clear: false,
      hot_peak: false,
      cold_min: false
    }

    const results = await getRecommendations(mockPlaces, {
      weather: badWeather,
      maxResults: 2
    })

    // Soup place should have weather consideration in reason
    const soupResult = results.find(r => r.restaurant.menuTags.includes('soup'))

    expect(soupResult).toBeDefined()
    if (soupResult) {
      expect(soupResult.reason).toContain('날씨')
    }
  })
})
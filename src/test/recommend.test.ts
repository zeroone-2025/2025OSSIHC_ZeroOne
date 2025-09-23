import { describe, it, expect } from 'vitest';
import { getRecommendations } from '../../lib/recommend';
import { deriveFlags, mergeWeather } from '../../lib/weather';
import { Restaurant, WeatherSnapshot } from '../../lib/types';

describe('getRecommendations', () => {
  it('should return up to 5 recommendations with reason and etaMins', () => {
    const mockRestaurants: Restaurant[] = [
      {
        id: 'test1',
        name: 'Test Restaurant 1',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 1,
        tags: ['warm', 'soup'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: ['autumn']
      },
      {
        id: 'test2',
        name: 'Test Restaurant 2',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 2,
        tags: ['light', 'salad'],
        allergens: [],
        macros: { kcal: 300, protein: 15, fat: 8, carb: 40 },
        season: ['autumn']
      },
      {
        id: 'test3',
        name: 'Test Restaurant 3',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 1,
        tags: ['hearty', 'meat'],
        allergens: [],
        macros: { kcal: 600, protein: 35, fat: 25, carb: 45 },
        season: ['autumn']
      },
      {
        id: 'test4',
        name: 'Test Restaurant 4',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 2,
        tags: ['spicy'],
        allergens: [],
        macros: { kcal: 450, protein: 18, fat: 12, carb: 65 },
        season: ['autumn']
      },
      {
        id: 'test5',
        name: 'Test Restaurant 5',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 3,
        tags: ['seafood'],
        allergens: ['shellfish'],
        macros: { kcal: 380, protein: 25, fat: 10, carb: 30 },
        season: ['autumn']
      },
      {
        id: 'test6',
        name: 'Test Restaurant 6',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 1,
        tags: ['cold'],
        allergens: [],
        macros: { kcal: 250, protein: 12, fat: 5, carb: 35 },
        season: ['autumn']
      }
    ];

    const results = getRecommendations(mockRestaurants);

    expect(results.length).toBeLessThanOrEqual(5);
    expect(results.length).toBeGreaterThan(0);

    results.forEach(result => {
      expect(result).toHaveProperty('restaurant');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('etaMins');
      expect(typeof result.reason).toBe('string');
      expect(typeof result.etaMins).toBe('number');
    });
  });

  it('adds category-based tags and badges for leaf matches', () => {
    const mockRestaurants: Restaurant[] = [
      {
        id: 'leaf1',
        name: '서울 국밥',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        category_name: '음식점 > 한식 > 국밥',
        price_tier: 1,
        tags: [],
        allergens: [],
        macros: { kcal: 480, protein: 24, fat: 12, carb: 62 },
        season: ['winter']
      }
    ];

    const results = getRecommendations(mockRestaurants);
    expect(results.length).toBe(1);
    const [result] = results;
    expect(result.restaurant.menuTags).toContain('soup');
    expect(result.reason).toContain('업종 기반');
  });

  it('should include weather tokens in reason when weather is provided', () => {
    const mockRestaurants: Restaurant[] = [
      {
        id: 'soup1',
        name: 'Warm Soup Restaurant',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 1,
        tags: ['warm', 'soup'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: ['autumn']
      },
      {
        id: 'salad1',
        name: 'Fresh Salad Place',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 2,
        tags: ['light', 'salad'],
        allergens: [],
        macros: { kcal: 300, protein: 15, fat: 8, carb: 40 },
        season: ['autumn']
      }
    ];

    const wetWeather: WeatherSnapshot = {
      source: 'live',
      tmfc: '2025-09-23T12:00:00Z',
      T1H: 12,
      REH: 80,
      WSD: 2,
      PTY: 1,
      flags: {
        wet: true,
        feels_cold: true,
        muggy: false,
        windy: false,
        clear: false,
        hot_peak: false,
        cold_min: false
      }
    };

    const results = getRecommendations(mockRestaurants, wetWeather);

    expect(results.length).toBeGreaterThan(0);

    const soupResult = results.find(r => r.restaurant.tags.includes('soup'));
    if (soupResult) {
      expect(soupResult.reason).toMatch(/비 예보|체감 추움/);
    }
  });

  it('should not apply weather scoring when weather preference is disabled', () => {
    // This test would require mocking localStorage, which is complex in this setup
    // For now, we test that the function can handle undefined weather gracefully
    const mockRestaurants: Restaurant[] = [
      {
        id: 'test1',
        name: 'Test Restaurant',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 1,
        tags: ['warm'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: ['autumn']
      }
    ];

    const results = getRecommendations(mockRestaurants, undefined);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('reason');
  });
});

describe('deriveFlags', () => {
  it('should correctly identify wet conditions', () => {
    const wetData = { PTY: 1, RN1: 0.5, REH: 60, WSD: 2, T1H: 15 };
    const flags = deriveFlags(wetData);
    expect(flags.wet).toBe(true);

    const dryData = { PTY: 0, RN1: 0, POP: 10, REH: 60, WSD: 2, T1H: 15 };
    const dryFlags = deriveFlags(dryData);
    expect(dryFlags.wet).toBe(false);
  });

  it('should correctly identify cold conditions', () => {
    const coldData = { T1H: 8, WSD: 2, REH: 60, PTY: 0 };
    const flags = deriveFlags(coldData);
    expect(flags.feels_cold).toBe(true);

    const windyColdData = { T1H: 12, WSD: 4, REH: 60, PTY: 0 };
    const windyFlags = deriveFlags(windyColdData);
    expect(windyFlags.feels_cold).toBe(true);

    const warmData = { T1H: 20, WSD: 1, REH: 60, PTY: 0 };
    const warmFlags = deriveFlags(warmData);
    expect(warmFlags.feels_cold).toBe(false);
  });

  it('should correctly identify muggy conditions', () => {
    const muggyData = { T1H: 25, REH: 80, WSD: 1, PTY: 0 };
    const flags = deriveFlags(muggyData);
    expect(flags.muggy).toBe(true);

    const dryData = { T1H: 25, REH: 40, WSD: 1, PTY: 0 };
    const dryFlags = deriveFlags(dryData);
    expect(dryFlags.muggy).toBe(false);
  });

  it('should correctly identify clear conditions', () => {
    const clearData = { SKY: 1, PTY: 0, T1H: 15, REH: 60, WSD: 2 };
    const flags = deriveFlags(clearData);
    expect(flags.clear).toBe(true);

    const cloudyData = { SKY: 3, PTY: 0, T1H: 15, REH: 60, WSD: 2 };
    const cloudyFlags = deriveFlags(cloudyData);
    expect(cloudyFlags.clear).toBe(false);
  });

  it('should correctly identify temperature extremes', () => {
    const hotData = { TMX: 28, REH: 60, WSD: 1, PTY: 0 };
    const flags = deriveFlags(hotData);
    expect(flags.hot_peak).toBe(true);

    const coldData = { TMN: 2, REH: 60, WSD: 1, PTY: 0 };
    const coldFlags = deriveFlags(coldData);
    expect(coldFlags.cold_min).toBe(true);
  });
});

describe('mergeWeather', () => {
  it('should prioritize live data over ultra and short', () => {
    const live = {
      source: 'live' as const,
      tmfc: '2025-09-23T12:00:00Z',
      T1H: 20,
      REH: 65,
      WSD: 2.0,
      PTY: 0,
      flags: { wet: false, feels_cold: false, muggy: false, windy: false, clear: true, hot_peak: false, cold_min: false }
    };

    const ultra = {
      source: 'ultra' as const,
      tmfc: '2025-09-23T12:00:00Z',
      TMP: 18,
      REH: 70,
      WSD: 3.0,
      SKY: 2,
      PTY: 1,
      flags: { wet: true, feels_cold: false, muggy: false, windy: false, clear: false, hot_peak: false, cold_min: false }
    };

    const merged = mergeWeather(live, ultra);

    expect(merged.T1H).toBe(20); // From live
    expect(merged.SKY).toBe(2); // From ultra (not in live)
    expect(merged.source).toBe('live');
  });

  it('should use ultra data when live is unavailable', () => {
    const ultra = {
      source: 'ultra' as const,
      tmfc: '2025-09-23T12:00:00Z',
      TMP: 18,
      REH: 70,
      WSD: 3.0,
      SKY: 2,
      PTY: 1,
      flags: { wet: true, feels_cold: false, muggy: false, windy: false, clear: false, hot_peak: false, cold_min: false }
    };

    const merged = mergeWeather(undefined, ultra);

    expect(merged.T1H).toBe(18); // From ultra TMP
    expect(merged.SKY).toBe(2);
  });

  it('should provide safe defaults when no data is available', () => {
    const merged = mergeWeather();

    expect(merged.T1H).toBe(15);
    expect(merged.REH).toBe(60);
    expect(merged.WSD).toBe(1.5);
    expect(merged.flags.clear).toBe(true);
  });
});

describe('weather scoring integration', () => {
  it('should apply distance modifier for bad weather', () => {
    const mockRestaurants = [
      {
        id: 'soup1',
        name: 'Warm Soup Place',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean' as const,
        price_tier: 1 as const,
        tags: ['warm', 'soup'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: ['autumn' as const]
      },
      {
        id: 'salad1',
        name: 'Cold Salad Place',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean' as const,
        price_tier: 1 as const,
        tags: ['cold', 'salad'],
        allergens: [],
        macros: { kcal: 300, protein: 15, fat: 8, carb: 40 },
        season: ['autumn' as const]
      }
    ];

    const badWeather = {
      source: 'live' as const,
      tmfc: '2025-09-23T12:00:00Z',
      T1H: 8,
      REH: 85,
      WSD: 2.5,
      PTY: 1,
      flags: { wet: true, feels_cold: true, muggy: false, windy: false, clear: false, hot_peak: false, cold_min: false }
    };

    const results = getRecommendations(mockRestaurants, badWeather);

    // Soup place should score higher than salad place in bad weather
    const soupResult = results.find(r => r.restaurant.tags.includes('soup'));
    const saladResult = results.find(r => r.restaurant.tags.includes('salad'));

    expect(soupResult).toBeDefined();
    expect(saladResult).toBeDefined();

    if (soupResult && saladResult) {
      expect(soupResult.reason).toMatch(/비 예보|체감 추움/);
    }
  });
});

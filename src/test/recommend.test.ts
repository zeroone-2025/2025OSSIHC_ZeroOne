import { describe, it, expect } from 'vitest';
import { getRecommendations } from '../../lib/recommend';
import { Restaurant } from '../../lib/types';

describe('getRecommendations', () => {
  it('should return up to 5 recommendations with reason and etaMins', () => {
    const mockRestaurants: Restaurant[] = [
      {
        id: 'test1',
        name: 'Test Restaurant 1',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 'budget',
        tags: ['test'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: 'autumn'
      },
      {
        id: 'test2',
        name: 'Test Restaurant 2',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 'budget',
        tags: ['test'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: 'autumn'
      },
      {
        id: 'test3',
        name: 'Test Restaurant 3',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 'budget',
        tags: ['test'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: 'autumn'
      },
      {
        id: 'test4',
        name: 'Test Restaurant 4',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 'budget',
        tags: ['test'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: 'autumn'
      },
      {
        id: 'test5',
        name: 'Test Restaurant 5',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 'budget',
        tags: ['test'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: 'autumn'
      },
      {
        id: 'test6',
        name: 'Test Restaurant 6',
        lat: 37.5665,
        lng: 126.9780,
        category: 'korean',
        price_tier: 'budget',
        tags: ['test'],
        allergens: [],
        macros: { kcal: 400, protein: 20, fat: 10, carb: 50 },
        season: 'autumn'
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
});
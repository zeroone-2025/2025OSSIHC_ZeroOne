import { Restaurant, RecommendationResult } from './types';
import { getRecentRestaurantIds } from './store';

export function getRecommendations(restaurants: Restaurant[]): RecommendationResult[] {
  const recentIds = getRecentRestaurantIds(7);
  const available = restaurants.filter(r => !recentIds.includes(r.id));

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(5, shuffled.length));

  return selected.map(restaurant => ({
    restaurant,
    reason: "초기 더미 추천",
    etaMins: 5
  }));
}
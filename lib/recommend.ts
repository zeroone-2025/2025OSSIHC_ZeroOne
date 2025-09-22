import { Restaurant, RecommendationResult, WeatherSnapshot, Pref } from './types';
import { getRecentRestaurantIds, getPreferences } from './store';

interface ScoredRestaurant {
  restaurant: Restaurant;
  score: number;
  reasons: string[];
}

export function getRecommendations(
  restaurants: Restaurant[],
  weather?: WeatherSnapshot,
  config?: any
): RecommendationResult[] {
  const recentIds = getRecentRestaurantIds(7);
  const available = restaurants.filter(r => !recentIds.includes(r.id));
  const prefs = getPreferences();

  const weights = config?.weights || {
    distance: 0.20,
    novelty7d: 0.10,
    preference: 0.15,
    nutrition: 0.15,
    weather: 0.25,
    situation: 0.10,
    group: 0.05
  };

  const scored = available.map(restaurant =>
    scoreRestaurant(restaurant, prefs, weather, weights)
  );

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, Math.min(5, scored.length));

  return selected.map(item => ({
    restaurant: item.restaurant,
    reason: item.reasons.join(' · '),
    etaMins: Math.floor(Math.random() * 10) + 3
  }));
}

function scoreRestaurant(
  restaurant: Restaurant,
  prefs: Pref,
  weather?: WeatherSnapshot,
  weights?: any
): ScoredRestaurant {
  let score = 0;
  const reasons: string[] = [];

  // Base score
  score += 0.5;

  // Distance score (simplified - all restaurants are close)
  let distanceScore = 0.8;
  let distanceModifier = 1.0;

  // Weather score (calculate early to get distance modifier)
  if (weather && prefs.weather) {
    const weatherResult = calculateWeatherScore(restaurant, weather);
    score += weatherResult.score * (weights?.weather || 0.25);
    distanceModifier = weatherResult.distanceModifier;
    if (weatherResult.reasons.length > 0) {
      reasons.push(...weatherResult.reasons);
    }
  }

  // Apply weather modifier to distance
  distanceScore *= distanceModifier;
  score += distanceScore * (weights?.distance || 0.20);
  if (distanceScore > 0.7) reasons.push('가까운 거리');

  // Novelty score (already handled by filtering recent visits)
  const noveltyScore = 1.0;
  score += noveltyScore * (weights?.novelty7d || 0.10);
  if (noveltyScore > 0.8) reasons.push('7일 미섭취');

  // Preference score
  const prefScore = calculatePreferenceScore(restaurant, prefs);
  score += prefScore * (weights?.preference || 0.15);
  if (prefScore > 0.7) {
    if (prefs.mode === 'heavy' && restaurant.macros.protein > 25) {
      reasons.push('단백질');
    }
    if (prefs.mode === 'light' && restaurant.macros.kcal < 400) {
      reasons.push('가벼운');
    }
  }

  // Nutrition score (based on mode and macros)
  const nutritionScore = calculateNutritionScore(restaurant, prefs);
  score += nutritionScore * (weights?.nutrition || 0.15);

  // Situation score (placeholder for future expansion)
  const situationScore = 0.5; // neutral
  score += situationScore * (weights?.situation || 0.10);

  // Group score (based on group size)
  const groupScore = Math.min(1.0, 1.0 / Math.max(1, prefs.groupSize - 1));
  score += groupScore * (weights?.group || 0.05);

  return { restaurant, score, reasons };
}

function calculatePreferenceScore(restaurant: Restaurant, prefs: Pref): number {
  let score = 0.5;

  // Check allergies
  const hasAllergen = restaurant.allergens.some(allergen =>
    prefs.allergies.includes(allergen)
  );
  if (hasAllergen) return 0;

  // Check dislikes
  const hasDislike = restaurant.tags.some(tag =>
    prefs.dislikes.includes(tag)
  );
  if (hasDislike) score -= 0.3;

  // Mode preference
  if (prefs.mode === 'light') {
    if (restaurant.macros.kcal < 400) score += 0.3;
    if (restaurant.tags.includes('light') || restaurant.tags.includes('salad')) score += 0.2;
  } else {
    if (restaurant.macros.protein > 25) score += 0.3;
    if (restaurant.tags.includes('hearty') || restaurant.tags.includes('meat')) score += 0.2;
  }

  return Math.max(0, Math.min(1, score));
}

function calculateNutritionScore(restaurant: Restaurant, prefs: Pref): number {
  let score = 0.5;

  const { macros } = restaurant;

  if (prefs.mode === 'light') {
    // Prefer lower calorie, balanced nutrition
    if (macros.kcal < 400) score += 0.3;
    if (macros.protein >= 15 && macros.protein <= 25) score += 0.2;
  } else {
    // Prefer higher protein, substantial meals
    if (macros.protein > 25) score += 0.3;
    if (macros.kcal > 500) score += 0.2;
  }

  return Math.max(0, Math.min(1, score));
}

function calculateWeatherScore(restaurant: Restaurant, weather: WeatherSnapshot): {
  score: number;
  reasons: string[];
  distanceModifier: number;
} {
  let score = 0.0;
  const reasons: string[] = [];
  let distanceModifier = 1.0;

  const { flags } = weather;

  // Wet or cold weather preferences
  if (flags.wet || flags.feels_cold) {
    if (restaurant.tags.includes('warm') || restaurant.tags.includes('soup')) {
      score += 0.5;
      distanceModifier = 0.85; // Prefer closer places in bad weather
      if (flags.wet) reasons.push('비 예보');
      if (flags.feels_cold) reasons.push('체감 추움');
    } else if (restaurant.tags.includes('salad') || restaurant.tags.includes('cold')) {
      score -= 0.3; // Penalize cold foods in bad weather
    }
  }

  // Muggy weather preferences
  if (flags.muggy) {
    if (restaurant.tags.includes('salad') || restaurant.tags.includes('cold') || restaurant.tags.includes('light')) {
      score += 0.4;
      reasons.push('후덥지근');
    }
  }

  // Clear weather preferences (10-20°C range)
  if (flags.clear) {
    const temp = weather.T1H || weather.TMP || 15;
    if (temp >= 10 && temp <= 20) {
      if (restaurant.tags.includes('light')) {
        score += 0.2;
        reasons.push('맑음');
      }
    }
  }

  // Windy weather
  if (flags.windy) {
    distanceModifier = 0.9; // Slightly prefer closer places
    reasons.push('강풍');
  }

  // Temperature extremes
  if (flags.hot_peak) {
    if (restaurant.tags.includes('cold') || restaurant.tags.includes('salad')) {
      score += 0.2;
      reasons.push('최고↑');
    }
  }

  if (flags.cold_min) {
    if (restaurant.tags.includes('warm') || restaurant.tags.includes('soup')) {
      score += 0.2;
      reasons.push('최저↓');
    }
  }

  // Clamp to [-1, +1] then normalize to [0, 1]
  const clampedScore = Math.max(-1, Math.min(1, score));
  const normalizedScore = (clampedScore + 1) / 2;

  return {
    score: normalizedScore,
    reasons,
    distanceModifier
  };
}
import { Restaurant } from '@/types/food';

export interface RestaurantCandidate extends Restaurant {
  distanceM: number;
  etaMins: number;
  weather: string;
  nutritionScore: number;
  dislikeScore: number;
  novelty: number;
  groupFit: number;
  hasAllergy: boolean;
}

export interface ScoringContext {
  weatherCondition: string;
  userPreferences: any;
}

export interface ScoringConfig {
  distanceWeight: number;
  etaWeight: number;
  weatherWeight: number;
  nutritionWeight: number;
  noveltyWeight: number;
  groupFitWeight: number;
}

export function scoreCandidate(
  candidate: RestaurantCandidate,
  context: ScoringContext,
  config: ScoringConfig
): number {
  if (candidate.hasAllergy) {
    return -1;
  }

  const maxDistance = 2000;
  const maxEta = 30;

  const normalizedDistance = Math.max(0, 1 - candidate.distanceM / maxDistance);
  const normalizedEta = Math.max(0, 1 - candidate.etaMins / maxEta);

  let weatherBonus = 0;
  if (context.weatherCondition === 'rain' && candidate.weather === 'warm') {
    weatherBonus = 0.2;
  }

  const score = (
    normalizedDistance * config.distanceWeight +
    normalizedEta * config.etaWeight +
    (candidate.nutritionScore / 100) * config.nutritionWeight +
    (1 - candidate.dislikeScore / 100) * config.nutritionWeight +
    candidate.novelty * config.noveltyWeight +
    candidate.groupFit * config.groupFitWeight +
    weatherBonus * config.weatherWeight
  );

  return Math.max(0, Math.min(1, score));
}
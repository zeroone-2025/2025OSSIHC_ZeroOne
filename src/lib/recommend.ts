import { Restaurant } from '@/types/food';
import { UserProfile } from '@/types/profile';
import { loadCategoryMap, loadRestaurants } from './data';
import { isEdible } from './filter';
import { getMultipleEtas } from './eta-kakao';
import { scoreCandidate, RestaurantCandidate, ScoringContext, ScoringConfig } from './score';

interface Location {
  lat: number;
  lng: number;
}

interface WeatherSnapshot {
  condition: string;
  temperature: number;
}

function haversineDistance(loc1: Location, loc2: Location): number {
  const R = 6371000;
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function recommendRestaurants(
  menu: string,
  profile: UserProfile,
  weather: WeatherSnapshot,
  userLoc: Location,
  etaThresholdMins: number = 20,
  maxResults: number = 10
): Promise<Restaurant[]> {
  try {
    const categoryMap = await loadCategoryMap();
    const category = categoryMap[menu];

    if (!category) {
      console.warn(`No category found for menu: ${menu}`);
      return [];
    }

    const allRestaurants = await loadRestaurants();

    const categoryRestaurants = allRestaurants.filter(restaurant =>
      restaurant.categories.includes(category)
    );

    const edibleRestaurants = categoryRestaurants.filter(restaurant =>
      isEdible(menu, restaurant, profile)
    );

    if (edibleRestaurants.length === 0) {
      return [];
    }

    const distances = edibleRestaurants.map(restaurant =>
      haversineDistance(userLoc, restaurant)
    );

    const locations = edibleRestaurants.map(r => ({ lat: r.lat, lng: r.lng }));
    const etaTimes = await getMultipleEtas(userLoc, locations);

    const candidates: RestaurantCandidate[] = edibleRestaurants
      .map((restaurant, index) => ({
        ...restaurant,
        distanceM: distances[index],
        etaMins: etaTimes[index],
        weather: 'warm',
        nutritionScore: Math.random() * 100,
        dislikeScore: Math.random() * 30,
        novelty: Math.random(),
        groupFit: Math.random(),
        hasAllergy: false
      }))
      .filter(candidate => candidate.etaMins <= etaThresholdMins);

    const scoringContext: ScoringContext = {
      weatherCondition: weather.condition,
      userPreferences: {}
    };

    const scoringConfig: ScoringConfig = {
      distanceWeight: 0.3,
      etaWeight: 0.3,
      weatherWeight: 0.1,
      nutritionWeight: 0.15,
      noveltyWeight: 0.1,
      groupFitWeight: 0.05
    };

    const scoredCandidates = candidates.map(candidate => ({
      candidate,
      score: scoreCandidate(candidate, scoringContext, scoringConfig)
    }));

    scoredCandidates.sort((a, b) => b.score - a.score);

    return scoredCandidates
      .slice(0, maxResults)
      .map(item => item.candidate);

  } catch (error) {
    console.error('Failed to recommend restaurants:', error);
    throw error;
  }
}
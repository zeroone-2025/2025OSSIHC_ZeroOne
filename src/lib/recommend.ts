import { Restaurant } from '@/types/food';
import { UserProfile } from '@/types/profile';
import type { WeatherSnapshot, Location, Candidate, ScoringConfig, WeatherFactors } from '@/../types/recommendation';
import { loadCategoryMap, loadRestaurants } from './data';
import { getMultipleEtas } from './eta-kakao';
import { defaultCfg } from './scoring-config';
import { isMenuFiltered } from './filters';
import { mapMaxPriceToTier, mapTimePressure, mapMealFeel, type TimePressure } from './mapping';

interface SessionContext {
  maxPrice?: number;
  timePressure?: TimePressure;
  mealFeel?: string[];
}

function clip(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeWeather(weather: WeatherSnapshot, cfg: ScoringConfig): WeatherFactors {
  const temp = weather.T1H ?? weather.TMP ?? weather.temperature ?? 15;
  const tempDiff = Math.abs(temp - cfg.temp_comfort_c);
  const temp_factor = Math.max(0, 1 - tempDiff / cfg.temp_span);

  const toNum = (v: unknown): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isNaN(n) ? 0 : n;
    }
    return 0;
  };

  const rn1 = toNum(weather.RN1);
  const pcp = toNum(weather.PCP);
  const rain = Math.max(rn1, pcp);
  const rain_factor = clip(rain / cfg.rain_norm_mmph, 0, 0.8);

  const humidity = weather.REH ?? 50;
  const humidity_factor = clip((humidity - 40) / 40, 0, 1);

  const windSpeed = weather.WSD ?? 1.5;
  const wind_factor = clip(windSpeed / 10, 0, 1);

  return {
    temp_factor,
    rain_factor,
    wind_factor,
    humidity_factor
  };
}

function computeWeights(weatherFactors: WeatherFactors, cfg: ScoringConfig, sessionCtx: SessionContext) {
  const baseWeights = { ...cfg.weights };

  const alpha_r = weatherFactors.rain_factor;

  // Apply rain boost to distance and eta
  baseWeights.distance *= (1 + alpha_r * cfg.rain_boost.distance);
  baseWeights.eta *= (1 + alpha_r * cfg.rain_boost.eta);

  // Apply time pressure scaling
  if (sessionCtx.timePressure) {
    const timeScales = mapTimePressure(sessionCtx.timePressure);
    baseWeights.distance *= timeScales.distScale;
    baseWeights.eta *= timeScales.etaScale;
  }

  // Apply meal feel adjustments
  if (sessionCtx.mealFeel && sessionCtx.mealFeel.length > 0) {
    const mood = mapMealFeel(sessionCtx.mealFeel);
    if (mood.novelty > 0) {
      baseWeights.novelty *= 1.5; // Boost novelty weight
    }
  }

  const totalWeight = Object.values(baseWeights).reduce((sum, w) => sum + w, 0);

  const normalizedWeights = {} as typeof baseWeights;
  for (const [key, weight] of Object.entries(baseWeights)) {
    normalizedWeights[key as keyof typeof baseWeights] = weight / totalWeight;
  }

  return normalizedWeights;
}

function scoreCandidate(
  candidate: Candidate,
  weatherFactors: WeatherFactors,
  weights: ReturnType<typeof computeWeights>,
  cfg: ScoringConfig,
  sessionCtx: SessionContext
): number {
  if (candidate.hasAllergy || candidate.ingredientBanHit) {
    return -Infinity;
  }

  const R = cfg.radius_m;
  const E = cfg.eta_limit_min;

  const fd = Math.max(0, 1 - candidate.distance / R);
  const fe = Math.max(0, 1 - candidate.eta / E);

  const weatherTerm = (
    weatherFactors.temp_factor * 0.4 +
    (1 - weatherFactors.rain_factor) * 0.3 +
    (1 - weatherFactors.wind_factor) * 0.2 +
    (1 - weatherFactors.humidity_factor) * 0.1
  );

  let tagBonus = 0;
  const warmTags = ['국물', '따뜻함', '뜨거움'];

  // Weather-based tag bonus
  if (weatherFactors.rain_factor > 0.1 && candidate.tags.some(tag => warmTags.includes(tag))) {
    tagBonus += weatherFactors.rain_factor * cfg.rain_boost.warm_tag;
  }

  // Mood-based tag bonus
  if (sessionCtx.mealFeel && sessionCtx.mealFeel.length > 0) {
    const mood = mapMealFeel(sessionCtx.mealFeel);
    if (mood.warm > 0 && candidate.tags.some(tag => warmTags.includes(tag))) {
      tagBonus += 0.2; // Warm mood bonus
    }
  }

  const sNut = candidate.nutritionScore / 100;
  const prefOk = candidate.preferenceScore / 100;
  let nov = candidate.noveltyScore;
  const grp = candidate.groupFitScore;

  // Apply meal feel adjustments to novelty
  if (sessionCtx.mealFeel && sessionCtx.mealFeel.length > 0) {
    const mood = mapMealFeel(sessionCtx.mealFeel);
    if (mood.novelty > 0) {
      nov *= 1.5; // Boost novelty for "새로운" choices
    }
  }

  const score = (
    weights.weather * (weatherTerm + tagBonus) +
    weights.distance * fd +
    weights.eta * fe +
    weights.nutrition * sNut +
    weights.pref * prefOk +
    weights.novelty * nov +
    weights.group * grp
  );

  return score;
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
  maxResults: number = 10,
  customConfig?: Partial<ScoringConfig>,
  sessionContext?: SessionContext
): Promise<Restaurant[]> {
  try {
    const cfg = { ...defaultCfg, ...customConfig };
    const sessionCtx = sessionContext || {};

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

    // Apply price tier filtering if budget is set
    let filteredByPrice = categoryRestaurants;
    if (sessionCtx.maxPrice) {
      const maxPriceTier = mapMaxPriceToTier(sessionCtx.maxPrice);
      filteredByPrice = categoryRestaurants.filter(restaurant => {
        const priceTier = restaurant.price_tier || 3; // Default to mid-range if unknown
        return priceTier <= maxPriceTier;
      });
    }

    const edibleRestaurants = filteredByPrice.filter(restaurant => {
      const menuIngredients = restaurant.ingredients?.[menu] || [];
      const menuAllergens: string[] = [];

      return !isMenuFiltered(profile, menuAllergens, menuIngredients);
    });

    if (edibleRestaurants.length === 0) {
      return [];
    }

    const distances = edibleRestaurants.map(restaurant =>
      haversineDistance(userLoc, restaurant)
    );

    const locations = edibleRestaurants.map(r => ({ lat: r.lat, lng: r.lng }));
    const etaTimes = await getMultipleEtas(userLoc, locations);

    const candidates: Candidate[] = edibleRestaurants
      .map((restaurant, index) => {
        const menuIngredients = restaurant.ingredients?.[menu] || [];
        const menuAllergens: string[] = [];

        return {
          id: restaurant.id,
          name: restaurant.name,
          category: restaurant.categories[0] || 'unknown',
          lat: restaurant.lat,
          lng: restaurant.lng,
          distance: distances[index],
          eta: etaTimes[index],
          hasAllergy: false,
          ingredientBanHit: isMenuFiltered(profile, menuAllergens, menuIngredients),
          nutritionScore: Math.random() * 100,
          preferenceScore: Math.random() * 100,
          noveltyScore: Math.random(),
          groupFitScore: Math.random(),
          priceTier: Math.floor(Math.random() * 5) + 1,
          tags: ['국물', '따뜻함']
        } as Candidate;
      })
      .filter(candidate => candidate.eta <= etaThresholdMins);

    const weatherFactors = normalizeWeather(weather, cfg);
    const weights = computeWeights(weatherFactors, cfg, sessionCtx);

    const scoredCandidates = candidates.map(candidate => ({
      candidate,
      score: scoreCandidate(candidate, weatherFactors, weights, cfg, sessionCtx)
    }));

    scoredCandidates.sort((a, b) => b.score - a.score);

    return scoredCandidates
      .slice(0, maxResults)
      .map(item => {
        const restaurant = edibleRestaurants.find(r => r.id === item.candidate.id);
        return restaurant!;
      });

  } catch (error) {
    console.error('Failed to recommend restaurants:', error);
    throw error;
  }
}
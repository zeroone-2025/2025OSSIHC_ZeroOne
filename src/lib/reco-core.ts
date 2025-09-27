import { dataset, type Dish, type DishWithScore } from './dataset';

export interface WeatherContext {
  temperature: number;
  humidity: number;
  windSpeed: number;
  skyCondition: 1 | 3 | 4; // 1: clear, 3: mostly cloudy, 4: overcast
  precipitationType: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // 0: none, 1,4,5: rain, 2: sleet, 3,6,7: snow
  precipitationAmount: number; // mm/h
  snowAmount: number; // cm/h
}

export interface WeatherFlags {
  cold: number; // 0-1
  hot: number; // 0-1
  rainy: number; // 0-1
  snowy: number; // 0-1
  humid: number; // 0-1
  windy: number; // 0-1
  gloom: number; // 0-1
  sunny: number; // 0-1
  cloudy: number; // 0-1
}

export function getAutumnFallback(): WeatherContext {
  return {
    temperature: 18,
    humidity: 55,
    windSpeed: 3,
    skyCondition: 3,
    precipitationType: 0,
    precipitationAmount: 0,
    snowAmount: 0
  };
}

export function deriveFlags(weather: WeatherContext): WeatherFlags {
  const { temperature, humidity, windSpeed, skyCondition, precipitationType, precipitationAmount, snowAmount } = weather;

  // Temperature flags
  const cold = temperature <= 10 ? 1 : temperature < 22 ? (22 - temperature) / 12 : 0;
  const hot = temperature >= 28 ? 1 : temperature >= 22 ? (temperature - 22) / 6 : 0;

  // Sky condition flags
  const sunny = skyCondition === 1 ? 1 : 0;
  const cloudy = skyCondition === 3 ? 1 : skyCondition === 4 ? 0.5 : 0;
  const gloom = skyCondition === 4 ? 1 : skyCondition === 3 ? 0.5 : 0;

  // Precipitation flags
  let rainy = 0, snowy = 0;
  if ([1, 4, 5].includes(precipitationType)) {
    rainy = precipitationAmount < 1 ? 0.4 : precipitationAmount <= 5 ? 0.8 : 1;
  } else if ([3, 6, 7].includes(precipitationType)) {
    snowy = snowAmount < 0.5 ? 0.3 : snowAmount <= 2 ? 0.7 : 1;
  } else if (precipitationType === 2) { // sleet
    if (temperature > 1) {
      rainy = precipitationAmount < 1 ? 0.4 : precipitationAmount <= 5 ? 0.8 : 1;
    } else {
      snowy = snowAmount < 0.5 ? 0.3 : snowAmount <= 2 ? 0.7 : 1;
    }
  }

  // Other flags
  const humid = humidity < 60 ? 0 : humidity <= 90 ? (humidity - 60) / 30 : 1;
  const windy = windSpeed < 4 ? 0 : windSpeed <= 9 ? 0.3 : windSpeed <= 14 ? 0.7 : 1;

  // Clamp all values to 0-1
  return {
    cold: Math.max(0, Math.min(1, cold)),
    hot: Math.max(0, Math.min(1, hot)),
    rainy: Math.max(0, Math.min(1, rainy)),
    snowy: Math.max(0, Math.min(1, snowy)),
    humid: Math.max(0, Math.min(1, humid)),
    windy: Math.max(0, Math.min(1, windy)),
    gloom: Math.max(0, Math.min(1, gloom)),
    sunny: Math.max(0, Math.min(1, sunny)),
    cloudy: Math.max(0, Math.min(1, cloudy))
  };
}

export function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export function scoreDish(dish: Dish, flags: WeatherFlags, season: string = getCurrentSeason()): number {
  const { weights } = dish;

  // Weather score (most important)
  const weatherScore =
    weights.weather.sunny * flags.sunny +
    weights.weather.cloudy * flags.cloudy +
    weights.weather.rainy * flags.rainy +
    weights.weather.snowy * flags.snowy +
    weights.weather.temperature * (flags.hot - flags.cold + 1) / 2 + // normalize -1 to 1 range to 0 to 1
    weights.weather.humidity * flags.humid +
    weights.weather.wind * flags.windy;

  // Season score
  const seasonScore = weights.season[season as keyof typeof weights.season] || 0.5;

  // Day score (assume weekday for now)
  const dayScore = weights.day.weekday;

  // Mood score (neutral default)
  const moodScore = weights.mood.calm;

  // Weighted combination
  const finalScore =
    weatherScore * 0.6 +
    seasonScore * 0.25 +
    dayScore * 0.1 +
    moodScore * 0.05;

  return Math.max(0, Math.min(1, finalScore));
}

export function rankDishes(weather: WeatherContext, topN: number = 5): DishWithScore[] {
  const flags = deriveFlags(weather);
  const season = getCurrentSeason();

  const scoredDishes: DishWithScore[] = dataset.map(dish => ({
    ...dish,
    score: scoreDish(dish, flags, season)
  }));

  return scoredDishes
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
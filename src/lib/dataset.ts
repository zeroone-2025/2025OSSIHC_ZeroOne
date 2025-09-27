import datasetRaw from '@/data/jommechu/jommechu_dataset_v2_full.json';

export interface DishWeights {
  weather: {
    sunny: number;
    cloudy: number;
    rainy: number;
    snowy: number;
    temperature: number;
    humidity: number;
    wind: number;
  };
  season: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
  day: {
    weekday: number;
    weekend: number;
  };
  mood: {
    happy: number;
    sad: number;
    stressed: number;
    calm: number;
    anxious: number;
  };
}

export interface Dish {
  id: string;
  name_ko: string;
  name_en: string;
  category: string;
  average_price_krw: number;
  price_tier: number;
  ingredients: string[];
  allergens: string[];
  tags: string[];
  weights: DishWeights;
}

export interface DishWithScore extends Dish {
  score: number;
}

export const dataset: Dish[] = datasetRaw as Dish[];

export function getDishById(id: string): Dish | undefined {
  return dataset.find(dish => dish.id === id);
}

export function getDishesByCategory(category: string): Dish[] {
  return dataset.filter(dish => dish.category === category);
}

export function searchDishes(query: string): Dish[] {
  const lowerQuery = query.toLowerCase();
  return dataset.filter(dish =>
    dish.name_ko.toLowerCase().includes(lowerQuery) ||
    dish.name_en.toLowerCase().includes(lowerQuery) ||
    dish.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
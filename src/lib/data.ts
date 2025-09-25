import { Restaurant } from '@/types/food';

export async function loadCategoryMap(): Promise<Record<string, string>> {
  const response = await fetch('/data/category_map.ko.json');
  if (!response.ok) {
    throw new Error('Failed to load category mapping');
  }
  return response.json();
}

export async function loadRestaurants(): Promise<Restaurant[]> {
  const response = await fetch('/data/restaurants.ko.json');
  if (!response.ok) {
    throw new Error('Failed to load restaurants');
  }
  return response.json();
}

export function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}
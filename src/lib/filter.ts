import { Restaurant } from '@/types/food';
import { UserProfile } from '@/types/profile';
import { normalize } from './data';

export function isEdible(
  menuName: string,
  restaurant: Restaurant,
  profile: UserProfile
): boolean {
  const menuIngredients = restaurant.ingredients?.[menuName];

  if (!menuIngredients) {
    return true;
  }

  const avoidedIngredients = new Set([
    ...profile.allergies.map(normalize),
    ...profile.avoidIngredients.map(normalize)
  ]);

  for (const ingredient of menuIngredients) {
    if (avoidedIngredients.has(normalize(ingredient))) {
      return false;
    }
  }

  return true;
}
import type { Profile } from '@/../types/recommendation';

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, '');
}

export function hitAllergy(profileAllergies: string[], menuAllergens: string[]): boolean {
  if (!profileAllergies.length || !menuAllergens.length) {
    return false;
  }

  const normalizedAllergies = new Set(profileAllergies.map(normalize));

  return menuAllergens.some(allergen =>
    normalizedAllergies.has(normalize(allergen))
  );
}

export function hitIngredientBan(profileBans: string[], menuIngredients: string[]): boolean {
  if (!profileBans.length || !menuIngredients.length) {
    return false;
  }

  const normalizedBans = new Set(profileBans.map(normalize));

  return menuIngredients.some(ingredient =>
    normalizedBans.has(normalize(ingredient))
  );
}

export function isMenuFiltered(
  profile: Profile,
  menuAllergens: string[],
  menuIngredients: string[]
): boolean {
  const allBannedIngredients = [
    ...profile.avoidIngredients,
    ...(profile.bannedIngredients || [])
  ];

  return hitAllergy(profile.allergies, menuAllergens) ||
         hitIngredientBan(allBannedIngredients, menuIngredients);
}
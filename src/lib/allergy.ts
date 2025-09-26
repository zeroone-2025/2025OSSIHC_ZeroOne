import { forbidFromAllergy as categoryForbidFromAllergy } from './category'

export interface PreferenceShape {
  allergies?: string[]
  dislikes?: string[]
}

/**
 * Check if allergens conflict with restaurant tags
 * Returns true if risky (should be forbidden)
 */
export function forbidFromAllergy(
  allergens: string[],
  tags: string[]
): boolean {
  // Use the category module's logic with preference shape
  const profile: PreferenceShape = { allergies: allergens, dislikes: [] }
  return categoryForbidFromAllergy(profile, tags)
}

/**
 * Enhanced allergen matching with partial string matching
 */
export function hasAllergenConflict(
  userAllergens: string[],
  restaurantTags: string[],
  ingredientList?: string[]
): boolean {
  if (!userAllergens.length) return false

  const normalizedAllergens = userAllergens.map(a => a.toLowerCase().trim())
  const normalizedTags = restaurantTags.map(t => t.toLowerCase().trim())
  const normalizedIngredients = ingredientList?.map(i => i.toLowerCase().trim()) || []

  // Direct tag matching
  for (const allergen of normalizedAllergens) {
    // Check tags
    for (const tag of normalizedTags) {
      if (tag.includes(allergen) || allergen.includes(tag)) {
        return true
      }
    }

    // Check ingredients if provided
    for (const ingredient of normalizedIngredients) {
      if (ingredient.includes(allergen) || allergen.includes(ingredient)) {
        return true
      }
    }
  }

  // Special cases for common allergen mappings
  const shellFishTerms = ['갑각류', 'shellfish', '새우', '게', '조개', '랍스터', 'crab', 'shrimp', 'lobster']
  const nutTerms = ['견과류', 'nuts', '땅콩', 'peanut', '아몬드', 'almond']
  const dairyTerms = ['유제품', 'dairy', '우유', 'milk', '치즈', 'cheese']
  const glutenTerms = ['글루텐', 'gluten', '밀', 'wheat', '밀가루', 'flour']

  const hasShellfish = normalizedAllergens.some(a => shellFishTerms.includes(a))
  const hasNuts = normalizedAllergens.some(a => nutTerms.includes(a))
  const hasDairy = normalizedAllergens.some(a => dairyTerms.includes(a))
  const hasGluten = normalizedAllergens.some(a => glutenTerms.includes(a))

  const allTerms = [...normalizedTags, ...normalizedIngredients]

  if (hasShellfish && allTerms.some(term => shellFishTerms.includes(term))) {
    return true
  }

  if (hasNuts && allTerms.some(term => nutTerms.includes(term))) {
    return true
  }

  if (hasDairy && allTerms.some(term => dairyTerms.includes(term))) {
    return true
  }

  if (hasGluten && allTerms.some(term => glutenTerms.includes(term))) {
    return true
  }

  return false
}
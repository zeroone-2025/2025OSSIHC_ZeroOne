import type { MenuItem } from '@/../types/recommendation';

export function validatePriceTier(averagePrice: number): number {
  if (averagePrice < 8000) return 1;
  if (averagePrice < 12000) return 2;
  if (averagePrice < 20000) return 3;
  if (averagePrice < 35000) return 4;
  return 5;
}

export function loadMenuCatalog(): MenuItem[] {
  try {
    const catalogData = require('@/../public/data/jommechu/jommechu_dataset_v2_full.json');

    return catalogData.map((item: any) => {
      let priceTier = item.price_tier || 1;

      if (item.average_price_krw) {
        const validatedTier = validatePriceTier(item.average_price_krw);
        if (validatedTier !== priceTier) {
          console.warn(`Price tier mismatch for ${item.name}: expected ${validatedTier}, got ${priceTier}`);
          priceTier = validatedTier;
        }
      }

      return {
        id: item.id || `menu_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || '',
        category: item.category || 'unknown',
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
        price_tier: priceTier,
        average_price_krw: item.average_price_krw,
        tags: Array.isArray(item.tags) ? item.tags : []
      } as MenuItem;
    });
  } catch (error) {
    console.error('Failed to load menu catalog:', error);
    throw new Error('Menu catalog is required but could not be loaded');
  }
}
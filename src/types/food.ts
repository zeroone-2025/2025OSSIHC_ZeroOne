export interface MenuItem {
  id: string;
  name: string;
  ingredients: string[];
  allergens?: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  categories: string[];
  category?: string;
  category_name?: string;
  menu: string[];
  ingredients?: Record<string, string[]>;
  distanceM?: number;
  etaMins?: number;
  price_tier?: 1 | 2 | 3 | 4 | 5;
}

export interface IngredientIndex {
  byMenu: Record<string, MenuItem>;
}
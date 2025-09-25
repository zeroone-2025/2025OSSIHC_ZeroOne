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
  menu: string[];
  ingredients?: Record<string, string[]>;
}

export interface IngredientIndex {
  byMenu: Record<string, MenuItem>;
}
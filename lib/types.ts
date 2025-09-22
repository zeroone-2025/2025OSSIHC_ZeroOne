export interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: 'korean' | 'japanese' | 'chinese' | 'vietnamese' | 'indian';
  price_tier: 'budget' | 'mid' | 'premium';
  tags: string[];
  allergens: string[];
  macros: {
    kcal: number;
    protein: number;
    fat: number;
    carb: number;
  };
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface Pref {
  mode: 'light' | 'heavy';
  allergens: string[];
  dislikes: string[];
  groupSize: number;
}

export interface Visit {
  restaurantId: string;
  timestamp: number;
  liked: boolean;
  reason?: string;
}

export interface RecommendationResult {
  restaurant: Restaurant;
  reason: string;
  etaMins: number;
}
export interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: 'korean' | 'japanese' | 'chinese' | 'vietnamese' | 'indian';
  price_tier: 1 | 2 | 3;
  tags: string[];
  allergens: string[];
  macros: {
    kcal: number;
    protein: number;
    fat: number;
    carb: number;
  };
  season: ('spring' | 'summer' | 'autumn' | 'winter')[];
}

export interface Pref {
  mode: 'light' | 'heavy';
  allergies: string[];
  dislikes: string[];
  groupSize: number;
  weather: boolean;
}

export interface Visit {
  restaurantId: string;
  timestamp: number;
  liked: boolean;
  reason?: string;
}

export interface WeatherSnapshot {
  source: 'live' | 'ultra' | 'short';
  tmfc: string;
  tmef?: string;
  T1H?: number;
  TMP?: number;
  REH: number;
  WSD: number;
  SKY?: number;
  PTY: number;
  RN1?: number;
  PCP?: number;
  POP?: number;
  TMX?: number;
  TMN?: number;
  flags: {
    wet: boolean;
    feels_cold: boolean;
    muggy: boolean;
    windy: boolean;
    clear: boolean;
    hot_peak: boolean;
    cold_min: boolean;
  };
}

export interface RecommendationResult {
  restaurant: Restaurant;
  reason: string;
  etaMins: number;
}
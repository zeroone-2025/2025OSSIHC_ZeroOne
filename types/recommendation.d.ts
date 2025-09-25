export interface WeatherSnapshot {
  T1H?: number;
  TMP?: number;
  RN1?: number | string;
  PCP?: number | string;
  WSD?: number;
  REH?: number;
  condition: string;
  temperature: number;
  flags?: {
    hot?: boolean;
    cold?: boolean;
    wet?: boolean;
    windy?: boolean;
    feels_cold?: boolean;
    muggy?: boolean;
    clear?: boolean;
    hot_peak?: boolean;
    cold_min?: boolean;
  };
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Profile {
  allergies: string[];
  avoidIngredients: string[];
  bannedIngredients?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  ingredients: string[];
  allergens: string[];
  price_tier: number;
  average_price_krw?: number;
  tags: string[];
}

export interface Candidate {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
  eta: number;
  hasAllergy: boolean;
  ingredientBanHit: boolean;
  nutritionScore: number;
  preferenceScore: number;
  noveltyScore: number;
  groupFitScore: number;
  priceTier: number;
  tags: string[];
}

export interface ScoringConfig {
  radius_m: number;
  eta_limit_min: number;
  temp_comfort_c: number;
  temp_span: number;
  rain_norm_mmph: number;
  weights: {
    weather: number;
    distance: number;
    eta: number;
    nutrition: number;
    pref: number;
    novelty: number;
    group: number;
  };
  rain_boost: {
    distance: number;
    eta: number;
    warm_tag: number;
  };
}

export interface WeatherFactors {
  temp_factor: number;
  rain_factor: number;
  wind_factor: number;
  humidity_factor: number;
}
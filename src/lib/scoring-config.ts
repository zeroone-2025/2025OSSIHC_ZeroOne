import type { ScoringConfig } from '@/../types/recommendation';

export const defaultCfg: ScoringConfig = {
  radius_m: 900,
  eta_limit_min: 15,
  temp_comfort_c: 22,
  temp_span: 10,
  rain_norm_mmph: 10,
  weights: {
    weather: 0.25,
    distance: 0.20,
    eta: 0.10,
    nutrition: 0.15,
    pref: 0.15,
    novelty: 0.05,
    group: 0.10
  },
  rain_boost: {
    distance: 1.0,
    eta: 0.5,
    warm_tag: 0.3
  }
} as const;
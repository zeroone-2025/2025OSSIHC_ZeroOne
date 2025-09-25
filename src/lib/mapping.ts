export type PriceTier = 1 | 2 | 3 | 4 | 5;
export type TimePressure = 'rush' | 'normal' | 'relaxed';

export interface TimeScales {
  etaScale: number;
  distScale: number;
}

export interface MoodFactors {
  warm: number;
  light: number;
  hearty: number;
  novelty: number;
}

export function mapMaxPriceToTier(price: number): PriceTier {
  if (price < 8000) return 1;
  if (price < 12000) return 2;
  if (price < 20000) return 3;
  if (price < 35000) return 4;
  return 5;
}

export function mapTimePressure(timePressure: TimePressure): TimeScales {
  switch (timePressure) {
    case 'rush':
      return { etaScale: 1.3, distScale: 1.2 };
    case 'normal':
      return { etaScale: 1.0, distScale: 1.0 };
    case 'relaxed':
      return { etaScale: 0.8, distScale: 0.9 };
    default:
      return { etaScale: 1.0, distScale: 1.0 };
  }
}

export function mapMealFeel(selectedOptions: string[]): MoodFactors {
  const factors: MoodFactors = {
    warm: 0,
    light: 0,
    hearty: 0,
    novelty: 0
  };

  for (const option of selectedOptions) {
    const normalized = option.toLowerCase().trim();

    if (normalized.includes('따뜻') || normalized.includes('warm')) {
      factors.warm = 1;
    }
    if (normalized.includes('가볍') || normalized.includes('light')) {
      factors.light = 1;
    }
    if (normalized.includes('든든') || normalized.includes('hearty')) {
      factors.hearty = 1;
    }
    if (normalized.includes('새로') || normalized.includes('novel')) {
      factors.novelty = 1;
    }
  }

  return factors;
}

export function formatPriceTier(tier: PriceTier): string {
  switch (tier) {
    case 1: return '₩8천 미만';
    case 2: return '₩8천~1.2만';
    case 3: return '₩1.2만~2만';
    case 4: return '₩2만~3.5만';
    case 5: return '₩3.5만 이상';
    default: return '가격 미정';
  }
}

export function formatTimePressure(timePressure: TimePressure): string {
  switch (timePressure) {
    case 'rush': return '급함';
    case 'normal': return '보통';
    case 'relaxed': return '여유';
    default: return '시간 미정';
  }
}

export function formatMoodFactors(mood: MoodFactors): string[] {
  const labels: string[] = [];

  if (mood.warm > 0) labels.push('따뜻함');
  if (mood.light > 0) labels.push('가볍게');
  if (mood.hearty > 0) labels.push('든든하게');
  if (mood.novelty > 0) labels.push('새로운 맛');

  return labels;
}
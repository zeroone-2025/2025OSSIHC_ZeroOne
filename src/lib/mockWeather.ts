import kst from './tz';
import dataJson from '@/data/jeonju_hourly_weather_2025-09-26_simple.json' assert { type: 'json' };

export type HourRow = {
  time: string;        // "HH:00"
  temp_c: number;
  humidity_pct: number;
  precip_mm: number;
  wind_ms: number;
  cloud_10: number;
};

const rows: HourRow[] = dataJson as HourRow[];

/** Convert Date -> KST Date without mutating the original */
export function toKST(d: Date): Date {
  return kst(d);
}

/** Format hour like "HH:00" in KST, floor to the hour */
export function kstHourKey(d: Date): string {
  const k = toKST(d);
  const hh = String(k.getHours()).padStart(2, '0');
  return `${hh}:00`;
}

/** Pick the row whose time === floor(KST hour). Fallback to nearest lower hour; if none, use first row */
export function pickKSTHour(now = new Date()): HourRow {
  const key = kstHourKey(now);
  const exact = rows.find(r => r.time === key);
  if (exact) return exact;

  const sorted = [...rows].sort((a, b) => a.time.localeCompare(b.time));
  const candidate = [...sorted].reverse().find(r => r.time <= key);
  return candidate ?? sorted[0];
}

/** Lightweight weights (MVP) derived from row */
export function deriveWeights(r: HourRow) {
  const W_cold = r.temp_c <= 10 ? 1 : r.temp_c < 22 ? (22 - r.temp_c) / 12 : 0;
  const W_hot  = r.temp_c >= 28 ? 1 : r.temp_c >= 22 ? (r.temp_c - 22) / 6 : 0;

  const W_humidity = r.humidity_pct < 60 ? 0 : r.humidity_pct <= 90 ? (r.humidity_pct - 60) / 30 : 1;

  const w = r.wind_ms;
  const W_wind = w < 3.4 ? 0.2 : w < 5.5 ? 0.45 : w < 10.8 ? 0.8 : 1.0;

  let W_sunny = 0; let W_cloudy = 0;
  if (r.cloud_10 <= 2) { W_sunny = 1.0; W_cloudy = 0.1; }
  else if (r.cloud_10 <= 7) { W_sunny = 0.3; W_cloudy = 0.8; }
  else { W_sunny = 0.1; W_cloudy = 1.0; }

  let W_rain = 0; let W_snow = 0;
  if (r.precip_mm > 0) {
    if (r.precip_mm < 1.0) W_rain = 0.4;
    else if (r.precip_mm < 30.0) W_rain = 0.8;
    else if (r.precip_mm < 50.0) W_rain = 0.95;
    else W_rain = 1.0;
  }

  if (W_rain >= 0.3 || W_snow >= 0.3) {
    W_sunny = Math.min(W_sunny, 0.2);
    W_cloudy = Math.max(W_cloudy, 0.8);
  }

  return { W_cold, W_hot, W_humidity, W_wind, W_sunny, W_cloudy, W_rain, W_snow };
}

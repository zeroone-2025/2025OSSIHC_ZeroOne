// MVP helpers to produce stable "autumn" flags & normalize KMA obs to weights.

export type WeatherObs = {
  T1H?: number;    // temp C
  REH?: number;    // humidity %
  WSD?: number;    // wind m/s
  SKY?: 1|3|4;     // sky code
  PTY?: 0|1|2|3|4|5|6|7; // precipitation type
  PCP?: number;    // mm/h
  SNO?: number;    // cm/h
};

export type WeatherFlags = string[];

export function autumnFallback(): { obs: WeatherObs; flags: WeatherFlags } {
  // Early autumn: 18~22C, slight clouds, light breeze, no rain.
  const obs: WeatherObs = {
    T1H: 20,
    REH: 55,
    WSD: 3,
    SKY: 3,
    PTY: 0,
    PCP: 0,
    SNO: 0
  };
  return { obs, flags: flagsFromObs(obs) };
}

export function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

export function weightsFromObs(o: WeatherObs) {
  const t = o.T1H ?? 20;
  const reh = o.REH ?? 55;
  const wsd = o.WSD ?? 3;
  const sky = o.SKY ?? 3;
  const pty = o.PTY ?? 0;
  const pcp = o.PCP ?? 0;
  const sno = o.SNO ?? 0;

  // 1. Temperature
  const W_cold = t <= 10 ? 1 : (t < 22 ? (22 - t) / 12 : 0);
  const W_hot  = t >= 28 ? 1 : (t >= 22 ? (t - 22) / 6 : 0);

  // 2. Sky (1:clear, 3:mostly cloudy, 4:overcast)
  const W_gloom = sky === 1 ? 0 : (sky === 3 ? 0.5 : 1);

  // 3. Precip type
  let W_rain = 0, W_snow = 0;
  if ([1,4,5].includes(pty)) {
    if (pcp < 1) W_rain = 0.4;
    else if (pcp <= 5) W_rain = 0.8;
    else W_rain = 1;
  } else if ([3,6,7].includes(pty)) {
    if (sno < 0.5) W_snow = 0.3;
    else if (sno <= 2) W_snow = 0.7;
    else W_snow = 1;
  } else if (pty === 2) { // sleet
    if (t > 1) {
      if (pcp < 1) W_rain = 0.4;
      else if (pcp <= 5) W_rain = 0.8;
      else W_rain = 1;
    } else {
      if (sno < 0.5) W_snow = 0.3;
      else if (sno <= 2) W_snow = 0.7;
      else W_snow = 1;
    }
  }

  // 4. Humidity
  const W_humid = reh < 60 ? 0 : (reh <= 90 ? (reh - 60) / 30 : 1);

  // 5. Wind
  const W_wind = wsd < 4 ? 0 : (wsd <= 9 ? 0.3 : (wsd <= 14 ? 0.7 : 1));

  return {
    W_cold: clamp01(W_cold),
    W_hot: clamp01(W_hot),
    W_gloom: clamp01(W_gloom),
    W_rain: clamp01(W_rain),
    W_snow: clamp01(W_snow),
    W_humid: clamp01(W_humid),
    W_wind: clamp01(W_wind),
  };
}

export function flagsFromObs(o: WeatherObs): WeatherFlags {
  const w = weightsFromObs(o);
  const flags: string[] = [];
  if (w.W_cold > 0.4) flags.push('cold');
  if (w.W_hot > 0.4) flags.push('hot');
  if (w.W_gloom > 0.4) flags.push('gloom');
  if (w.W_rain > 0.2) flags.push('rain');
  if (w.W_snow > 0.2) flags.push('snow');
  if (w.W_humid > 0.4) flags.push('humid');
  if (w.W_wind > 0.3) flags.push('windy');
  return flags;
}
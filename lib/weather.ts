import { WeatherSnapshot } from './types';

export class MissingWeatherKeyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingWeatherKeyError'
  }
}

const hasWeatherKey = process.env.HAS_WEATHER_KEY === 'true'

export function normalizeLive(apiResponse: any): WeatherSnapshot {
  const item = apiResponse.response?.body?.items?.item?.[0] || {};
  return {
    source: 'live',
    tmfc: new Date().toISOString(),
    T1H: parseFloat(item.T1H) || 15,
    REH: parseFloat(item.REH) || 60,
    WSD: parseFloat(item.WSD) || 1.5,
    SKY: parseInt(item.SKY) || 1,
    PTY: parseInt(item.PTY) || 0,
    RN1: parseFloat(item.RN1) || 0,
    flags: deriveFlags({
      T1H: parseFloat(item.T1H) || 15,
      REH: parseFloat(item.REH) || 60,
      WSD: parseFloat(item.WSD) || 1.5,
      SKY: parseInt(item.SKY) || 1,
      PTY: parseInt(item.PTY) || 0,
      RN1: parseFloat(item.RN1) || 0
    })
  };
}

export function normalizeUltra(apiResponse: any): WeatherSnapshot {
  const item = apiResponse.response?.body?.items?.item?.[0] || {};
  return {
    source: 'ultra',
    tmfc: new Date().toISOString(),
    tmef: item.fcstDate + item.fcstTime,
    TMP: parseFloat(item.TMP) || 15,
    REH: parseFloat(item.REH) || 60,
    WSD: parseFloat(item.WSD) || 1.5,
    SKY: parseInt(item.SKY) || 1,
    PTY: parseInt(item.PTY) || 0,
    PCP: parseFloat(item.PCP) || 0,
    flags: deriveFlags({
      TMP: parseFloat(item.TMP) || 15,
      REH: parseFloat(item.REH) || 60,
      WSD: parseFloat(item.WSD) || 1.5,
      SKY: parseInt(item.SKY) || 1,
      PTY: parseInt(item.PTY) || 0,
      PCP: parseFloat(item.PCP) || 0
    })
  };
}

export function normalizeShort(apiResponse: any): WeatherSnapshot {
  const items = apiResponse.response?.body?.items?.item || [];
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const todayItems = items.filter((item: any) => item.fcstDate === today);
  const tmpItem = todayItems.find((item: any) => item.category === 'TMP');
  const rehItem = todayItems.find((item: any) => item.category === 'REH');
  const wsdItem = todayItems.find((item: any) => item.category === 'WSD');
  const skyItem = todayItems.find((item: any) => item.category === 'SKY');
  const ptyItem = todayItems.find((item: any) => item.category === 'PTY');
  const popItem = todayItems.find((item: any) => item.category === 'POP');
  const tmxItem = todayItems.find((item: any) => item.category === 'TMX');
  const tmnItem = todayItems.find((item: any) => item.category === 'TMN');

  const temp = parseFloat(tmpItem?.fcstValue) || 15;
  const humidity = parseFloat(rehItem?.fcstValue) || 60;
  const windSpeed = parseFloat(wsdItem?.fcstValue) || 1.5;
  const sky = parseInt(skyItem?.fcstValue) || 1;
  const pty = parseInt(ptyItem?.fcstValue) || 0;
  const pop = parseInt(popItem?.fcstValue) || 0;
  const tmx = parseFloat(tmxItem?.fcstValue);
  const tmn = parseFloat(tmnItem?.fcstValue);

  return {
    source: 'short',
    tmfc: new Date().toISOString(),
    TMP: temp,
    REH: humidity,
    WSD: windSpeed,
    SKY: sky,
    PTY: pty,
    POP: pop,
    TMX: tmx,
    TMN: tmn,
    flags: deriveFlags({ TMP: temp, REH: humidity, WSD: windSpeed, SKY: sky, PTY: pty, POP: pop, TMX: tmx, TMN: tmn })
  };
}

export function deriveFlags(data: any) {
  const temp = data.T1H || data.TMP || 15;
  const humidity = data.REH || 60;
  const windSpeed = data.WSD || 1.5;
  const sky = data.SKY || 1;
  const pty = data.PTY || 0;
  const precipitation = data.RN1 || data.PCP || 0;
  const pop = data.POP || 0;
  const tmx = data.TMX;
  const tmn = data.TMN;

  const wet = pty > 0 || precipitation > 0 || pop > 70;
  const feels_cold = temp < 10 || (temp < 15 && windSpeed > 3);
  const muggy = temp > 20 && humidity > 75;
  const windy = windSpeed > 4;
  const clear = sky === 1 && pty === 0 && temp >= 10 && temp <= 20;
  const hot_peak = tmx !== undefined && tmx > 25;
  const cold_min = tmn !== undefined && tmn < 5;

  return {
    wet,
    feels_cold,
    muggy,
    windy,
    clear,
    hot_peak,
    cold_min
  };
}

export async function fetchLive(lat: number = 37.5665, lng: number = 126.9780): Promise<WeatherSnapshot> {
  if (!hasWeatherKey) {
    throw new MissingWeatherKeyError('WEATHER_AUTH_KEY가 설정되어 있지 않습니다.')
  }
  const proxyBase = process.env.NEXT_PUBLIC_WEATHER_PROXY_BASE || '/api/weather';
  const url = `${proxyBase}/live?lat=${lat}&lng=${lng}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) throw new Error(data.error);

  return {
    source: 'live',
    tmfc: data.tmfc,
    T1H: data.T1H,
    REH: data.REH,
    WSD: data.WSD,
    PTY: data.PTY,
    RN1: data.RN1,
    flags: deriveFlags(data)
  };
}

export async function fetchUltra(lat: number = 37.5665, lng: number = 126.9780): Promise<WeatherSnapshot> {
  if (!hasWeatherKey) {
    throw new MissingWeatherKeyError('WEATHER_AUTH_KEY가 설정되어 있지 않습니다.')
  }
  const proxyBase = process.env.NEXT_PUBLIC_WEATHER_PROXY_BASE || '/api/weather';
  const url = `${proxyBase}/ultra?lat=${lat}&lng=${lng}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) throw new Error(data.error);

  return {
    source: 'ultra',
    tmfc: data.tmfc,
    TMP: data.TMP,
    REH: data.REH,
    WSD: data.WSD,
    SKY: data.SKY,
    PTY: data.PTY,
    PCP: data.PCP,
    flags: deriveFlags(data)
  };
}

export async function fetchShort(lat: number = 37.5665, lng: number = 126.9780): Promise<WeatherSnapshot> {
  if (!hasWeatherKey) {
    throw new MissingWeatherKeyError('WEATHER_AUTH_KEY가 설정되어 있지 않습니다.')
  }
  const proxyBase = process.env.NEXT_PUBLIC_WEATHER_PROXY_BASE || '/api/weather';
  const url = `${proxyBase}/short?lat=${lat}&lng=${lng}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) throw new Error(data.error);

  return {
    source: 'short',
    tmfc: data.tmfc,
    TMP: data.TMP,
    REH: data.REH,
    WSD: data.WSD,
    SKY: data.SKY,
    PTY: data.PTY,
    POP: data.POP,
    TMX: data.TMX,
    TMN: data.TMN,
    flags: deriveFlags(data)
  };
}

export function mergeWeather(
  live?: WeatherSnapshot,
  ultra?: WeatherSnapshot,
  short?: WeatherSnapshot
): WeatherSnapshot {
  const merged: any = {
    source: 'live' as const,
    tmfc: new Date().toISOString(),
    T1H: 15,
    REH: 60,
    WSD: 1.5,
    SKY: 1,
    PTY: 0,
    flags: {
      wet: false,
      feels_cold: false,
      muggy: false,
      windy: false,
      clear: true,
      hot_peak: false,
      cold_min: false
    }
  };

  // Priority: live > ultra > short
  if (live) {
    merged.source = 'live';
    merged.tmfc = live.tmfc;
    if (live.T1H !== undefined) merged.T1H = live.T1H;
    if (live.REH !== undefined) merged.REH = live.REH;
    if (live.WSD !== undefined) merged.WSD = live.WSD;
    if (live.PTY !== undefined) merged.PTY = live.PTY;
    if (live.RN1 !== undefined) merged.RN1 = live.RN1;
  }

  if (ultra) {
    if (!live || !live.T1H) merged.T1H = ultra.TMP || merged.T1H;
    if (!live || !live.REH) merged.REH = ultra.REH || merged.REH;
    if (!live || !live.WSD) merged.WSD = ultra.WSD || merged.WSD;
    if (ultra.SKY !== undefined) merged.SKY = ultra.SKY;
    if (!live || !live.PTY) merged.PTY = ultra.PTY || merged.PTY;
    if (ultra.PCP !== undefined) merged.PCP = ultra.PCP;
  }

  if (short) {
    if (!live && !ultra) {
      merged.T1H = short.TMP || merged.T1H;
      merged.REH = short.REH || merged.REH;
      merged.WSD = short.WSD || merged.WSD;
      merged.PTY = short.PTY || merged.PTY;
    }
    if (!ultra?.SKY && short.SKY !== undefined) merged.SKY = short.SKY;
    if (short.POP !== undefined) merged.POP = short.POP;
    if (short.TMX !== undefined) merged.TMX = short.TMX;
    if (short.TMN !== undefined) merged.TMN = short.TMN;
  }

  // Derive flags from merged data
  merged.flags = deriveFlags(merged);

  return merged as WeatherSnapshot;
}

const WEATHER_CACHE_KEY = 'lunch-app-last-weather';

export function getCachedWeather(): WeatherSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const age = Date.now() - new Date(data.timestamp).getTime();

    // Use cache if less than 30 minutes old
    if (age < 30 * 60 * 1000) {
      return data.weather;
    }
  } catch (error) {
    console.warn('Failed to load cached weather:', error);
  }

  return null;
}

export function setCachedWeather(weather: WeatherSnapshot): void {
  if (typeof window === 'undefined') return;

  try {
    const cacheData = {
      weather,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache weather:', error);
  }
}

export async function loadMergedWeather(lat: number = 37.5665, lng: number = 126.9780): Promise<WeatherSnapshot> {
  if (!hasWeatherKey) {
    throw new MissingWeatherKeyError('WEATHER_AUTH_KEY가 설정되어 있지 않습니다.')
  }

  const cached = getCachedWeather()
  if (cached) {
    return cached
  }

  const [live, ultra, short] = await Promise.all([
    fetchLive(lat, lng).catch(() => undefined),
    fetchUltra(lat, lng).catch(() => undefined),
    fetchShort(lat, lng).catch(() => undefined),
  ])

  if (!live && !ultra && !short) {
    throw new Error('날씨 데이터를 불러오지 못했습니다.')
  }

  const merged = mergeWeather(live, ultra, short)
  setCachedWeather(merged)
  return merged
}

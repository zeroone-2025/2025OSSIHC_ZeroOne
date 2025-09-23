import { WeatherSnapshot } from './types';

export async function loadWeatherSnapshot(): Promise<WeatherSnapshot> {
  try {
    const response = await fetch('/data/weather.snapshot.json');
    if (!response.ok) throw new Error('Failed to fetch weather snapshot');
    return await response.json();
  } catch (error) {
    console.warn('Failed to load weather snapshot, using safe default:', error);
    return getSafeWeatherDefault();
  }
}

function getSafeWeatherDefault(): WeatherSnapshot {
  return {
    source: 'live',
    tmfc: new Date().toISOString(),
    T1H: 15,
    REH: 60,
    WSD: 1.5,
    SKY: 1,
    PTY: 0,
    POP: 0,
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
}

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

export async function fetchLive(): Promise<WeatherSnapshot> {
  const proxyBase = process.env.NEXT_PUBLIC_WEATHER_PROXY_BASE || '/api/weather';
  const response = await fetch(`${proxyBase}/live`);
  const data = await response.json();
  return normalizeLive(data);
}

export async function fetchUltra(): Promise<WeatherSnapshot> {
  const proxyBase = process.env.NEXT_PUBLIC_WEATHER_PROXY_BASE || '/api/weather';
  const response = await fetch(`${proxyBase}/ultra`);
  const data = await response.json();
  return normalizeUltra(data);
}

export async function fetchShort(): Promise<WeatherSnapshot> {
  const proxyBase = process.env.NEXT_PUBLIC_WEATHER_PROXY_BASE || '/api/weather';
  const response = await fetch(`${proxyBase}/short`);
  const data = await response.json();
  return normalizeShort(data);
}
const KMA_API_KEY = process.env.KMA_API_KEY;
const BASE_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

export interface GridCoord {
  nx: number;
  ny: number;
}

export function coordToGrid(lat: number, lng: number): GridCoord {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

export function roundToLiveTime(date: Date): { baseDate: string; baseTime: string } {
  const now = new Date(date);

  // Round down to nearest 10 minutes for live data
  const minutes = Math.floor(now.getMinutes() / 10) * 10;
  now.setMinutes(minutes, 0, 0);

  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');

  return { baseDate, baseTime };
}

export function roundToUltraTime(date: Date): { baseDate: string; baseTime: string } {
  const now = new Date(date);

  // Ultra short forecast: use current hour, but if minutes < 45, use previous hour
  if (now.getMinutes() < 45) {
    now.setHours(now.getHours() - 1);
  }
  now.setMinutes(0, 0, 0);

  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = String(now.getHours()).padStart(2, '0') + '00';

  return { baseDate, baseTime };
}

export function roundToShortTime(date: Date): { baseDate: string; baseTime: string } {
  const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();

  let baseTime = '0200'; // default to earliest

  for (let i = baseTimes.length - 1; i >= 0; i--) {
    const hour = parseInt(baseTimes[i].slice(0, 2));
    if (currentHour > hour || (currentHour === hour && currentMinute >= 10)) {
      baseTime = baseTimes[i];
      break;
    }
  }

  const baseDate = date.toISOString().slice(0, 10).replace(/-/g, '');
  return { baseDate, baseTime };
}

export function createWeatherUrl(endpoint: string, baseDate: string, baseTime: string, nx: number, ny: number, numOfRows: number = 10): string {
  if (!KMA_API_KEY) {
    throw new Error('Weather API key not configured');
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('serviceKey', KMA_API_KEY);
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('numOfRows', numOfRows.toString());
  url.searchParams.set('dataType', 'JSON');
  url.searchParams.set('base_date', baseDate);
  url.searchParams.set('base_time', baseTime);
  url.searchParams.set('nx', nx.toString());
  url.searchParams.set('ny', ny.toString());

  return url.toString();
}

export function createCacheHeaders(maxAge: number = 300): HeadersInit {
  return {
    'Cache-Control': `s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { getAutumnFallback, type WeatherContext } from '@/lib/reco-core';

const KMA_HOST = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

interface KMAResponse {
  T1H?: number;    // temp C
  REH?: number;    // humidity %
  WSD?: number;    // wind m/s
  SKY?: 1|3|4;     // sky code
  PTY?: 0|1|2|3|4|5|6|7; // precipitation type
  PCP?: number;    // mm/h
  SNO?: number;    // cm/h
}

function toGrid(lat: number, lng: number) {
  // Minimal grid approx for Seoul region
  return { nx: 60, ny: 127 };
}

function kmaToWeatherContext(kma: KMAResponse): WeatherContext {
  return {
    temperature: kma.T1H ?? 18,
    humidity: kma.REH ?? 55,
    windSpeed: kma.WSD ?? 3,
    skyCondition: kma.SKY ?? 3,
    precipitationType: kma.PTY ?? 0,
    precipitationAmount: kma.PCP ?? 0,
    snowAmount: kma.SNO ?? 0
  };
}

async function fetchKmaWeather(lat: number, lng: number): Promise<WeatherContext | null> {
  const key = process.env.KMA_API_KEY;
  if (!key) return null;

  try {
    const { nx, ny } = toGrid(lat, lng);
    const baseDate = new Date(Date.now() - 40 * 60 * 1000);
    const ymd = baseDate.toISOString().slice(0,10).replace(/-/g,'');
    const hh = String(baseDate.getHours()).padStart(2,'0');

    const url = new URL(`${KMA_HOST}/getUltraSrtNcst`);
    url.searchParams.set('serviceKey', key);
    url.searchParams.set('pageNo', '1');
    url.searchParams.set('numOfRows', '60');
    url.searchParams.set('dataType', 'JSON');
    url.searchParams.set('base_date', ymd);
    url.searchParams.set('base_time', `${hh}00`);
    url.searchParams.set('nx', String(nx));
    url.searchParams.set('ny', String(ny));

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) return null;

    const data = await response.json();
    const items = data?.response?.body?.items?.item;
    if (!Array.isArray(items)) return null;

    const kmaData: KMAResponse = {};
    for (const item of items) {
      switch (item.category) {
        case 'T1H': kmaData.T1H = Number(item.obsrValue); break;
        case 'REH': kmaData.REH = Number(item.obsrValue); break;
        case 'WSD': kmaData.WSD = Number(item.obsrValue); break;
        case 'SKY': kmaData.SKY = Number(item.obsrValue) as 1|3|4; break;
        case 'PTY': kmaData.PTY = Number(item.obsrValue) as 0|1|2|3|4|5|6|7; break;
        case 'RN1':
        case 'PCP':
          kmaData.PCP = String(item.obsrValue) === '강수없음' ? 0 : Number(String(item.obsrValue).replace(/[^0-9.]/g,'')); break;
        case 'SNO':
          kmaData.SNO = String(item.obsrValue) === '적설없음' ? 0 : Number(String(item.obsrValue).replace(/[^0-9.]/g,'')); break;
      }
    }

    // Check if we have essential data
    const hasEssentialData = kmaData.T1H !== undefined || kmaData.REH !== undefined || kmaData.SKY !== undefined;
    return hasEssentialData ? kmaToWeatherContext(kmaData) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));

    if (!isFinite(lat) || !isFinite(lng)) {
      return NextResponse.json({ error: 'INVALID_COORDS' }, { status: 400 });
    }

    // Try to fetch real weather data
    const weather = await fetchKmaWeather(lat, lng);

    if (weather) {
      return NextResponse.json({
        source: 'kma',
        weather
      });
    } else {
      // Fallback to autumn weather
      const fallbackWeather = getAutumnFallback();
      return NextResponse.json({
        source: 'fallback',
        weather: fallbackWeather
      });
    }
  } catch (error: any) {
    // Always return fallback weather even on error
    const fallbackWeather = getAutumnFallback();
    return NextResponse.json({
      source: 'fallback',
      weather: fallbackWeather,
      error: error?.message
    });
  }
}

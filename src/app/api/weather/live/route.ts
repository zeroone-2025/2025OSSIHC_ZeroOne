import { NextRequest, NextResponse } from 'next/server';
import { coordToGrid, roundToLiveTime, createWeatherUrl, createCacheHeaders } from '../_utils';

const WEATHER_AUTH_KEY = process.env.WEATHER_AUTH_KEY;

export async function GET(request: NextRequest) {
  if (!WEATHER_AUTH_KEY) {
    return NextResponse.json({ error: 'NO_WEATHER_KEY' }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get('lat') || '37.5665');
  const lng = parseFloat(searchParams.get('lng') || '126.9780');

  try {
    const { nx, ny } = coordToGrid(lat, lng);
    const { baseDate, baseTime } = roundToLiveTime(new Date());
    const url = createWeatherUrl('getUltraSrtNcst', baseDate, baseTime, nx, ny, 10);

    const response = await fetch(url);
    const data = await response.json();

    if (!data.response?.body?.items?.item) {
      throw new Error('Invalid API response');
    }

    const items = Array.isArray(data.response.body.items.item)
      ? data.response.body.items.item
      : [data.response.body.items.item];

    const result: any = {
      tmfc: new Date().toISOString(),
      T1H: 15,
      REH: 60,
      WSD: 1.5,
      PTY: 0,
      RN1: 0
    };

    items.forEach((item: any) => {
      const value = parseFloat(item.obsrValue) || 0;
      switch (item.category) {
        case 'T1H': result.T1H = value; break;
        case 'REH': result.REH = value; break;
        case 'WSD': result.WSD = value; break;
        case 'PTY': result.PTY = parseInt(item.obsrValue) || 0; break;
        case 'RN1': result.RN1 = value; break;
      }
    });

    return NextResponse.json(result, {
      headers: createCacheHeaders(300)
    });

  } catch (error) {
    console.error('Live weather API failed', error);
    return NextResponse.json(
      { error: 'WEATHER_UPSTREAM_FAILED' },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...createCacheHeaders(60)
        }
      }
    );
  }
}

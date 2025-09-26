import { NextRequest, NextResponse } from 'next/server';
import { coordToGrid, roundToShortTime, createWeatherUrl, createCacheHeaders } from '../_utils';

const KMA_API_KEY = process.env.KMA_API_KEY;

export async function GET(request: NextRequest) {
  if (!KMA_API_KEY) {
    return NextResponse.json({ error: 'NO_WEATHER_KEY' }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get('lat') || '37.5665');
  const lng = parseFloat(searchParams.get('lng') || '126.9780');

  try {
    const { nx, ny } = coordToGrid(lat, lng);
    const { baseDate, baseTime } = roundToShortTime(new Date());
    const url = createWeatherUrl('getVilageFcst', baseDate, baseTime, nx, ny, 1000);

    const response = await fetch(url);
    const data = await response.json();

    if (!data.response?.body?.items?.item) {
      throw new Error('Invalid API response');
    }

    const items = Array.isArray(data.response.body.items.item)
      ? data.response.body.items.item
      : [data.response.body.items.item];

    const now = new Date();
    const today = now.toISOString().slice(0, 10).replace(/-/g, '');
    const todayItems = items.filter((item: any) => item.fcstDate === today);

    const result: any = {
      tmfc: now.toISOString(),
      TMP: 15,
      REH: 60,
      WSD: 1.5,
      SKY: 1,
      PTY: 0,
      POP: 0,
      TMX: undefined,
      TMN: undefined
    };

    // Find nearest hour forecast
    const currentHour = now.getHours();
    const nearestHourItems = todayItems.filter((item: any) => {
      const fcstHour = parseInt(item.fcstTime.slice(0, 2));
      return fcstHour >= currentHour;
    });

    // Get averages for next few hours
    const categories = ['TMP', 'REH', 'WSD', 'SKY', 'PTY', 'POP'];
    const values: { [key: string]: number[] } = {};

    categories.forEach(cat => values[cat] = []);

    nearestHourItems.slice(0, 18).forEach((item: any) => { // Next 6 hours (3 items per hour)
      const value = parseFloat(item.fcstValue) || 0;
      if (values[item.category]) {
        values[item.category].push(value);
      }
    });

    // Calculate averages
    categories.forEach(cat => {
      if (values[cat].length > 0) {
        if (cat === 'SKY' || cat === 'PTY') {
          result[cat] = Math.round(values[cat].reduce((a, b) => a + b, 0) / values[cat].length);
        } else {
          result[cat] = values[cat].reduce((a, b) => a + b, 0) / values[cat].length;
        }
      }
    });

    // Find min/max temperatures for today
    const tmxItem = todayItems.find((item: any) => item.category === 'TMX');
    const tmnItem = todayItems.find((item: any) => item.category === 'TMN');

    if (tmxItem) result.TMX = parseFloat(tmxItem.fcstValue);
    if (tmnItem) result.TMN = parseFloat(tmnItem.fcstValue);

    return NextResponse.json(result, {
      headers: createCacheHeaders(300)
    });

  } catch (error) {
    console.error('Short weather API failed', error);
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

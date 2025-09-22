import { NextRequest, NextResponse } from 'next/server';
import { coordToGrid, roundToUltraTime, createWeatherUrl, createCacheHeaders, createErrorResponse } from '../_utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get('lat') || '37.5665');
  const lng = parseFloat(searchParams.get('lng') || '126.9780');

  const fallbackData = {
    tmfc: new Date().toISOString(),
    TMP: 15,
    REH: 60,
    WSD: 1.5,
    SKY: 1,
    PTY: 0,
    PCP: 0
  };

  try {
    const { nx, ny } = coordToGrid(lat, lng);
    const { baseDate, baseTime } = roundToUltraTime(new Date());
    const url = createWeatherUrl('getUltraSrtFcst', baseDate, baseTime, nx, ny, 60);

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
      TMP: 15,
      REH: 60,
      WSD: 1.5,
      SKY: 1,
      PTY: 0,
      PCP: 0
    };

    // Get nearest forecast time items
    const now = new Date();
    const currentTime = now.toISOString().slice(0, 13).replace(/[-T]/g, '') + '00';

    const nearestTime = items.find((item: any) => {
      const fcstTime = item.fcstDate + item.fcstTime;
      return fcstTime >= currentTime;
    })?.fcstTime || items[0]?.fcstTime;

    const nearestItems = items.filter((item: any) => item.fcstTime === nearestTime);

    // Calculate averages for next 0-3 hours
    const categories = ['TMP', 'REH', 'WSD', 'SKY', 'PTY', 'PCP'];
    const values: { [key: string]: number[] } = {};

    categories.forEach(cat => values[cat] = []);

    items.forEach((item: any) => {
      const fcstTime = item.fcstDate + item.fcstTime;
      const fcstHour = parseInt(item.fcstTime.slice(0, 2));
      const currentHour = now.getHours();

      // Include next 3 hours
      if (fcstHour >= currentHour && fcstHour <= currentHour + 3) {
        const value = parseFloat(item.fcstValue) || 0;

        if (item.category === 'PCP' && item.fcstValue === '강수없음') {
          values['PCP'].push(0);
        } else if (values[item.category]) {
          values[item.category].push(value);
        }
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

    return NextResponse.json(result, {
      headers: createCacheHeaders(300)
    });

  } catch (error) {
    return new NextResponse(
      createErrorResponse('Ultra weather API failed', fallbackData).body,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...createCacheHeaders(60)
        }
      }
    );
  }
}
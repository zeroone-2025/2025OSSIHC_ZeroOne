import { NextRequest, NextResponse } from 'next/server';

const WEATHER_AUTH_KEY = process.env.WEATHER_AUTH_KEY;
const BASE_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

interface GridCoord {
  nx: number;
  ny: number;
}

function coordToGrid(lat: number, lng: number): GridCoord {
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get('lat') || '37.5665');
  const lng = parseFloat(searchParams.get('lng') || '126.9780');

  if (!WEATHER_AUTH_KEY) {
    return NextResponse.json({ error: 'Weather API key not configured' }, { status: 500 });
  }

  try {
    const { nx, ny } = coordToGrid(lat, lng);
    const now = new Date();
    const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    const baseTime = String(Math.floor(now.getHours() / 1) * 100).padStart(4, '0');

    const url = new URL(`${BASE_URL}/getUltraSrtNcst`);
    url.searchParams.set('serviceKey', WEATHER_AUTH_KEY);
    url.searchParams.set('pageNo', '1');
    url.searchParams.set('numOfRows', '10');
    url.searchParams.set('dataType', 'JSON');
    url.searchParams.set('base_date', baseDate);
    url.searchParams.set('base_time', baseTime);
    url.searchParams.set('nx', nx.toString());
    url.searchParams.set('ny', ny.toString());

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!data.response?.body?.items?.item) {
      throw new Error('Invalid API response');
    }

    const items = data.response.body.items.item;
    const result: any = {
      tmfc: now.toISOString(),
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
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({
      tmfc: new Date().toISOString(),
      T1H: 15,
      REH: 60,
      WSD: 1.5,
      PTY: 0,
      RN1: 0
    }, {
      headers: {
        'Cache-Control': 's-maxage=60'
      }
    });
  }
}
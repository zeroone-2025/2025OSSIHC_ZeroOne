import { NextRequest, NextResponse } from 'next/server';
import { resolveWeather } from '@/lib/weather';
import type { LiveWeatherRes } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'INVALID_COORDS' }, { status: 400 });
    }

    const result = await resolveWeather(lat, lng);
    const payload: LiveWeatherRes = { flags: result.flags, meta: result.meta };
    return NextResponse.json(payload);
  } catch (error) {
    const payload: LiveWeatherRes = { flags: [], meta: undefined };
    return NextResponse.json(payload, { status: 500 });
  }
}

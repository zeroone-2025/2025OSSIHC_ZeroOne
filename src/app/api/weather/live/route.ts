import { NextRequest, NextResponse } from 'next/server';
import {
  coordToGrid,
  roundToLiveTime,
  roundToShortTime,
  createWeatherUrl,
  createCacheHeaders,
} from '../_utils';

const KMA_API_KEY = process.env.KMA_API_KEY;

type LiveItem = {
  category: string;
  obsrValue: string;
};

type ShortItem = {
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
};

const FLAG_ORDER: Array<'cold' | 'hot' | 'rain' | 'humid' | 'dry' | 'windy'> = [
  'cold',
  'hot',
  'rain',
  'humid',
  'dry',
  'windy',
];

function toNumber(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : undefined;
  }
  if (typeof input !== 'string') return undefined;
  if (input.trim() === '' || input === '강수없음') return 0;
  const match = input.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pickLiveValue(items: LiveItem[], category: string, fallback: number): number {
  const value = items.find((item) => item.category === category)?.obsrValue;
  return toNumber(value) ?? fallback;
}

function buildShortMetrics(items: ShortItem[] | undefined, now: Date) {
  if (!items?.length) return {} as Record<string, number | undefined>;

  const nowKey = Number(
    `${now.toISOString().slice(0, 10).replace(/-/g, '')}${now
      .toISOString()
      .slice(11, 16)
      .replace(':', '')}`,
  );

  const firstByCategory = (category: string) => {
    let candidateKey = Number.POSITIVE_INFINITY;
    let candidateValue: number | undefined;

    for (const item of items) {
      if (item.category !== category) continue;
      const key = Number(`${item.fcstDate}${item.fcstTime}`);
      if (!Number.isFinite(key)) continue;
      if (key < nowKey) continue;
      if (key < candidateKey) {
        candidateKey = key;
        candidateValue = toNumber(item.fcstValue);
      }
    }

    if (candidateValue === undefined) {
      const fallbackItem = items.find((item) => item.category === category);
      return toNumber(fallbackItem?.fcstValue);
    }

    return candidateValue;
  };

  return {
    TMP: firstByCategory('TMP'),
    REH: firstByCategory('REH'),
    WSD: firstByCategory('WSD'),
    PTY: firstByCategory('PTY'),
    POP: firstByCategory('POP'),
    TMX: firstByCategory('TMX'),
    TMN: firstByCategory('TMN'),
  } as Record<string, number | undefined>;
}

function deriveFlags(params: {
  tempNow: number;
  humidityNow: number;
  windNow: number;
  precipNow: boolean;
  shortMetrics: Record<string, number | undefined>;
}): string[] {
  const flags = new Set<string>();

  const {
    tempNow,
    humidityNow,
    windNow,
    precipNow,
    shortMetrics: { TMP, REH, WSD, PTY, POP, TMX, TMN },
  } = params;

  const effectiveHot = TMX ?? TMP ?? tempNow;
  const effectiveCold = TMN ?? TMP ?? tempNow;
  const effectiveHumidity = REH ?? humidityNow;
  const effectiveWind = WSD ?? windNow;
  const precipSoon = (PTY ?? 0) > 0 || (POP ?? 0) >= 60;

  if (effectiveCold <= 10 || tempNow <= 10) flags.add('cold');
  if (effectiveHot >= 28 || tempNow >= 28) flags.add('hot');
  if (precipNow || precipSoon) flags.add('rain');
  if (effectiveHumidity >= 80) flags.add('humid');
  if (effectiveHumidity > 0 && effectiveHumidity <= 40) flags.add('dry');
  if (effectiveWind >= 8 || windNow >= 8) flags.add('windy');

  return FLAG_ORDER.filter((flag) => flags.has(flag));
}

async function fetchShortItems(nx: number, ny: number, now: Date): Promise<ShortItem[] | undefined> {
  try {
    const { baseDate, baseTime } = roundToShortTime(now);
    const url = createWeatherUrl('getVilageFcst', baseDate, baseTime, nx, ny, 200);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return undefined;
    const data = await response.json();
    const raw = data?.response?.body?.items?.item;
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw : [raw];
  } catch (error) {
    console.warn('Failed to load short-term forecast', error);
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  if (!KMA_API_KEY) {
    return NextResponse.json({ error: 'NO_WEATHER_KEY' }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'INVALID_COORDS' }, { status: 400 });
  }

  try {
    const now = new Date();
    const { nx, ny } = coordToGrid(lat, lng);
    const { baseDate, baseTime } = roundToLiveTime(now);
    const liveUrl = createWeatherUrl('getUltraSrtNcst', baseDate, baseTime, nx, ny, 60);

    const [liveResponse, shortItems] = await Promise.all([
      fetch(liveUrl, { cache: 'no-store' }),
      fetchShortItems(nx, ny, now),
    ]);

    if (!liveResponse.ok) {
      throw new Error(`live_upstream_${liveResponse.status}`);
    }

    const liveData = await liveResponse.json();
    const rawItems = liveData?.response?.body?.items?.item;
    const liveItems: LiveItem[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    if (liveItems.length === 0) {
      throw new Error('live_items_missing');
    }

    const observation = {
      temp: pickLiveValue(liveItems, 'T1H', 15),
      humidity: pickLiveValue(liveItems, 'REH', 60),
      wind: pickLiveValue(liveItems, 'WSD', 1.5),
      precipitationType: pickLiveValue(liveItems, 'PTY', 0),
      rainAmount: pickLiveValue(liveItems, 'RN1', 0),
    };

    const shortMetrics = buildShortMetrics(shortItems, now);
    const precipNow = observation.precipitationType > 0 || observation.rainAmount > 0;
    const flags = deriveFlags({
      tempNow: observation.temp,
      humidityNow: observation.humidity,
      windNow: observation.wind,
      precipNow,
      shortMetrics,
    });

    return NextResponse.json(
      { flags },
      {
        status: 200,
        headers: createCacheHeaders(180),
      },
    );
  } catch (error) {
    console.error('Live weather API failed', error);
    return NextResponse.json(
      { error: 'WEATHER_UPSTREAM_FAILED' },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...createCacheHeaders(60),
        },
      },
    );
  }
}

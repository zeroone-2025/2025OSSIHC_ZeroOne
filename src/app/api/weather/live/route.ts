// TODO: Replace mock weather with real API later
import { NextRequest, NextResponse } from 'next/server';
import { pickKSTHour, deriveWeights, getMockWeather } from '@/lib/mockWeather';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const rows = await getMockWeather();
    const row = pickKSTHour(rows, new Date());
    const weights = deriveWeights(row);

    return NextResponse.json({
      weights,
      raw: {
        processed: {
          T1H: row.temp_c,
          REH: row.humidity_pct,
          WSD: row.wind_ms,
          SKY: row.cloud_10 >= 8 ? 4 : (row.cloud_10 >= 3 ? 3 : 1),
          PTY: row.precip_mm > 0 ? 1 : 0,
          PCP: row.precip_mm,
          SNO: 0,
          RN1: row.precip_mm,
        },
        source: 'local-jeonju-hourly-json',
        timeKeyKST: row.time,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'MOCK_WEATHER_FAILED', detail: String(e?.message || e) },
      { status: 500 },
    );
  }
}

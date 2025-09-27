import { NextRequest, NextResponse } from 'next/server';
import { autumnFallback, flagsFromObs, WeatherObs } from '../_mvp';

const KMA_HOST = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
const MUST_KEYS = ['T1H','REH','WSD','SKY','PTY','PCP','SNO'] as const;

function isMock() {
  return process.env.MOCK_WEATHER === '1';
}

function toGrid(lat: number, lng: number) {
  // Minimal grid approx for Seoul region; your project may already have better impl.
  // For MVP, just return nx, ny around Seoul (60,127).
  return { nx: 60, ny: 127 };
}

async function fetchKma(lat: number, lng: number): Promise<WeatherObs | null> {
  const key = process.env.KMA_API_KEY;
  if (!key) return null;
  try {
    const { nx, ny } = toGrid(lat, lng);
    // Use ultra short-term nowcast (getUltraSrtNcst)
    const baseDate = new Date(Date.now() - 40 * 60 * 1000); // -40 min
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

    const r = await fetch(url.toString(), { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    const items = j?.response?.body?.items?.item;
    if (!Array.isArray(items)) return null;

    const obs: WeatherObs = {};
    for (const it of items) {
      switch (it.category) {
        case 'T1H': obs.T1H = Number(it.obsrValue); break;
        case 'REH': obs.REH = Number(it.obsrValue); break;
        case 'WSD': obs.WSD = Number(it.obsrValue); break;
        case 'SKY': obs.SKY = Number(it.obsrValue); break;
        case 'PTY': obs.PTY = Number(it.obsrValue); break;
        case 'RN1':
        case 'PCP':
          obs.PCP = String(it.obsrValue) === '강수없음' ? 0 : Number(String(it.obsrValue).replace(/[^0-9.]/g,'')); break;
        case 'SNO':
          obs.SNO = String(it.obsrValue) === '적설없음' ? 0 : Number(String(it.obsrValue).replace(/[^0-9.]/g,'')); break;
      }
    }
    // If essential keys missing, consider it a failure
    const hasAny = MUST_KEYS.some(k => (obs as any)[k] != null);
    return hasAny ? obs : null;
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

    // Forced mock or real attempt -> fallback
    let obs: WeatherObs | null = isMock() ? null : await fetchKma(lat, lng);
    if (!obs) {
      const fb = autumnFallback();
      return NextResponse.json({ source: 'fallback', obs: fb.obs, flags: fb.flags });
    }

    const flags = flagsFromObs(obs);
    return NextResponse.json({ source: 'kma', obs, flags });
  } catch (e:any) {
    const fb = autumnFallback();
    return NextResponse.json({ source: 'fallback', obs: fb.obs, flags: fb.flags, detail: String(e?.message||e) }, { status: 200 });
  }
}

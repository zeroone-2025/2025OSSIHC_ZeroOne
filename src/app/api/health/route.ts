import { NextRequest, NextResponse } from 'next/server';

const pingJson = async (url: string, init?: RequestInit) => {
  try {
    const res = await fetch(url, { cache: 'no-store', ...init });
    const txt = await res.text();
    let body: any = null;
    try { body = JSON.parse(txt); } catch (_) {}
    return { ok: res.ok, status: res.status, body, raw: res.ok ? undefined : txt };
  } catch (e: any) {
    return { ok: false, status: 0, error: String(e?.message || e) };
  }
};

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const base = process.env.NEXT_PUBLIC_BASE_URL || origin || 'http://127.0.0.1:8080';

  const lat = 37.5665, lng = 126.9780;             // 서울 시청 좌표 샘플

  // 환경변수 존재 여부(문자열 길이만 확인)
  const env = {
    KMA_API_KEY: !!process.env.KMA_API_KEY,
    NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
  };

  const requests: Record<string, Promise<any>> = {
    weather_live: pingJson(`${base}/api/weather/live?lat=${lat}&lng=${lng}`),
    weather_short: pingJson(`${base}/api/weather/short?lat=${lat}&lng=${lng}`),
    weather_ultra: pingJson(`${base}/api/weather/ultra?lat=${lat}&lng=${lng}`),
    reco: pingJson(`${base}/api/reco`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    }),
  };

  const settled = await Promise.allSettled(
    Object.entries(requests).map(async ([k, p]) => [k, await p] as const)
  );

  const results: Record<string, any> = {};
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      const [k, v] = s.value;
      results[k] = v;
    } else {
      results.unknown = { ok: false, error: s.reason?.message || String(s.reason) };
    }
  }

  const summary = Object.fromEntries(
    Object.entries(results).map(([k, v]: any) => [k, !!(v && v.ok)])
  );

  const requiredEnvOk = env.KMA_API_KEY;

  return NextResponse.json({
    ok: requiredEnvOk && Object.values(summary).every(Boolean),
    env,
    summary,
    details: results,
  });
}

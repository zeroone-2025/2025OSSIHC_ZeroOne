import { NextRequest, NextResponse } from 'next/server';

const MENU_RULES: Record<string, string[]> = {
  cold: ['국밥', '라멘', '우동', '찌개'],
  rain: ['파전', '칼국수', '라멘'],
  hot: ['냉면', '회덮밥', '샐러드'],
  humid: ['비빔국수', '메밀소바'],
  dry: ['순대국', '설렁탕'],
  windy: ['돈까스', '카레'],
};

function pickByFlags(flags: string[]): string[] {
  const bag = new Set<string>();
  for (const f of flags) (MENU_RULES[f] || []).forEach((m) => bag.add(m));
  if (bag.size === 0) ['국밥', '비빔밥', '김치찌개'].forEach((m) => bag.add(m));
  return Array.from(bag).slice(0, 3);
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'INVALID_COORDS' }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:8080';
    const u = new URL(`${base}/api/weather/live`);
    u.searchParams.set('lat', String(lat));
    u.searchParams.set('lng', String(lng));

    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) return NextResponse.json({ error: 'WEATHER_FAIL' }, { status: 502 });
    const { flags = [] } = await r.json();

    const menus = pickByFlags(Array.isArray(flags) ? flags : []);
    return NextResponse.json({ flags, menus });
  } catch (e: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', detail: String(e?.message || e) }, { status: 500 });
  }
}

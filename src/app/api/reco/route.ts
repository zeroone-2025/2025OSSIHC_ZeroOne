import { NextRequest, NextResponse } from 'next/server';

const MENU_RULES: Record<string, string[]> = {
  cold: ['국밥','라멘','우동','찌개'],
  rain: ['파전','칼국수','짬뽕'],
  hot: ['냉면','회덮밥','샐러드'],
  humid: ['비빔국수','메밀소바'],
  gloomy: ['부대찌개','전'],
  gloom: ['부대찌개','전'],
  dry: ['설렁탕','순대국'],
  windy: ['돈까스','카레'],
};

function pickByFlags(flags: string[]): string[] {
  const bag = new Set<string>();
  for (const f of flags) (MENU_RULES[f] || []).forEach(m => bag.add(m));
  if (bag.size === 0) ['국밥','비빔밥','김치찌개'].forEach(m => bag.add(m));
  return Array.from(bag).slice(0, 3);
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'INVALID_COORDS' }, { status: 400 });
    }
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
    const url = new URL('/api/weather/live', base);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lng', String(lng));
    const r = await fetch(url.toString(), { cache: 'no-store' });
    const j = await r.json();
    const flags: string[] = Array.isArray(j?.flags) ? j.flags : [];
    const menus = pickByFlags(flags);
    return NextResponse.json({ flags, menus, source: j?.source ?? 'fallback' });
  } catch (e:any) {
    return NextResponse.json({ error: 'SERVER_ERROR', detail: String(e?.message || e) }, { status: 500 });
  }
}

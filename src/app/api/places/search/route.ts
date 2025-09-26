import { NextRequest, NextResponse } from 'next/server';

type Req = {
  query?: string;
  lat: number;
  lng: number;
  radius?: number;
  categoryGroupCode?: string; // 'FD6' = 음식점
};

const KAKAO_HOST = 'https://dapi.kakao.com';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Req;
    const { query, lat, lng, radius = 900, categoryGroupCode = 'FD6' } = body;

    const key = process.env.KAKAO_REST_API_KEY;
    if (!key) return NextResponse.json({ error: 'NO_KAKAO_KEY' }, { status: 503 });

    const endpoint = query
      ? `${KAKAO_HOST}/v2/local/search/keyword.json?y=${lat}&x=${lng}&radius=${radius}&category_group_code=${categoryGroupCode}&query=${encodeURIComponent(query)}`
      : `${KAKAO_HOST}/v2/local/search/category.json?y=${lat}&x=${lng}&radius=${radius}&category_group_code=${categoryGroupCode}`;

    const res = await fetch(endpoint, {
      headers: { Authorization: `KakaoAK ${key}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ error: 'KAKAO_FAIL', detail }, { status: 502 });
    }

    const json = await res.json();
    const items = (json.documents || []).map((d: any) => ({
      id: d.id,
      name: d.place_name,
      address: d.road_address_name || d.address_name,
      phone: d.phone || null,
      lat: Number(d.y),
      lng: Number(d.x),
      distanceM: d.distance ? Number(d.distance) : null,
      categoryPath: (d.category_name || '').split(' > '), // 예: ["음식점","한식","국밥"]
      placeUrl: d.place_url,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: 'SERVER_ERROR', detail: String(e?.message || e) }, { status: 500 });
  }
}

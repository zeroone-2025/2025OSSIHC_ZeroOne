// src/app/api/reco/route.ts
import { NextRequest, NextResponse } from 'next/server';

type W = { W_cold:number; W_hot:number; W_gloom:number; W_rain:number; W_snow:number; W_humid:number; W_wind:number };
type Coeff = { A:number;B:number;C:number;D:number;E:number;F:number;G:number; base:number; };

const MENUS: Record<string, Coeff> = {
  '국밥':     { base:0.5,  A:+0.9, B:-0.6, C:+0.5, D:+0.6, E:+0.7, F:-0.4, G:+0.3 },
  '칼국수':   { base:0.5,  A:+0.8, B:-0.5, C:+0.4, D:+0.7, E:+0.5, F:-0.4, G:+0.2 },
  '파전':     { base:0.4,  A:+0.4, B:-0.2, C:+0.6, D:+1.0, E:+0.2, F:-0.3, G:+0.1 },
  '냉면':     { base:0.45, A:-0.6, B:+0.9, C:-0.2, D: 0.0, E: 0.0, F:+0.7, G:-0.2 },
  '메밀소바': { base:0.4,  A:-0.5, B:+0.8, C:-0.2, D: 0.0, E: 0.0, F:+0.6, G:-0.2 },
  '어묵탕':   { base:0.35, A:+0.9, B:-0.6, C:+0.4, D:+0.2, E:+0.9, F:-0.3, G:+0.2 },
  '비빔밥':   { base:0.5,  A:+0.1, B:+0.1, C: 0.0, D: 0.0, E: 0.0, F:+0.1, G: 0.0 },
  '돈까스':   { base:0.45, A:+0.1, B:-0.2, C:+0.1, D: 0.0, E: 0.0, F:-0.2, G:+0.3 },
};

function score(c:Coeff, w:W){
  return c.base + c.A*w.W_cold + c.B*w.W_hot + c.C*w.W_gloom + c.D*w.W_rain + c.E*w.W_snow + c.F*w.W_humid + c.G*w.W_wind;
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();
    if (!isFinite(lat) || !isFinite(lng)) {
      return NextResponse.json({ error:'INVALID_COORDS' }, { status:400 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
    const url = `${base}/api/weather/live?lat=${lat}&lng=${lng}`;
    const r = await fetch(url, { cache:'no-store' });
    if (!r.ok) return NextResponse.json({ error:'WEATHER_FAIL' }, { status:502 });

    const { weights } = await r.json();
    const results = Object.entries(MENUS)
      .map(([name, coeff]) => ({ name, score: score(coeff, weights as W) }))
      .sort((a,b)=>b.score-a.score)
      .slice(0,3);

    return NextResponse.json({ weights, results });
  } catch (e:any) {
    return NextResponse.json({ error:'SERVER_ERROR', detail:String(e?.message||e) }, { status:500 });
  }
}

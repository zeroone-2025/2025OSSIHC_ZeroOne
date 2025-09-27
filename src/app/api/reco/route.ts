import { NextRequest, NextResponse } from 'next/server';
import { resolveWeather, type WeatherWeights } from '@/lib/weather';
import type { RecoRes } from '@/types';

type Coeff = { A: number; B: number; C: number; D: number; E: number; F: number; G: number; base: number };

const MENUS: Record<string, Coeff> = {
  '국밥':     { base: 0.5,  A: +0.9, B: -0.6, C: +0.5, D: +0.6, E: +0.7, F: -0.4, G: +0.3 },
  '칼국수':   { base: 0.5,  A: +0.8, B: -0.5, C: +0.4, D: +0.7, E: +0.5, F: -0.4, G: +0.2 },
  '파전':     { base: 0.4,  A: +0.4, B: -0.2, C: +0.6, D: +1.0, E: +0.2, F: -0.3, G: +0.1 },
  '냉면':     { base: 0.45, A: -0.6, B: +0.9, C: -0.2, D:  0.0, E:  0.0, F: +0.7, G: -0.2 },
  '메밀소바': { base: 0.4,  A: -0.5, B: +0.8, C: -0.2, D:  0.0, E:  0.0, F: +0.6, G: -0.2 },
  '어묵탕':   { base: 0.35, A: +0.9, B: -0.6, C: +0.4, D: +0.2, E: +0.9, F: -0.3, G: +0.2 },
  '비빔밥':   { base: 0.5,  A: +0.1, B: +0.1, C:  0.0, D:  0.0, E:  0.0, F: +0.1, G:  0.0 },
  '돈까스':   { base: 0.45, A: +0.1, B: -0.2, C: +0.1, D:  0.0, E:  0.0, F: -0.2, G: +0.3 },
};

function score(c: Coeff, w: WeatherWeights) {
  return c.base + c.A * w.W_cold + c.B * w.W_hot + c.C * w.W_gloom + c.D * w.W_rain + c.E * w.W_snow + c.F * w.W_humid + c.G * w.W_wind;
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'INVALID_COORDS' }, { status: 400 });
    }

    const result = await resolveWeather(lat, lng);
    const weights = result.weights;
    const menus = Object.entries(MENUS)
      .map(([name, coeff]) => ({ name, value: score(coeff, weights) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((item) => item.name);

    const payload: RecoRes = { flags: result.flags, menus };
    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'SERVER_ERROR' }, { status: 500 });
  }
}

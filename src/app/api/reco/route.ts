import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type Weights = {
  W_cold: number; W_hot: number;
  W_humidity: number; W_wind: number;
  W_sunny: number; W_cloudy: number;
  W_rain: number; W_snow: number;
};

// 메뉴 계수(A~H) 기본값 (없으면 균등 가중치로 시작)
// 필요시 확장: 메뉴군별로 계수 차등화
const DEFAULT_COEFF = {
  A: 0.9,  // cold +
  B: 0.9,  // hot +
  C: 0.3,  // sunny +
  D: 0.4,  // cloudy +
  E: 1.0,  // rain +
  F: 0.8,  // snow +
  G: 0.5,  // humidity +
  H: 0.5,  // wind +
};

function scoreMenu(name: string, w: Weights): number {
  // 간단한 이름 기반 힌트(국밥/라멘/찌개 = warm → cold에 우호, 냉면/소바 = hot에 우호 등)
  const n = name.toLowerCase();
  let A = DEFAULT_COEFF.A, B = DEFAULT_COEFF.B;
  if (/(국밥|라멘|우동|찌개|탕|수제비)/.test(n)) A += 0.2;
  if (/(냉면|소바|물회|샐러드)/.test(n)) B += 0.2;
  if (/(파전|칼국수|짬뽕)/.test(n)) DEFAULT_COEFF.E + 0.1;

  return (
    0.5
    + A * w.W_cold
    + B * w.W_hot
    + DEFAULT_COEFF.C * w.W_sunny
    + DEFAULT_COEFF.D * w.W_cloudy
    + DEFAULT_COEFF.E * w.W_rain
    + DEFAULT_COEFF.F * w.W_snow
    + DEFAULT_COEFF.G * w.W_humidity
    + DEFAULT_COEFF.H * w.W_wind
  );
}

function loadDataset() {
  try {
    const file = path.join(process.cwd(), "src", "data", "jommechu", "jommechu_dataset_v2_full.json");
    const txt = fs.readFileSync(file, "utf8");
    const arr = JSON.parse(txt);
    // 기대 형태: [{ name: string, ... }, ...]
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "INVALID_COORDS" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const wres = await fetch(new URL("/api/weather/live?lat=" + lat + "&lng=" + lng, base).toString(), { cache: "no-store" });
    if (!wres.ok) {
      // 날씨 실패 시 가을철 임시 가중치(선형 중간값) 적용
      const fallback: Weights = {
        W_cold: 0.4, W_hot: 0.2,
        W_humidity: 0.3, W_wind: 0.2,
        W_sunny: 0.5, W_cloudy: 0.5,
        W_rain: 0.3, W_snow: 0.0,
      };
      const dataset = loadDataset();
      const menus = (dataset.length ? dataset.map((d: any) => d?.name ?? d?.name_ko ?? d?.id) : ["국밥", "비빔밥", "칼국수", "파전", "냉면", "라멘"])
        .filter((name: unknown): name is string => typeof name === "string" && name.length > 0)
        .slice(0, 100)
        .map((name) => ({ name, score: scoreMenu(name, fallback) }))
        .map((menu) => ({ ...menu, score: Number.isFinite(menu.score) ? menu.score : 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      return NextResponse.json({ weights: fallback, menus });
    }

    const { weights, raw } = await wres.json() as { weights: Weights; raw: any };
    const dataset = loadDataset();

    const pool: string[] = dataset.length
      ? dataset
          .map((d: any) => d?.name ?? d?.name_ko ?? d?.id)
          .filter((name: unknown): name is string => typeof name === "string" && name.length > 0)
      : ["국밥", "비빔밥", "칼국수", "파전", "냉면", "라멘", "우동", "김치찌개", "돈까스"];

    const rawMenus = pool.slice(0, 200)
      .map((name) => ({ name, score: scoreMenu(name, weights) }));

    const safeMenus = Array.isArray(rawMenus)
      ? rawMenus.map((menu) => ({ ...menu, score: Number.isFinite(menu.score) ? menu.score : 0 }))
      : [];
    const sortedMenus = safeMenus.sort((a, b) => b.score - a.score).slice(0, 10);

    return NextResponse.json({ raw, weights, menus: sortedMenus });
  } catch (e: any) {
    return NextResponse.json({ error: "SERVER_ERROR", detail: String(e?.message || e) }, { status: 500 });
  }
}

// 서버 실행 후 아래 확인:
// 1) 날씨 API
// curl -s "http://localhost:8080/api/weather/live?lat=37.5665&lng=126.9780" | jq '.'
// 2) 추천 API
// curl -s -X POST http://localhost:8080/api/reco \
//  -H "Content-Type: application/json" \
//  -d '{"lat":37.5665,"lng":126.9780}' | jq '.'

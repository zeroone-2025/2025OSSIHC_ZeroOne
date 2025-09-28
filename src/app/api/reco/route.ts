import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import {
  deriveFlags,
  getAutumnFallback,
  getCurrentSeason,
  type WeatherContext,
  type WeatherFlags,
} from "@/lib/reco-core";

type Weights = {
  W_cold: number; W_hot: number;
  W_humidity: number; W_wind: number;
  W_sunny: number; W_cloudy: number;
  W_rain: number; W_snow: number;
};

// 날씨 데이터를 flags로 변환하는 함수
function generateWeatherFlags(raw: any): string[] {
  const flags: string[] = [];

  if (!raw) return flags;

  // raw.processed에서 처리된 데이터 추출 (fallback으로 raw 직접 접근)
  const processed = raw.processed || raw;

  // 온도 기반
  if (typeof processed.T1H === 'number') {
    if (processed.T1H >= 28) flags.push('hot');
    if (processed.T1H <= 5) flags.push('cold');
  }

  // 강수 형태
  if (processed.PTY) {
    if (processed.PTY === 1 || processed.PTY === 4) flags.push('rain');
    if (processed.PTY === 2 || processed.PTY === 3) flags.push('snow');
  }

  // 하늘 상태
  if (processed.SKY) {
    if (processed.SKY >= 3) flags.push('cloudy');
  }

  // 습도
  if (typeof processed.REH === 'number' && processed.REH >= 80) {
    flags.push('humid');
  }

  // 풍속
  if (typeof processed.WSD === 'number' && processed.WSD >= 4) {
    flags.push('windy');
  }

  return flags;
}

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

const DEFAULT_ITEM_WEIGHTS: MenuPreferenceWeights = {
  weather: {
    sunny: 0.5,
    cloudy: 0.5,
    rainy: 0.5,
    snowy: 0.5,
    temperature: 0.5,
    humidity: 0.5,
    wind: 0.5,
  },
  season: {
    spring: 0.5,
    summer: 0.5,
    autumn: 0.5,
    winter: 0.5,
  },
  day: {
    weekday: 0.5,
    weekend: 0.5,
  },
};

function cloneDefaultWeights(): MenuPreferenceWeights {
  return {
    weather: { ...DEFAULT_ITEM_WEIGHTS.weather },
    season: { ...DEFAULT_ITEM_WEIGHTS.season },
    day: { ...DEFAULT_ITEM_WEIGHTS.day },
  };
}

function scoreMenu(name: string, w: Weights): number {
  // 간단한 이름 기반 힌트(국밥/라멘/찌개 = warm → cold에 우호, 냉면/소바 = hot에 우호 등)
  const n = name.toLowerCase();
  let A = DEFAULT_COEFF.A, B = DEFAULT_COEFF.B;
  if (/(국밥|라멘|우동|찌개|탕|수제비)/.test(n)) A += 0.2;
  if (/(냉면|소바|물회|샐러드)/.test(n)) B += 0.2;
  if (/(파전|칼국수|짬뽕)/.test(n)) DEFAULT_COEFF.E + 0.1;

  const base = 0.5;
  const { C, D, E, F, G, H } = DEFAULT_COEFF;
  const contribution =
    A * w.W_cold +
    B * w.W_hot +
    C * w.W_sunny +
    D * w.W_cloudy +
    E * w.W_rain +
    F * w.W_snow +
    G * w.W_humidity +
    H * w.W_wind;

  const rawScore = base + contribution;
  const maxScore = base + A + B + C + D + E + F + G + H;
  const normalized = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;

  // NOTE: 메뉴 점수는 항상 0~100 사이로 정규화됩니다.
  return Math.min(100, Math.max(0, normalized));
}

type MenuPreferenceWeights = {
  weather?: {
    sunny?: number;
    cloudy?: number;
    rainy?: number;
    snowy?: number;
    temperature?: number;
    humidity?: number;
    wind?: number;
  };
  season?: {
    spring?: number;
    summer?: number;
    autumn?: number;
    winter?: number;
  };
  day?: {
    weekday?: number;
    weekend?: number;
  };
};

type DatasetItem = {
  id?: string;
  name?: string;
  name_ko?: string;
  name_en?: string;
  picture?: string;
  weights?: MenuPreferenceWeights;
};

function loadDataset(): DatasetItem[] {
  try {
    const file = path.join(process.cwd(), "src", "data", "jommechu", "jommechu_dataset_v2_full.json");
    const txt = fs.readFileSync(file, "utf8");
    const arr = JSON.parse(txt);
    // 기대 형태: [{ name_ko, picture, ... }, ...]
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function parseNumber(input: unknown): number | undefined {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }
  if (typeof input === "string") {
    const parsed = parseFloat(input);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function buildWeatherContext(raw: any): WeatherContext {
  const fallback = getAutumnFallback();
  if (!raw) {
    return fallback;
  }

  const processed = raw.processed || raw || {};
  const temperature = parseNumber(processed.T1H) ?? fallback.temperature;
  const humidity = parseNumber(processed.REH) ?? fallback.humidity;
  const windSpeed = parseNumber(processed.WSD) ?? fallback.windSpeed;

  const skyRaw = parseNumber(processed.SKY);
  let skyCondition: WeatherContext["skyCondition"] = fallback.skyCondition;
  if (typeof skyRaw === "number") {
    if (skyRaw >= 4) skyCondition = 4;
    else if (skyRaw >= 3) skyCondition = 3;
    else skyCondition = 1;
  }

  const ptyRaw = parseNumber(processed.PTY);
  const precipitationType = (typeof ptyRaw === "number"
    ? Math.max(0, Math.min(7, Math.round(ptyRaw)))
    : fallback.precipitationType) as WeatherContext["precipitationType"];

  const precipitationAmount =
    parseNumber(processed.RN1 ?? processed.PCP) ?? fallback.precipitationAmount;
  const snowAmount = parseNumber(processed.SNO) ?? fallback.snowAmount;

  return {
    temperature,
    humidity,
    windSpeed,
    skyCondition,
    precipitationType,
    precipitationAmount,
    snowAmount,
  };
}

function normalizeWeatherPreferences(
  prefs: MenuPreferenceWeights["weather"] | undefined,
  flags: WeatherFlags,
): number {
  if (!prefs) return 0.5;

  const entries: Array<{ weight: number; value: number }> = [];

  const safePush = (weight: number | undefined, value: number) => {
    if (typeof weight === "number") {
      entries.push({ weight: Math.max(0, weight), value: Math.max(0, value) });
    }
  };

  safePush(prefs.sunny, flags.sunny);
  safePush(prefs.cloudy, flags.cloudy);
  safePush(prefs.rainy, flags.rainy);
  safePush(prefs.snowy, flags.snowy);
  safePush(prefs.humidity, flags.humid);
  safePush(prefs.wind, flags.windy);

  if (typeof prefs.temperature === "number") {
    const tempPref = Math.max(0, Math.min(1, prefs.temperature));
    const warmAffinity = tempPref * flags.hot;
    const coolAffinity = (1 - tempPref) * flags.cold;
    entries.push({ weight: tempPref, value: warmAffinity });
    entries.push({ weight: 1 - tempPref, value: coolAffinity });
  }

  const totalWeight = entries.reduce((acc, entry) => acc + entry.weight, 0);
  if (totalWeight <= 0) return 0.5;

  const weightedSum = entries.reduce((acc, entry) => acc + entry.value, 0);
  return Math.min(1, Math.max(0, weightedSum / totalWeight));
}

function computeDatasetScore(
  item: DatasetItem,
  flags: WeatherFlags,
  season: ReturnType<typeof getCurrentSeason>,
  isWeekend: boolean,
): number {
  const prefs = item.weights;
  if (!prefs) return 50;

  const weatherScore = normalizeWeatherPreferences(prefs.weather, flags);
  const seasonScore = (() => {
    if (!prefs.season) return 0.5;
    const value = prefs.season[season];
    return typeof value === "number" ? Math.min(1, Math.max(0, value)) : 0.5;
  })();

  const dayScore = (() => {
    if (!prefs.day) return 0.5;
    const key = isWeekend ? "weekend" : "weekday";
    const value = prefs.day[key];
    return typeof value === "number" ? Math.min(1, Math.max(0, value)) : 0.5;
  })();

  const combined = weatherScore * 0.6 + seasonScore * 0.25 + dayScore * 0.15;
  return Math.min(100, Math.max(0, combined * 100));
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "INVALID_COORDS" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const wres = await fetch(new URL("/api/weather/live?lat=" + lat + "&lng=" + lng, base).toString(), { cache: "no-store" });

    let weights: Weights;
    let rawWeatherData: any = null;

    if (!wres.ok) {
      console.warn("Weather API failed, using fallback weights");
      // 날씨 실패 시 가을철 임시 가중치(선형 중간값) 적용
      weights = {
        W_cold: 0.4, W_hot: 0.2,
        W_humidity: 0.3, W_wind: 0.2,
        W_sunny: 0.5, W_cloudy: 0.5,
        W_rain: 0.3, W_snow: 0.0,
      };
    } else {
      try {
        const weatherData = await wres.json();
        weights = weatherData.weights || {};
        rawWeatherData = weatherData.raw;

        // 가중치가 비어있는 경우 fallback 사용
        if (!weights || Object.keys(weights).length === 0) {
          console.warn("Empty weights from weather API, using fallback");
          weights = {
            W_cold: 0.4, W_hot: 0.2,
            W_humidity: 0.3, W_wind: 0.2,
            W_sunny: 0.5, W_cloudy: 0.5,
            W_rain: 0.3, W_snow: 0.0,
          };
        }
      } catch (parseError) {
        console.warn("Failed to parse weather API response, using fallback weights");
        weights = {
          W_cold: 0.4, W_hot: 0.2,
          W_humidity: 0.3, W_wind: 0.2,
          W_sunny: 0.5, W_cloudy: 0.5,
          W_rain: 0.3, W_snow: 0.0,
        };
      }
    }
    const dataset = loadDataset();
    const weatherContext = buildWeatherContext(rawWeatherData);
    const weatherFlags = deriveFlags(weatherContext);
    const season = getCurrentSeason();
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    const pool: DatasetItem[] = dataset.length
      ? dataset.filter((item) => {
          const label = item?.name_ko ?? item?.name ?? item?.id;
          return typeof label === "string" && label.length > 0;
        })
      : [
          { id: "gukbap", name_ko: "국밥", weights: cloneDefaultWeights() },
          { id: "bibimbap", name_ko: "비빔밥", weights: cloneDefaultWeights() },
          { id: "kalguksu", name_ko: "칼국수", weights: cloneDefaultWeights() },
          { id: "pajeon", name_ko: "파전", weights: cloneDefaultWeights() },
          { id: "naengmyeon", name_ko: "냉면", weights: cloneDefaultWeights() },
          { id: "ramen", name_ko: "라멘", weights: cloneDefaultWeights() },
          { id: "udon", name_ko: "우동", weights: cloneDefaultWeights() },
          { id: "kimchijjigae", name_ko: "김치찌개", weights: cloneDefaultWeights() },
          { id: "porkcutlet", name_ko: "돈까스", weights: cloneDefaultWeights() },
        ];

    const rawMenus = pool.slice(0, 200).map((item) => {
      const label = item.name_ko ?? item.name ?? item.id ?? "메뉴";
      const baseScore = scoreMenu(label, weights);
      const datasetScore = computeDatasetScore(item, weatherFlags, season, isWeekend);
      const finalScore = Math.min(100, Math.max(0, baseScore * 0.4 + datasetScore * 0.6));

      return {
        id: item.id ?? label,
        name: label,
        name_ko: item.name_ko ?? label,
        name_en: item.name_en,
        picture: item.picture,
        score: finalScore,
      };
    });

    const safeMenus = Array.isArray(rawMenus)
      ? rawMenus.map((menu) => ({
          ...menu,
          score: Number.isFinite(menu.score) ? menu.score : 0,
        }))
      : [];
    const topMenus = safeMenus.sort((a, b) => b.score - a.score).slice(0, 10);

    const MVP_MIN_SCORE = 70;
    const MVP_MAX_SCORE = 100;
    const highestScore = topMenus[0]?.score ?? 0;
    const lowestScore = topMenus[topMenus.length - 1]?.score ?? highestScore;
    const scoreRange = Math.max(0, highestScore - lowestScore);

    const sortedMenus = topMenus.map((menu, index) => {
      let boosted: number;
      if (scoreRange > 0) {
        const ratio = (menu.score - lowestScore) / scoreRange;
        boosted = MVP_MIN_SCORE + ratio * (MVP_MAX_SCORE - MVP_MIN_SCORE);
      } else {
        const step = topMenus.length > 1 ? (MVP_MAX_SCORE - MVP_MIN_SCORE) / (topMenus.length - 1) : 0;
        boosted = MVP_MAX_SCORE - index * step;
      }

      return {
        ...menu,
        score: Math.min(MVP_MAX_SCORE, Math.max(0, boosted)),
      };
    });

    // 날씨 데이터로부터 flags 생성
    const flags = generateWeatherFlags(rawWeatherData);

    return NextResponse.json({
      menus: sortedMenus,
      weights,
      raw: rawWeatherData,
      flags
    });
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

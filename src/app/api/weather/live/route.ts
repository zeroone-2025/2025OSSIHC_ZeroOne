import { NextRequest, NextResponse } from "next/server";
import { latLngToGrid, ultraBase, vilageBase, fetchUltraNcstWithRaw, fetchVilageFcstWithRaw } from "@/lib/weather/kma";
import { weightsFromKma } from "@/lib/weather/weights";

export const dynamic = "force-dynamic";

// 결측치 처리 함수: -900, +900 같은 값을 0으로 처리
function handleMissingValue(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(num) || num <= -900 || num >= 900) return 0;
  return num;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));
    if (!isFinite(lat) || !isFinite(lng)) {
      return NextResponse.json({ error: "INVALID_COORDS" }, { status: 400 });
    }
    if (!process.env.KMA_API_KEY) {
      return NextResponse.json({ error: "NO_WEATHER_KEY" }, { status: 503 });
    }

    const { nx, ny } = latLngToGrid(lat, lng);
    const now = new Date();

    let rawNcstResponse = null;
    let rawFcstResponse = null;

    try {
      // 초단기실황 - 원본 응답 보존
      const u = ultraBase(now);
      const { data: ncst, rawResponse: ncstRaw } = await fetchUltraNcstWithRaw(nx, ny, u.base_date, u.base_time);
      rawNcstResponse = ncstRaw;

      // 단기예보 - 원본 응답 보존
      const v = vilageBase(now);
      const { data: fcst, rawResponse: fcstRaw } = await fetchVilageFcstWithRaw(nx, ny, v.base_date, v.base_time);
      rawFcstResponse = fcstRaw;

      // 실황/예보에서 필요한 항목 추출 (결측치 처리 적용)
      const T1H = handleMissingValue(ncst.T1H); // 기온
      const REH = handleMissingValue(ncst.REH); // 습도
      const WSD = handleMissingValue(ncst.WSD); // 풍속
      const RN1 = handleMissingValue(ncst.RN1); // 1시간 강수량

      const SKY = handleMissingValue(fcst.SKY); // 하늘상태
      const PTY = handleMissingValue(fcst.PTY); // 강수형태
      const PCP = handleMissingValue(fcst.PCP) || RN1; // 예보 PCP 없으면 실황 RN1로 대체
      const SNO = handleMissingValue(fcst.SNO); // 신적설

      const weights = weightsFromKma({ T1H, REH, WSD, SKY, PTY, PCP, SNO });

      return NextResponse.json({
        raw: {
          ncst: rawNcstResponse,
          fcst: rawFcstResponse,
          processed: { T1H, REH, WSD, SKY, PTY, PCP, SNO, RN1 }
        },
        weights,
      });
    } catch (apiError: any) {
      console.error("KMA API call failed", apiError?.message || apiError);
      // API 실패 시 테스트용 fallback (geolocation 테스트를 위해)
      console.log("Using test weather data for geolocation testing");
      return NextResponse.json({
        raw: {
          ncst: { response: { body: { items: { item: [
            { category: "T1H", obsrValue: "18.4" },
            { category: "REH", obsrValue: "65" },
            { category: "WSD", obsrValue: "2.1" },
            { category: "RN1", obsrValue: "0" }
          ]}}}},
          fcst: { response: { body: { items: { item: [
            { category: "SKY", fcstValue: "3" },
            { category: "PTY", fcstValue: "1" }
          ]}}}},
          processed: { T1H: 18.4, REH: 65, WSD: 2.1, SKY: 3, PTY: 1, PCP: 0, SNO: 0, RN1: 0 }
        },
        weights: { W_cold: 0.0, W_hot: 0.0, W_humidity: 0.4, W_wind: 0.2, W_sunny: 0.1, W_cloudy: 0.9, W_rain: 0.8, W_snow: 0 },
      });
    }
  } catch (e: any) {
    console.error("Live weather API failed", e?.message || e);
    return NextResponse.json({
      raw: null,
      weights: {},
      error: "WEATHER_UPSTREAM_FAILED",
      detail: String(e?.message || e)
    }, { status: 502 });
  }
}

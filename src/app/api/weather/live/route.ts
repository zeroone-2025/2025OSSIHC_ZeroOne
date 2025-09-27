import { NextRequest, NextResponse } from "next/server";
import { latLngToGrid, ultraBase, vilageBase, fetchUltraNcst, fetchVilageFcst } from "@/lib/weather/kma";
import { weightsFromKma } from "@/lib/weather/weights";

export const dynamic = "force-dynamic";

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

    // 초단기실황
    const u = ultraBase(now);
    const ncst = await fetchUltraNcst(nx, ny, u.base_date, u.base_time);

    // 단기예보
    const v = vilageBase(now);
    const fcst = await fetchVilageFcst(nx, ny, v.base_date, v.base_time);

    // 실황/예보에서 필요한 항목 추출
    const T1H = ncst.T1H; // 기온
    const REH = ncst.REH; // 습도
    const WSD = ncst.WSD; // 풍속
    const RN1 = ncst.RN1; // 1시간 강수량(실황문자 가능)

    const SKY = fcst.SKY; // 하늘상태 1/3/4
    const PTY = fcst.PTY; // 강수형태
    const PCP = fcst.PCP ?? RN1; // 예보 PCP 없으면 실황 RN1로 대체
    const SNO = fcst.SNO; // 신적설

    const weights = weightsFromKma({ T1H, REH, WSD, SKY, PTY, PCP, SNO });

    return NextResponse.json({
      raw: { T1H, REH, WSD, SKY, PTY, PCP, SNO },
      weights,
    });
  } catch (e: any) {
    console.error("Live weather API failed", e?.message || e);
    return NextResponse.json({ error: "WEATHER_UPSTREAM_FAILED", detail: String(e?.message || e) }, { status: 502 });
  }
}

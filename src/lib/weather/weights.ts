export type Weights = {
  W_cold: number; W_hot: number;
  W_humidity: number; W_wind: number;
  W_sunny: number; W_cloudy: number;
  W_rain: number; W_snow: number;
};

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

// 결측치 처리: -900, +900 계열은 0 처리
function isMissing(v: unknown) {
  if (v == null) return true;
  const n = Number(v);
  return !isFinite(n) || n <= -900 || n >= 900;
}

// PCP/SNO 문자열 파서 (예: "1.0mm", "1mm 미만", "50.0mm 이상", "0.5cm 미만", "5.0cm 이상")
function parseAmount(val: string): number | null {
  if (!val) return null;
  const s = String(val).trim();
  if (/이상$/.test(s)) {
    const num = parseFloat(s);
    return isFinite(num) ? num : null;
  }
  if (/미만$/.test(s)) {
    const num = parseFloat(s);
    return isFinite(num) ? Math.max(0, num - 0.01) : null; // 미만은 살짝 낮춰 처리
  }
  const num = parseFloat(s);
  return isFinite(num) ? num : null;
}

export function weightsFromKma(params: {
  T1H?: string | number;    // 기온
  REH?: string | number;    // 습도
  WSD?: string | number;    // 풍속
  SKY?: string | number;    // 하늘상태코드 1,3,4
  PTY?: string | number;    // 강수형태
  PCP?: string;             // 1시간 강수량 (문자)
  SNO?: string;             // 1시간 신적설 (문자)
}): Weights {
  const {
    T1H, REH, WSD, SKY, PTY, PCP, SNO
  } = params;

  // 2.1 Temperature → W_cold, W_hot
  let W_cold = 0, W_hot = 0;
  if (!isMissing(T1H)) {
    const t = Number(T1H);
    if (t <= 10) W_cold = 1;
    else if (t < 22) W_cold = (22 - t) / 12;
    else W_cold = 0;

    if (t >= 28) W_hot = 1;
    else if (t >= 22) W_hot = (t - 22) / 6;
    else W_hot = 0;
  }

  // 2.4 SKY → W_sunny, W_cloudy
  let W_sunny = 0, W_cloudy = 0;
  if (!isMissing(SKY)) {
    const s = Number(SKY);
    if (s === 1) { W_sunny = 1.0; W_cloudy = 0.1; }
    else if (s === 3) { W_sunny = 0.3; W_cloudy = 0.8; }
    else if (s === 4) { W_sunny = 0.1; W_cloudy = 1.0; }
  }

  // 2.5 PTY/PCP, SNO → W_rain, W_snow
  let W_rain = 0, W_snow = 0;
  const pty = isMissing(PTY) ? 0 : Number(PTY);
  // rain
  if ([1, 2, 4, 5].includes(pty)) {
    const pcp = parseAmount(PCP ?? "");
    if (pcp == null) {
      W_rain = 0.4; // 모르면 약한 비로
    } else if (pcp < 1.0) W_rain = 0.4;
    else if (pcp < 30.0) W_rain = 0.8;
    else if (pcp <= 50.0) W_rain = 0.95;
    else W_rain = 1.0;
  }
  // snow
  if ([2, 3, 6, 7].includes(pty)) {
    const sno = parseAmount(SNO ?? "");
    if (sno == null) {
      W_snow = 0.3;
    } else if (sno < 0.5) W_snow = 0.3;
    else if (sno < 5.0) W_snow = 0.7;
    else W_snow = 1.0;
  }

  // 2.2 Humidity → W_humidity
  let W_humidity = 0;
  if (!isMissing(REH)) {
    const h = Number(REH);
    if (h < 60) W_humidity = 0;
    else if (h <= 90) W_humidity = (h - 60) / 30;
    else W_humidity = 1;
  }

  // 2.3 Wind → W_wind
  let W_wind = 0;
  if (!isMissing(WSD)) {
    const w = Number(WSD);
    if (w < 3.4) W_wind = 0.2;
    else if (w < 5.5) W_wind = 0.45;
    else if (w < 10.8) W_wind = 0.8;
    else W_wind = 1.0;
  }

  // ⭐ 강수 보정: W_rain 또는 W_snow >= 0.3이면 sunny down / cloudy up
  if (W_rain >= 0.3 || W_snow >= 0.3) {
    W_sunny = Math.min(W_sunny, 0.2);
    W_cloudy = Math.max(W_cloudy, 0.8);
  }

  return {
    W_cold: clamp01(W_cold),
    W_hot: clamp01(W_hot),
    W_humidity: clamp01(W_humidity),
    W_wind: clamp01(W_wind),
    W_sunny: clamp01(W_sunny),
    W_cloudy: clamp01(W_cloudy),
    W_rain: clamp01(W_rain),
    W_snow: clamp01(W_snow),
  };
}

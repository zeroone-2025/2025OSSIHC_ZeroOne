import type { WeatherFlags, WeatherMeta } from '@/types';

type Wx = {
  T1H?: number;
  RN1?: number;
  PTY?: number;
  SKY?: number;
  REH?: number;
  WSD?: number;
  SNO?: number;
};

export type WeatherWeights = {
  W_cold: number;
  W_hot: number;
  W_gloom: number;
  W_rain: number;
  W_snow: number;
  W_humid: number;
  W_wind: number;
};

const KMA_HOST = 'http://apis.data.go.kr/1360000';
const SERVICE = 'VilageFcstInfoService_2.0/getUltraSrtNcst';

const DEFAULT_WEIGHTS: WeatherWeights = {
  W_cold: 0,
  W_hot: 0,
  W_gloom: 0,
  W_rain: 0,
  W_snow: 0,
  W_humid: 0,
  W_wind: 0,
};

type ResolveResult = {
  wx: Wx;
  weights: WeatherWeights;
  flags: WeatherFlags[];
  meta: WeatherMeta;
};

function toGrid(lat: number, lon: number) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const sl1 = SLAT1 * DEGRAD;
  const sl2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + sl2 * 0.5) / Math.tan(Math.PI * 0.25 + sl1 * 0.5);
  sn = Math.log(Math.cos(sl1) / Math.cos(sl2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + sl1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(sl1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);
  const ra = Math.tan(Math.PI * 0.25 + (lat * DEGRAD) * 0.5);
  const r = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;
  const nx = Math.floor(r * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - r * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}

function kstBase() {
  const now = new Date();
  const base = new Date(now.getTime() - 40 * 60 * 1000);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  const H = String(base.getHours()).padStart(2, '0');
  return { base_date: `${y}${m}${d}`, base_time: `${H}00` };
}

function parseRN1(v: unknown) {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (s.includes('강수없음')) return 0;
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function weights(wx: Wx): WeatherWeights {
  const T = wx.T1H ?? 20;
  const RN1 = wx.RN1 ?? 0;
  const PTY = wx.PTY ?? 0;
  const SKY = wx.SKY ?? 1;
  const REH = wx.REH ?? 50;
  const WSD = wx.WSD ?? 2;
  const SNO = wx.SNO;

  let W_cold = 0;
  let W_hot = 0;
  if (T <= 10) W_cold = 1.0;
  else if (T < 22) W_cold = (22 - T) / 12;
  if (T >= 28) W_hot = 1.0;
  else if (T >= 22) W_hot = (T - 22) / 6;

  const W_gloom = SKY === 4 ? 1.0 : SKY === 3 ? 0.5 : 0.0;

  let W_rain = 0;
  let W_snow = 0;
  const rainish = [1, 4, 5].includes(PTY);
  const snowish = [3, 6, 7].includes(PTY);
  if (PTY === 2) {
    if (T > 1) {
      if (RN1 > 5) W_rain = 1.0;
      else if (RN1 >= 1) W_rain = 0.8;
      else W_rain = 0.4;
    } else {
      const sno = SNO ?? RN1 / 2;
      if (sno > 2.0) W_snow = 1.0;
      else if (sno >= 0.5) W_snow = 0.7;
      else W_snow = 0.3;
    }
  } else if (rainish) {
    if (RN1 > 5) W_rain = 1.0;
    else if (RN1 >= 1) W_rain = 0.8;
    else W_rain = 0.4;
  } else if (snowish) {
    const sno = SNO ?? RN1 / 2;
    if (sno > 2.0) W_snow = 1.0;
    else if (sno >= 0.5) W_snow = 0.7;
    else W_snow = 0.3;
  }

  let W_humid = 0;
  if (REH > 90) W_humid = 1.0;
  else if (REH >= 60) W_humid = (REH - 60) / 30;

  let W_wind = 0;
  if (WSD > 14) W_wind = 1.0;
  else if (WSD >= 9) W_wind = 0.7;
  else if (WSD >= 4) W_wind = 0.3;

  return { W_cold, W_hot, W_gloom, W_rain, W_snow, W_humid, W_wind };
}

function deriveFlags(wx: Wx, w: WeatherWeights): WeatherFlags[] {
  const out: WeatherFlags[] = [];
  const push = (flag: WeatherFlags) => {
    if (!out.includes(flag)) out.push(flag);
  };

  const temp = wx.T1H ?? 20;
  if (w.W_cold >= 0.4 || temp <= 10) push('cold');
  if (w.W_hot >= 0.4 || temp >= 28) push('hot');
  if (w.W_rain >= 0.4 || [1, 2, 4, 5].includes(wx.PTY ?? -1)) push('rain');
  if (w.W_snow >= 0.3 || [2, 3, 6, 7].includes(wx.PTY ?? -1)) push('snow');
  if (w.W_humid >= 0.5 || (wx.REH ?? 0) >= 85) push('humid');
  if (w.W_wind >= 0.4 || (wx.WSD ?? 0) >= 9) push('windy');
  if ((wx.SKY ?? 0) >= 3) push('cloudy');
  if (w.W_gloom >= 0.4 || (wx.SKY ?? 0) === 4) push('gloom');

  return out;
}

export async function resolveWeather(lat: number, lng: number): Promise<ResolveResult> {
  const { nx, ny } = toGrid(lat, lng);
  const { base_date, base_time } = kstBase();
  const meta: WeatherMeta = { base_date, base_time, nx, ny };
  let wx: Wx = {};

  const key = process.env.KMA_API_KEY;
  if (key) {
    const url = `${KMA_HOST}/${SERVICE}?serviceKey=${key}&numOfRows=50&pageNo=1&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json().catch(() => null);
        const items = j?.response?.body?.items?.item ?? [];
        const nextWx: Wx = {};
        for (const it of items) {
          const c = it.category;
          const v = it.obsrValue;
          if (c === 'T1H') nextWx.T1H = Number(v);
          else if (c === 'RN1') nextWx.RN1 = parseRN1(v);
          else if (c === 'PTY') nextWx.PTY = Number(v);
          else if (c === 'SKY') nextWx.SKY = Number(v);
          else if (c === 'REH') nextWx.REH = Number(v);
          else if (c === 'WSD') nextWx.WSD = Number(v);
          else if (c === 'SNO') nextWx.SNO = Number(v);
        }
        wx = nextWx;
      }
    } catch {
      wx = {};
    }
  }

  meta.T = wx.T1H;
  meta.RH = wx.REH;
  meta.SKY = wx.SKY;
  meta.PTY = wx.PTY;
  meta.PCP = wx.RN1;
  meta.SNO = wx.SNO;
  meta.WSD = wx.WSD;

  const w = weights(wx);
  const flags = deriveFlags(wx, w);

  return { wx, weights: w ?? DEFAULT_WEIGHTS, flags, meta };
}

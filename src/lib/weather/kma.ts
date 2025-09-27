import { z } from "zod";

const KMA_KEY = process.env.KMA_API_KEY;
if (!KMA_KEY) {
  console.warn("[KMA] Missing KMA_API_KEY. Weather API will fail until provided.");
}

export type Grid = { nx: number; ny: number };

export function latLngToGrid(lat: number, lng: number): Grid {
  // Vworld/Lambert 계열이 아닌 KMA(DFS) 격자 변환 (기초값)
  // 출처: 기상청 제공 표준 알고리즘(간단화 버전)
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
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}

// 시각 유틸: 초단기실황(base_time = HH00, 당일; 40분 전 기준으로 안전 보정)
export function ultraBase(now: Date) {
  const t = new Date(now);
  t.setMinutes(t.getMinutes() - 40);
  const ymd = ymdStr(t);
  const hh = hhStr(t);
  return { base_date: ymd, base_time: `${hh}00` };
}

// 단기예보: 발표 시각(02,05,08,11,14,17,20,23) + 15분 이후 호출 권장
// 가장 가까운 과거 발표시각을 잡아 base_date/time 산정
export function vilageBase(now: Date) {
  const slots = [2, 5, 8, 11, 14, 17, 20, 23];
  const t = new Date(now);
  t.setMinutes(t.getMinutes() - 20); // 여유 보정
  let hh = t.getHours();
  let pick = 2;
  for (const s of slots) if (s <= hh) pick = s;
  // 00~01시는 전일 23시 발표 사용
  if (hh < 2) {
    t.setDate(t.getDate() - 1);
    pick = 23;
  }
  const ymd = ymdStr(t);
  const base_time = (pick < 10 ? `0${pick}` : `${pick}`) + "00";
  return { base_date: ymd, base_time };
}

function ymdStr(d: Date) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${y}${m}${dd}`;
}
function hhStr(d: Date) {
  return d.getHours().toString().padStart(2, "0");
}

const NcstItem = z.object({
  category: z.string(),
  obsrValue: z.union([z.string(), z.number()]),
});
const FcstItem = z.object({
  category: z.string(),
  fcstValue: z.union([z.string(), z.number()]),
});

type NcstMap = Record<string, string>;
type FcstMap = Record<string, string>;

export async function fetchUltraNcst(nx: number, ny: number, base_date: string, base_time: string) {
  const url = new URL("http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst");
  url.searchParams.set("serviceKey", KMA_KEY || "");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "60");
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", base_date);
  url.searchParams.set("base_time", base_time);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`UltraNcst HTTP ${res.status}`);
  const json = await res.json();
  const items = json?.response?.body?.items?.item ?? [];
  const map: NcstMap = {};
  for (const it of items) {
    const p = NcstItem.safeParse(it);
    if (p.success) map[p.data.category] = String(p.data.obsrValue);
  }
  return map; // keys: T1H, REH, WSD, RN1 등
}

export async function fetchVilageFcst(nx: number, ny: number, base_date: string, base_time: string) {
  const url = new URL("http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst");
  url.searchParams.set("serviceKey", KMA_KEY || "");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "300");
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", base_date);
  url.searchParams.set("base_time", base_time);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`VilageFcst HTTP ${res.status}`);
  const json = await res.json();
  const items = json?.response?.body?.items?.item ?? [];
  const map: FcstMap = {};
  // 가장 가까운 현재시각(hour) 예보 1개를 잡는 단순화: 같은 카테고리의 첫 값 사용
  for (const it of items) {
    const p = FcstItem.safeParse(it);
    if (p.success && map[p.data.category] === undefined) {
      map[p.data.category] = String(p.data.fcstValue);
    }
  }
  return map; // keys: SKY, PTY, PCP, SNO 등(문자값 포함)
}

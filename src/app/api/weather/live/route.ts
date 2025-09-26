// src/app/api/weather/live/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Wx = {
  T1H?: number;   // 기온 ℃
  RN1?: number;   // 1시간 강수량 mm (문자일 수 있어 파싱 필요)
  PTY?: number;   // 강수형태 (0없음 1비 2비/눈 3눈 4소나기 5빗방울 6빗눈 7눈날림)
  SKY?: number;   // 하늘상태 (1맑음 3구름많음 4흐림)
  REH?: number;   // 습도 %
  WSD?: number;   // 풍속 m/s
  SNO?: number;   // (초단실황엔 보통 없음) 눈 적설 cm, 없으면 undefined
};

type Weights = {
  W_cold: number; W_hot: number; W_gloom: number;
  W_rain: number; W_snow: number; W_humid: number; W_wind: number;
};

const KMA_HOST = 'http://apis.data.go.kr/1360000';
const SERVICE = 'VilageFcstInfoService_2.0/getUltraSrtNcst';

function toGrid(lat:number, lon:number){
  // KMA LCC DFS
  const RE=6371.00877, GRID=5.0, SLAT1=30.0, SLAT2=60.0, OLON=126.0, OLAT=38.0, XO=43, YO=136;
  const DEGRAD=Math.PI/180.0;
  const re=RE/GRID, sl1=SLAT1*DEGRAD, sl2=SLAT2*DEGRAD, olon=OLON*DEGRAD, olat=OLAT*DEGRAD;
  let sn=Math.tan(Math.PI*0.25 + sl2*0.5)/Math.tan(Math.PI*0.25 + sl1*0.5);
  sn=Math.log(Math.cos(sl1)/Math.cos(sl2))/Math.log(sn);
  let sf=Math.tan(Math.PI*0.25 + sl1*0.5); sf=Math.pow(sf,sn)*Math.cos(sl1)/sn;
  let ro=Math.tan(Math.PI*0.25 + olat*0.5); ro=re*sf/Math.pow(ro,sn);
  const ra=Math.tan(Math.PI*0.25 + (lat*DEGRAD)*0.5); const r=re*sf/Math.pow(ra,sn);
  let theta=lon*DEGRAD-olon; if(theta>Math.PI) theta-=2*Math.PI; if(theta<-Math.PI) theta+=2*Math.PI; theta*=sn;
  const nx=Math.floor(r*Math.sin(theta)+XO+0.5); const ny=Math.floor(ro-r*Math.cos(theta)+YO+0.5);
  return { nx, ny };
}

// 초단기실황은 정시+10분경 업데이트 → 40분 전 기준으로 맞춤
function kstBase(){
  const now = new Date();
  // Use server local time; subtract 40 minutes for safety
  const base = new Date(now.getTime() - 40*60*1000);
  const y = base.getFullYear();
  const m = String(base.getMonth()+1).padStart(2,'0');
  const d = String(base.getDate()).padStart(2,'0');
  const H = String(base.getHours()).padStart(2,'0');
  return { base_date:`${y}${m}${d}`, base_time:`${H}00` };
}

function parseRN1(v: any): number|undefined {
  // "강수없음" | "1.0mm" | "50.0mm 이상" → 숫자
  if (v==null) return undefined;
  const s=String(v).trim();
  if (s.includes('강수없음')) return 0;
  const n=parseFloat(s.replace(/[^0-9.]/g,''));
  return isNaN(n) ? undefined : n;
}

function weights(wx: Wx): Weights {
  const T = wx.T1H ?? 20;
  const RN1 = wx.RN1 ?? 0;
  const PTY = wx.PTY ?? 0;
  const SKY = wx.SKY ?? 1;
  const REH = wx.REH ?? 50;
  const WSD = wx.WSD ?? 2;
  const SNO = wx.SNO;

  // 1.1 Temperature
  let W_cold = 0, W_hot = 0;
  if (T <= 10) W_cold = 1.0;
  else if (T < 22) W_cold = (22 - T) / 12;
  else W_cold = 0.0;
  if (T >= 28) W_hot = 1.0;
  else if (T >= 22) W_hot = (T - 22) / 6;

  // 1.2 Sky
  const W_gloom = SKY === 4 ? 1.0 : SKY === 3 ? 0.5 : 0.0;

  // 1.3 Precip
  let W_rain = 0, W_snow = 0;
  const rn = RN1;
  const rainish = [1,4,5].includes(PTY);
  const snowish = [3,6,7].includes(PTY);
  if (PTY === 2) {
    if (T > 1) {
      if (rn > 5) W_rain = 1.0; else if (rn >= 1) W_rain = 0.8; else W_rain = 0.4;
    } else {
      const sno = SNO ?? rn/2;
      if (sno > 2.0) W_snow = 1.0; else if (sno >= 0.5) W_snow = 0.7; else W_snow = 0.3;
    }
  } else if (rainish) {
    if (rn > 5) W_rain = 1.0; else if (rn >= 1) W_rain = 0.8; else W_rain = 0.4;
  } else if (snowish) {
    const sno = SNO ?? rn/2;
    if (sno > 2.0) W_snow = 1.0; else if (sno >= 0.5) W_snow = 0.7; else W_snow = 0.3;
  }

  // 1.4 Humidity
  let W_humid = 0;
  if (REH > 90) W_humid = 1.0;
  else if (REH >= 60) W_humid = (REH - 60) / 30;

  // 1.5 Wind
  let W_wind = 0;
  if (WSD > 14) W_wind = 1.0;
  else if (WSD >= 9) W_wind = 0.7;
  else if (WSD >= 4) W_wind = 0.3;

  return { W_cold, W_hot, W_gloom, W_rain, W_snow, W_humid, W_wind };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    if (!isFinite(lat) || !isFinite(lng)) {
      return NextResponse.json({ error:'INVALID_COORDS' }, { status:400 });
    }

    const key = process.env.KMA_API_KEY; // URL-encoded 일반키
    const { nx, ny } = toGrid(lat, lng);
    const { base_date, base_time } = kstBase();

    let wx: Wx = {};
    if (key) {
      const url = `${KMA_HOST}/${SERVICE}?serviceKey=${key}&numOfRows=50&pageNo=1&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;
      const r = await fetch(url, { cache:'no-store' });
      if (r.ok) {
        const j = await r.json().catch(()=>null);
        const items = j?.response?.body?.items?.item ?? [];
        for (const it of items) {
          const c = it.category, v = it.obsrValue;
          if (c==='T1H') wx.T1H = Number(v);
          else if (c==='RN1') wx.RN1 = parseRN1(v);
          else if (c==='PTY') wx.PTY = Number(v);
          else if (c==='SKY') wx.SKY = Number(v);
          else if (c==='REH') wx.REH = Number(v);
          else if (c==='WSD') wx.WSD = Number(v);
          else if (c==='SNO') wx.SNO = Number(v);
        }
      }
    }

    const w = weights(wx);
    return NextResponse.json({ wx, weights: w });
  } catch (e:any) {
    const w = weights({});
    return NextResponse.json({ wx: {}, weights: w, note:'fallback' }, { status:200 });
  }
}

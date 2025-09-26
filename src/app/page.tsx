// src/app/page.tsx
'use client';
import { useEffect, useState } from 'react';

type Reco = { name:string; score:number };
type Res = { weights:any; results: Reco[] };

export default function Home(){
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string>();
  const [w,setW]=useState<any>();
  const [results,setResults]=useState<Reco[]>([]);

  useEffect(()=>{
    (async()=>{
      try{
        setLoading(true);
        const pos = await new Promise<GeolocationPosition>((ok,no)=>
          navigator.geolocation.getCurrentPosition(ok,no,{ enableHighAccuracy:true, timeout:8000 })
        );
        const res = await fetch('/api/reco',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        });
        if(!res.ok) throw new Error('추천 실패');
        const json:Res = await res.json();
        setW(json.weights);
        setResults(json.results);
      }catch(e:any){ setErr(e?.message||'오류'); }
      finally{ setLoading(false); }
    })();
  },[]);

  if(loading) return <div className="min-h-screen grid place-items-center">로딩…</div>;
  if(err) return <div className="min-h-screen grid place-items-center text-red-600">에러: {err}</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-extrabold">오늘 점심 추천</h1>
        <p className="text-sm text-gray-600">
          가중치 · cold:{w.W_cold?.toFixed?.(2)??'0.00'}
          {' '}hot:{w.W_hot?.toFixed?.(2)??'0.00'}
          {' '}rain:{w.W_rain?.toFixed?.(2)??'0.00'}
          {' '}snow:{w.W_snow?.toFixed?.(2)??'0.00'}
          {' '}humid:{w.W_humid?.toFixed?.(2)??'0.00'}
          {' '}wind:{w.W_wind?.toFixed?.(2)??'0.00'}
          {' '}gloom:{w.W_gloom?.toFixed?.(2)??'0.00'}
        </p>
        <ul className="space-y-2">
          {results.map(r=>(
            <li key={r.name} className="p-3 rounded-lg border flex justify-between">
              <span>{r.name}</span>
              <span className="font-mono">{r.score.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
